import { Contract } from '@hyperledger/fabric-gateway';
import { generateMerkleTree, signData, verifySignature } from "./utils";
import { VerifiableCredential, VerifiablePresentation } from "./VerifiableCredentials";
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { DIDDocument } from "./DIDDocument";
import shajs from 'sha.js';
import crypto from 'crypto';
import path from 'path';
import { MerkleTree } from './MerkleTree';

async function createVCByCredentialSubject(issuerDID: string, subjectDID: string, credentialSubject: any, privateKey: string): Promise<VerifiableCredential>
{
    const vcWithoutProof: Omit<VerifiableCredential, 'proof'> = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "BirthYearCredential"],
        issuer: issuerDID,
        issuanceDate: new Date().toISOString(),
        credentialSubject: credentialSubject
    };

    // Serializing the data to be signed
    const dataToSign = stringify(sortKeysRecursive(vcWithoutProof));

    // Signing the data
    const proofValue = await signData(dataToSign, privateKey);

    const vc: VerifiableCredential = {
        ...vcWithoutProof,
        proof: {
            type: "secp256k1",
            created: new Date().toISOString(),
            verificationMethod: `${issuerDID}#keys-1`,
            proofPurpose: "assertionMethod",
            proofValue: proofValue
        }
    };

    return vc;
}

async function createBirthYearCredential(issuerDID: string, subjectDID: string, birthYear: number, privateKey: string): Promise<VerifiableCredential>
{
    const credentialSubject = {
        id: subjectDID,
        birthYear: birthYear
    };

    return await createVCByCredentialSubject(issuerDID, subjectDID, credentialSubject, privateKey);
}


// 通过Merkle Tree创建VC
async function createBirthYearCredentialByMerkleTree(issuerDID: string, subjectDID: string, birthYear: number, privateKey: string, contract: Contract): Promise<VerifiableCredential>
{
    const min = 1900;
    const max = 2020;
    const length = max - min + 3;
    // const birthYearIndex = birthYear - min + 1;
    // 如果小于1900是0，大于2020是length-1
    const birthYearIndex = birthYear < min ? 0 : birthYear > max ? length - 1 : birthYear - min + 1;
    const assertions = new Array(length).fill(0);
    assertions.fill(1, birthYearIndex);

    // 生成一个随机种子，用于生成加盐数据
    const seed = crypto.randomBytes(32).toString('hex');

    // 生成Merkle Tree
    const merkleTree = new MerkleTree(assertions, seed);
    const merkleTreeRoot = merkleTree.getRoot();

    // 给树根签名
    const rootSignature = await signData(merkleTreeRoot, privateKey);
    contract.submitTransaction("registerCredential", issuerDID, merkleTreeRoot);

    let description;
    if (birthYear < min) {
        description = `Assertion of birth year is less than ${min} using Merkle Tree.`;
    } else if (birthYear > max) {
        description = `Assertion of birth year is greater than ${max} using Merkle Tree.`;
    } else {
        description = `Assertion of birth year is ${birthYear} using Merkle Tree.`;
    }

    const birthYearAssert = {
        min: min,
        max: max,
        birthYearIndex: birthYearIndex,
        seed: seed,
        merkleTreeRoot: merkleTreeRoot,
        rootSignature: rootSignature,
        signer: `${issuerDID}#keys-1`,
        description: description
    }

    const credentialSubject = {
        id: subjectDID,
        birthYearAssert: birthYearAssert
    };

    return await createVCByCredentialSubject(issuerDID, subjectDID, credentialSubject, privateKey);
}

