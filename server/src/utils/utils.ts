import * as path from 'path';
import { promises as fs } from 'fs';
import { ec as EC } from 'elliptic';
import multibase from 'multibase';
import crypto from 'crypto';
import shajs from 'sha.js';
/**
 * envOrDefault() will return the value of an environment variable, or a default value if the variable is undefined.
 */
function envOrDefault(key: string, defaultValue: string): string
{
    return process.env[key] || defaultValue;
}

async function getFirstDirFileName(dirPath: string): Promise<string>
{
    const files = await fs.readdir(dirPath);
    const file = files[0];
    if (!file) {
        throw new Error(`No files in directory: ${dirPath}`);
    }
    return path.join(dirPath, file);
}

/**
 * Converts a Base64 encoded private key to PEM format.
 *
 * @param base64PrivateKey The private key in Base64 format.
 * @returns The private key in PEM format.
 */
function convertBase64ToPEM(base64PrivateKey: string): string
{
    // Decode the Base64 string to hexadecimal
    const privateKeyHex = Buffer.from(base64PrivateKey, 'base64').toString('hex');

    // Convert hexadecimal key to PEM format
    let pemKey = '-----BEGIN EC PRIVATE KEY-----\n';
    let formattedKey = '';
    for (let i = 0; i < privateKeyHex.length; i += 64) {
        formattedKey += privateKeyHex.substring(i, i + 64) + '\n';
    }
    pemKey += formattedKey + '-----END EC PRIVATE KEY-----';
    return pemKey;
}

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

function generateMerkleTree(hashAssertions: any[])
{
    if (hashAssertions.length === 0) {
        throw new Error("Empty array");
    }

    if (hashAssertions.length === 1) {
        return hashAssertions[0];
    }

    const nextLevel: string[] = [];
    for (let i = 0; i < hashAssertions.length; i += 2) {
        const leftHash = hashAssertions[i];
        const rightHash = (i + 1 < hashAssertions.length) ? hashAssertions[i + 1] : leftHash;
        const combinedHash = shajs('sha256').update(leftHash + rightHash).digest('hex');
        nextLevel.push(combinedHash);
    }

    return generateMerkleTree(nextLevel);
}
export { envOrDefault, getFirstDirFileName, signData, verifySignature, generateMerkleTree };

