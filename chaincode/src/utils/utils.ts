import { ec as EC } from 'elliptic';
import shajs from 'sha.js';
import multibase from 'multibase';
import { Buffer } from 'buffer';

async function signData(data: string, privateKeyBase64: string): Promise<string>
{
    const ec = new EC('secp256k1');
    const privateKeyHex = Buffer.from(privateKeyBase64, 'base64').toString('hex');
    const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');

    const hash = shajs('sha256').update(data).digest('hex');
    const signature = keyPair.sign(hash, 'hex');
    const signatureBase64 = Buffer.from(signature.toDER()).toString('base64');

    return signatureBase64;
}

async function verifySignature(data: string, signatureBase64: string, publicKeyBase58btc: string): Promise<boolean>
{
    const ec = new EC('secp256k1');
    const publicKeyArray = multibase.decode(Buffer.from(publicKeyBase58btc, 'utf-8'));
    const keyPair = ec.keyFromPublic(publicKeyArray, 'array');

    const hash = shajs('sha256').update(data).digest('hex');
    const signatureDER = Buffer.from(signatureBase64, 'base64');

    return keyPair.verify(hash, signatureDER);
}

export { signData, verifySignature }