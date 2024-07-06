import { VerifiableCredential, VerifiablePresentation } from "./VerifiableCredentials";
import { signData } from "../utils";

// 打包VC成VP
export async function createVerifiablePresentation(did: string, verifiableCredentials: VerifiableCredential[], privateKey: string): Promise<VerifiablePresentation>
{
    const vpWithoutProof: Omit<VerifiablePresentation, 'proof'> = {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiablePresentation"],
        verifiableCredential: verifiableCredentials
    };

    // Serializing the data to be signed
    const dataToSign = JSON.stringify(vpWithoutProof);

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