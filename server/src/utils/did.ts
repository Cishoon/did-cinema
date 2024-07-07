import { ec as EC } from 'elliptic';
import multibase from 'multibase';
import { Buffer } from 'buffer'

interface KeyPair
{
    publicKey: string;
    privateKey: string;
}

async function generateKeyPair(): Promise<KeyPair>
{
    // 创建和初始化secp256k1的EC上下文
    const ec = new EC('secp256k1');

    // 生成密钥对
    const keyPair = ec.genKeyPair();

    // 获取压缩格式的公钥
    const publicKey = keyPair.getPublic(true, "array");

    // 将公钥编码为base58btc格式，确保使用Multibase标准中指定的'z'字符开始
    const publicKeyBase58btcArray = multibase.encode('base58btc', Buffer.from(publicKey));
    const publicKeyBase58btc = Buffer.from(publicKeyBase58btcArray).toString('utf-8');

    // 将私钥转换为Base64格式的字符串
    const privateKeyHex = keyPair.getPrivate('hex');
    const privateKeyBase64 = Buffer.from(privateKeyHex, 'hex').toString('base64');

    return {
        publicKey: publicKeyBase58btc,
        privateKey: privateKeyBase64
    };
}

async function generateDID(method: string, specificId: string)
{
    return `did:${method}:${specificId}`;
}

async function generateDIDDocument(did: string, type: string, publicKeyMultibase: string)
{
    return {
        '@context': 'https://www.w3.org/ns/did/v1',
        id: did,
        versionId: '1.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        verificationMethod: [
            {
                id: `${did}#keys-1`,
                type: type,
                controller: did,
                publicKeyMultibase: publicKeyMultibase
            }
        ],
        authentication: `${did}#keys-1`
    };
}

export { generateKeyPair, generateDID, generateDIDDocument };