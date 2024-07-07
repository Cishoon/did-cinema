import { VerifiableCredential, VerifiablePresentation } from "./VerifiableCredentials";
import { signData } from "../utils";
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import shajs from 'sha.js';
import { MerkleTree } from "../MerkleTree";

// 打包VC成VP
async function createVerifiablePresentation(did: string, verifiableCredentials: VerifiableCredential[], privateKey: string): Promise<VerifiablePresentation>
{
    const vpWithoutProof: Omit<VerifiablePresentation, 'proof'> = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiablePresentation"],
        verifiableCredential: verifiableCredentials
    };

    // Serializing the data to be signed
    // const dataToSign = JSON.stringify(vpWithoutProof);
    const dataToSign = stringify(sortKeysRecursive(vpWithoutProof));


    // Signing the data
    const proofValue = await signData(dataToSign, privateKey);

    const vp: VerifiablePresentation = {
        ...vpWithoutProof,
        proof: {
            type: "secp256k1",
            created: new Date().toISOString(),
            verificationMethod: `${did}#keys-1`,
            proofPurpose: "authentication",
            proofValue: proofValue
        }
    };

    return vp;
}

/**
 * 匿名化VC
 * @param oldVc 旧VC
 * @param assertBirthYear 断言的出生年份，格式为"YYYY:{0/1}"，0表示不出生，1表示出生, 例如"1999:1"表示1999年已经出生，"1999:0"表示1999年还未出生
 */
async function anonymousVC(oldVc: VerifiableCredential, assertBirthYear: string): Promise<VerifiableCredential>
{
    const { credentialSubject, proof, ...vcWithoutProofAndCredentialSubject } = oldVc;
    // 校验数据是否合法
    if (Array.isArray(credentialSubject)) {
        // throw new Error("credentialSubject should not be an array");
        throw new Error("credentialSubject 不应该是一个数组");
    }

    if (assertBirthYear.split(":").length !== 2) {
        // throw new Error("assertBirthYear format error");
        throw new Error("assertBirthYear 格式错误");
    }

    const { min, max, birthYearIndex, seed } = credentialSubject.birthYearAssert;
    /*
    min: 1900,
    max: 2020,
    birthYearIndex: 0: 小于1900, 1-121: 1900-2020 min + birthYearIndex - 1, 122: 大于2020
     */
    const assertBirthYearNum = parseInt(assertBirthYear.split(":")[0]);
    const assertBirthYearFlag = parseInt(assertBirthYear.split(":")[1]);
    const dataIndex = assertBirthYearNum - min + 1;
    if (assertBirthYearNum < min || assertBirthYearNum > max) {
        // throw new Error("assertBirthYear out of range, it should be in [" + min + ", " + max + "]");
        throw new Error("出生年份 超出范围，应该在 [" + min + ", " + max + "]");
    }
    if (assertBirthYearFlag !== 0 && assertBirthYearFlag !== 1) {
        // throw new Error("assertBirthYearFlag should be 0 or 1");
        throw new Error("出生状态 应该是 0 或 1");
    }

    // 如果asserBirthFlag == 0，assertBirthNum必须小于min + birthYearIndex - 1
    // if (assertBirthYearFlag === 0 && assertBirthYearNum >= min + birthYearIndex - 1) {
    //     throw new Error("assertBirthYearNum should be less than " + (min + birthYearIndex - 1) + " when assertBirthYearFlag is 0");
    // }
    // 如果asserBirthFlag == 1，assertBirthNum必须大于等于min + birthYearIndex - 1
    // if (assertBirthYearFlag === 1 && assertBirthYearNum < min + birthYearIndex - 1) {
    //     throw new Error("assertBirthYearNum should be greater than or equal to " + (min + birthYearIndex - 1) + " when assertBirthYearFlag is 1");
    // }

    // 生成默克尔验证路径
    const length = max - min + 3
    let assertions = new Array(length).fill(0);
    assertions.fill(1, birthYearIndex);

    const merkleTree = new MerkleTree(assertions, seed);
    let path = merkleTree.getMerklesibling(dataIndex);

    // merklesibling 把path中的值按顺序连接起来，中间以空格分割
    let merklesibling: string;
    if (path.length === 0) {
        merklesibling = "";
    } else {
        merklesibling = path.join(" ");
    }


    const newCredentialSubject = {
        id: credentialSubject.id,
        assert: assertBirthYear,
        salt: merkleTree.getSalts()[dataIndex],
        merklesibling: merklesibling,
        merkleTreeRoot: credentialSubject.birthYearAssert.merkleTreeRoot,
        rootSignature: credentialSubject.birthYearAssert.rootSignature,
        signer: credentialSubject.birthYearAssert.signer
    }

    const newVC = {
        ...vcWithoutProofAndCredentialSubject,
        credentialSubject: newCredentialSubject
    };
    return newVC;
}


export { createVerifiablePresentation, anonymousVC };

