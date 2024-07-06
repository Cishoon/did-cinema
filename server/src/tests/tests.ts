import { generateKeyPair } from "../utils/did";
import { ec as EC } from 'elliptic';
import multibase from 'multibase';
import crypto from 'crypto';

async function signData(data: string, privateKeyBase64: string): Promise<string>
{
    const ec = new EC('secp256k1');
    const privateKeyHex = Buffer.from(privateKeyBase64, 'base64').toString('hex');
    const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');

    const hash = crypto.createHash('sha256').update(data).digest();
    const signature = keyPair.sign(hash);
    const signatureBase64 = Buffer.from(signature.toDER()).toString('base64');

    return signatureBase64;
}

async function verifySignature(data: string, signatureBase64: string, publicKeyBase58btc: string): Promise<boolean>
{
    const ec = new EC('secp256k1');
    const publicKeyArray = multibase.decode(Buffer.from(publicKeyBase58btc, 'utf-8'));
    const keyPair = ec.keyFromPublic(publicKeyArray, 'array');

    const hash = crypto.createHash('sha256').update(data).digest();
    const signatureDER = Buffer.from(signatureBase64, 'base64');

    return keyPair.verify(hash, signatureDER);
}

async function main()
{
    const { publicKey, privateKey } = await generateKeyPair();

    const data = "Hello, world!";

    // 使用私钥给数据签名
    const signature = await signData(data, privateKey);
    console.log('Signature:', signature);

    // 使用公钥校验签名
    const isValid = await verifySignature(data, signature, publicKey);
    console.log('Signature valid:', isValid);
    
    // 修改数据，校验签名
    const modifiedData = "Hello, world?";
    const isValidModifiedData = await verifySignature(modifiedData, signature, publicKey);
    console.log('Modified data signature valid:', isValidModifiedData);
}

main();