import express from 'express';
import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
var cors = require('cors');

import { envOrDefault, getFirstDirFileName } from './utils/utils';
import { generateDIDDocument, generateDID, generateKeyPair } from './utils/did';
import { createBirthYearCredential } from './utils/vc';

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
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

    const result = await fs.readFile('./wallet/vcissuer.json')
    if (!result) {
        return res.status(400).send('VC Issuer不存在！');
    }
    const keyPair = JSON.parse(result.toString());
    const privateKey = keyPair.privateKey;

    const vc = await createBirthYearCredential("did:example:vcissuer", did, birthyear, privateKey);
    console.log(vc)
    res.json(vc);
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
    });
}
startServer();

