import express from 'express';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
var cors = require('cors');

import { envOrDefault, getFirstDirFileName, verifySignature } from './utils/utils';
import { generateDIDDocument, generateDID, generateKeyPair } from './utils/did';
import { checkBirthYearMerkeTreeProof, checkVCProof, checkVPProof, createBirthYearCredential, createBirthYearCredentialByMerkleTree } from './utils/vc';
import { fetchMovies, getMovieById } from './moviesAPI';
import { get } from 'http';
import { NFTicket } from './utils/NFTicket';

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static("public"))
app.use(cors())
const PORT = 3000;

const mspId = envOrDefault('MSP_ID', 'Org1MSP');

// Path to crypto materials.
const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com'));

// Path to user private key directory.
const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));

// Path to user certificate directory.
const certDirectoryPath = envOrDefault('CERT_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts'));

// Path to peer tls certificate.
const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));

// Gateway peer endpoint.
const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

// Gateway peer SSL host name override.
const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

const utf8Decoder = new TextDecoder();

let contract: Contract;

async function newGrpcConnection(): Promise<grpc.Client>
{
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity>
{
    const certPath = await getFirstDirFileName(certDirectoryPath);
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner(): Promise<Signer>
{
    const keyPath = await getFirstDirFileName(keyDirectoryPath);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

app.get('/', (req, res) =>
{
    res.send('Hello World!');
});



async function connectToGateway()
{
    const client = await newGrpcConnection();
    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        evaluateOptions: () =>
        {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        endorseOptions: () =>
        {
            return { deadline: Date.now() + 15000 }; // 15 seconds
        },
        submitOptions: () =>
        {
            return { deadline: Date.now() + 5000 }; // 5 seconds
        },
        commitStatusOptions: () =>
        {
            return { deadline: Date.now() + 60000 }; // 1 minute
        },
    });

    return { client, gateway };
}

app.get('/api/movies', async (req, res) =>
{
    try {
        // Fetch all movies from the database or any other data source
        const movies = await fetchMovies();
        res.json(movies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/api/movies/verify", async (req, res) =>
{
    const { ticketId, signedTicketId } = req.body;

    // 先根据ticketId获取电影票
    let result;
    let nfticket: NFTicket;
    try {
        result = await contract.evaluateTransaction('NFTicketContract:queryNFTicket', ticketId);
        nfticket = JSON.parse(Buffer.from(result).toString());
    } catch (error) {
        console.error('Error fetching movies:', error);
        return res.json({ verified: false, message: "该NFT电影票不存在！" });
    }

    // 检查是否过期
    const expirationDate = new Date(nfticket.expirationDate);
    if (expirationDate < new Date()) {
        return res.json({ verified: false, message: "该NFT电影票已过期！" });
    }

    const ownerDid = nfticket.ownerDid;
    // 根据ownerDid获取DID文档
    const result2 = await contract.evaluateTransaction('getDIDDocument', ownerDid);
    const didDocument = JSON.parse(Buffer.from(result2).toString('utf-8'));
    // 获取公钥
    const publicKeyMultibase = didDocument?.verificationMethod?.[0]?.publicKeyMultibase || ''; // Add null check and default value assignment
    if (!publicKeyMultibase) {
        return false;
    }

    // 验证签名
    const verified = await verifySignature(ticketId, signedTicketId, publicKeyMultibase);
    if (verified) {
        return res.json({ verified: true, message: `验证成功！正在播放：${nfticket.movie}`, title: nfticket.movie });
    } else {
        return res.json({ verified: false, message: "验证失败，您没有该NFT电影票的使用权限！" });
    }
})

app.post('/api/movies/buyticket', async (req, res) =>
{
    const { movieId, did, vp } = req.body;
    if (!movieId || !did) {
        return res.status(400).send('缺少必要参数：movieId, did');
    }

    const movie = await getMovieById(movieId); // Call the getMovieById function
    if (!movie) {
        return res.status(404).send('电影不存在！');
    }

    const expirationDate = new Date();
    // 电影票有效期为2天
    expirationDate.setDate(expirationDate.getDate() + 2);
    const expirationDateString = expirationDate.toISOString();

    // 如果没有年龄限制，直接创建电影票
    if (movie.ageLimit === 0) {
        const ticket = await contract.submitTransaction('NFTicketContract:createNFTicket', movie.title, expirationDateString, did);
        return res.json({
            "message": "购票成功！",
            "ticket": Buffer.from(ticket).toString()
        })
    }

    // 提供VP，验证年龄
    if (!vp) {
        return res.status(400).send('该电影有年龄限制，必须提供出生年份证明！');
    }

    // 验证VP
    if (vp.proof && !await checkVPProof(contract, vp)) {
        return res.status(400).send('VP签名错误！');
    }
    if (vp.verifiableCredential.length !== 1) {
        return res.status(400).send('VP中的VC数量不为1！');
    }
    const vc = vp.verifiableCredential[0];
    if (vc.proof && !await checkVCProof(contract, vc)) {
        return res.status(400).send('VC签名错误！');
    }
    // 获取VC中的credentialSubject
    const credentialSubject = vc.credentialSubject;
    const assert = credentialSubject.assert;

    // 今年的年份-18
    const adultYear = new Date().getFullYear() - 18;
    if (assert !== `${adultYear}:1`) {
        return res.status(400).send('断言不匹配，应该是${adultYear}:1');
    }

    const verified = await checkBirthYearMerkeTreeProof(contract, credentialSubject);
    if (!verified) {
        return res.status(400).send('验证失败！未满18岁或凭证内容有误。');
    }

    // 创建电影票
    const ticket = await contract.submitTransaction('NFTicketContract:createNFTicket', movie.title, expirationDateString, did);
    return res.json({
        "message": "购票成功！",
        "ticket": Buffer.from(ticket).toString()
    })
});


app.post('/api/sync/nfticket', async (req, res) =>
{
    const { ownerDid } = req.body;
    if (!ownerDid) {
        return res.status(400).send('缺少必要参数：ownerDid');
    }

    const nftickets = await contract.evaluateTransaction('NFTicketContract:getNFTicketsByOwner', ownerDid);
    console.log(Buffer.from(nftickets).toString())
    res.json(JSON.parse(Buffer.from(nftickets).toString()));
})


function displayInputParameters(): void
{
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certDirectoryPath: ${certDirectoryPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}


app.post('/api/did', async (req, res) =>
{
    const { type, publicKeyMultibase } = req.body;

    if (!type || !publicKeyMultibase) {
        return res.status(400).send('Missing required parameters: type, publicKeyMultibase');
    }

    const did = await generateDID("example", crypto.randomBytes(32).toString('hex'));
    const didDocument = await generateDIDDocument(did, type, publicKeyMultibase);

    await contract.submitTransaction('createDID', did, JSON.stringify(didDocument));

    res.json({ did, document: didDocument });
});

app.get('/api/did/:did', async (req, res) =>
{
    const { did } = req.params;
    console.log(`Get DID: ${did}`);

    const result = await contract.evaluateTransaction('getDIDDocument', `${did}`);
    const didDocument = JSON.parse(Buffer.from(result).toString('utf-8'));
    res.json(didDocument);
});

app.post('/api/vc/birthday/apply', async (req, res) =>
{
    const { birthyear, did } = req.body;
    if (!birthyear || !did) {
        return res.status(400).send('Missing required parameters: birthyear, did');
    }

    const result = await fs.readFile('./wallet/vcissuer.json')
    if (!result) {
        return res.status(400).send('VC Issuer不存在！');
    }
    const keyPair = JSON.parse(result.toString());
    const privateKey = keyPair.privateKey;

    const vc = await createBirthYearCredential("did:example:vcissuer", did, birthyear, privateKey);
    res.json(vc);
});

app.post('/api/vc/birthday_merkle/apply', async (req, res) =>
{
    const { birthyear, did } = req.body;
    if (!birthyear || !did) {
        return res.status(400).send('Missing required parameters: birthyear, did');
    }

    const result = await fs.readFile('./wallet/vcissuer.json')
    if (!result) {
        return res.status(400).send('VC Issuer不存在！');
    }
    const keyPair = JSON.parse(result.toString());
    const privateKey = keyPair.privateKey;

    const vc = await createBirthYearCredentialByMerkleTree("did:example:vcissuer", did, birthyear, privateKey, contract);
    res.json(vc);
})

app.post('/api/vc/birthday/verify', async (req, res) =>
{
    const { vp } = req.body;
    if (vp.proof && !await checkVPProof(contract, vp)) {
        res.json({ verified: false, message: "VP签名错误！" });
        return;
    }
    if (vp.verifiableCredential.length !== 1) {
        res.json({ verified: false, message: "VP中的VC数量不为1！" });
        return;
    }
    const vc = vp.verifiableCredential[0];
    if (vc.proof && !await checkVCProof(contract, vc)) {
        res.json({ verified: false, message: "VC签名错误！" });
        return;
    }

    // 获取VC中的credentialSubject
    const credentialSubject = vc.credentialSubject;
    res.json({ verified: true, message: `验证成功！出生年份为${credentialSubject.birthYear}` });
});

app.post('/api/vc/birthday_merkle/verify', async (req, res) =>
{
    const { vp } = req.body;
    if (vp.proof && !await checkVPProof(contract, vp)) {
        res.json({ verified: false, message: "VP签名错误！" });
        return;
    }
    if (vp.verifiableCredential.length !== 1) {
        res.json({ verified: false, message: "VP中的VC数量不为1！" });
        return;
    }
    const vc = vp.verifiableCredential[0];
    if (vc.proof && !await checkVCProof(contract, vc)) {
        res.json({ verified: false, message: "VC签名错误！" });
        return;
    }
    // 获取VC中的credentialSubject
    const credentialSubject = vc.credentialSubject;

    const verified = await checkBirthYearMerkeTreeProof(contract, credentialSubject);


    // res.json({ verified: verified, message: `验证结果` });
    if (verified) {
        const birthYear = credentialSubject.assert.split(":")[0];
        const birthStatus = credentialSubject.assert.split(":")[1] === "1" ? "已出生" : "未出生";
        // res.json({ verified: true, message: `验证成功！出生年份为${credentialSubject.birthYear}` });
        res.json({
            verified: true,
            message: `验证成功！在${birthYear}，该用户${birthStatus}`
        })
    } else {
        res.json({ verified: false, message: `验证失败！凭证内容有误。` });
    }
});


async function createVCIssuser(contract: Contract)
{
    // 检查是否已经有did:example:vcissuer, 如果有，直接返回
    let result = await contract.evaluateTransaction('didExists', 'did:example:vcissuer');
    if (Buffer.from(result).toString() === 'true') {
        console.log("VC Issuer已经存在，无需创建！");

        // 获取VC Issuer的DID文档
        const result = await contract.evaluateTransaction('getDIDDocument', 'did:example:vcissuer');
        console.log(Buffer.from(result).toString('utf-8'));
        return;
    }

    const keyPair = await generateKeyPair();
    // 没有文件夹的话，创建文件夹
    await fs.mkdir('./wallet', { recursive: true });
    await fs.writeFile('./wallet/vcissuer.json', JSON.stringify(keyPair));

    const did = await generateDID("example", "vcissuer");
    const didDocument = await generateDIDDocument(did, 'secp256k1', keyPair.publicKey);

    await contract.submitTransaction('createDID', did, JSON.stringify(didDocument));
    console.log("创建VC Issuer成功！")
}




async function executeBeforeServerStart()
{
    displayInputParameters();

    const { client, gateway } = await connectToGateway();
    const network = await gateway.getNetwork('w3c-did');
    contract = network.getContract('did-contract');

    await createVCIssuser(contract);
}

async function startServer()
{
    await executeBeforeServerStart();

    app.listen(PORT, '0.0.0.0', () =>
    {
        console.log(`Server is running on port ${PORT}`);
        console.log("=================================")
    });
}
startServer();