async function checkVPProof(contract: Contract, vp: VerifiablePresentation): Promise<boolean>
{
    // 验证VP的签名
    // 1. 获取VP.proof.verificationMethod对应的DID Document
    // 2. 使用DID Document中的publicKey验证VP.proof.proofValue

    // 获取VP.proof.verificationMethod对应的DID Document
    if (!vp.proof || !vp.proof.verificationMethod || !vp.proof.proofValue) return false;
    const verificationMethod = vp.proof.verificationMethod;
    const signature = vp.proof.proofValue;
    const did = verificationMethod.split('#')[0];

    let result = await contract.evaluateTransaction('getDIDDocument', did);
    const didDocument: DIDDocument = JSON.parse(Buffer.from(result).toString('utf-8'));

    // 使用DID Document中的publicKey验证VP.proof.proofValue
    // dataToVerify = VP without proof
    const { proof, ...dataToVerify } = vp;
    const publicKey = didDocument.verificationMethod?.find(vm => vm.id === verificationMethod)?.publicKeyMultibase;

    if (!publicKey) {
        console.error("publicKey not found")
        return false
    };

    const dataToVerifyString = stringify(sortKeysRecursive(dataToVerify));
    const verified = await verifySignature(dataToVerifyString, signature, publicKey);

    return verified;
}

// 检查VCIssuer是否有资格
async function checkVCIssuerAuthentication(contract: Contract, issuerDID: string): Promise<boolean>
{
    // 只有一个VC Issuer有资格，其DID为did:example:vcissuer
    return issuerDID === "did:example:vcissuer";
}

async function checkVCProof(contract: Contract, vc: VerifiableCredential): Promise<boolean>
{
    // 验证VC的签名
    // 1. 获取VC.issuer对应的DID Document
    // 2. 使用DID Document中的publicKey验证VC.proof.proofValue

    // 获取VC.issuer对应的DID Document
    if (!vc.issuer || !vc.proof || !vc.proof.proofValue) return false;
    const issuerDID = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer.id;
    const signature = vc.proof.proofValue;

    if (!await checkVCIssuerAuthentication(contract, issuerDID)) return false;

    let result = await contract.evaluateTransaction('getDIDDocument', issuerDID);
    const didDocument: DIDDocument = JSON.parse(Buffer.from(result).toString('utf-8'));


    // 使用DID Document中的publicKey验证VC.proof.proofValue
    // dataToVerify = VC without proof
    const { proof, ...dataToVerify } = vc;
    const publicKey = didDocument.verificationMethod?.find(vm => vm.id === vc.proof?.verificationMethod)?.publicKeyMultibase;


    if (!publicKey) {
        console.error("publicKey not found")
        return false
    };
    const dataToVerifyString = stringify(sortKeysRecursive(dataToVerify));
    const verified = await verifySignature(dataToVerifyString, signature, publicKey);

    return verified;

}

async function checkBirthYearMerkeTreeProof(contract: Contract, credentialSubject: any): Promise<boolean>
{
    const min = 1900;
    console.log("credentialSubject", credentialSubject);
    const { assert, dataIndex, salt, merklesibling, merkleTreeRoot, rootSignature, signer } = credentialSubject;

    // 先验证merkleTreeRoot的签名
    const signerDID = signer.split('#')[0];
    let result = await contract.evaluateTransaction('getDIDDocument', signerDID);
    const didDocument: DIDDocument = JSON.parse(Buffer.from(result).toString('utf-8'));
    const publicKey = didDocument.verificationMethod?.find(vm => vm.id === signer)?.publicKeyMultibase;
    if (!publicKey) {
        console.error("publicKey not found")
        return false
    }
    if (!await verifySignature(merkleTreeRoot, rootSignature, publicKey)) {
        console.error("rootSignature verification failed");
        return false;
    }
    const hasRegistedString = await contract.evaluateTransaction("checkCredential", signerDID, merkleTreeRoot)
    const hasRegisted = Buffer.from(hasRegistedString).toString('utf-8') === "true";
    if (!hasRegisted) {
        console.error("merkleTreeRoot not registed");
        return false;
    }

    // 判断声明和数据是否匹配
    // const index = parseInt(assert.split(':')[0]) - min + 1;
    const index = dataIndex;
    const leaf = assert.split(':')[1];

    // 验证默克尔路径是否正确
    if (merklesibling === "") {
        return false;
    }

    const calculatedRoot = MerkleTree.calculateRootBySibling(
        merklesibling.split(' '),
        leaf,
        salt,
        index
    );

    return calculatedRoot === merkleTreeRoot;
}

export { createBirthYearCredential, checkVPProof, checkVCProof, createBirthYearCredentialByMerkleTree, checkBirthYearMerkeTreeProof }