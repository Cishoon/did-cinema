import { signData } from "./utils";
import { VerifiableCredential } from "./VerifiableCredentials";
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';


async function createBirthYearCredential(issuerDID: string, subjectDID: string, birthYear: number, privateKey: string): Promise<VerifiableCredential>
{
    const credentialSubject = {
        id: subjectDID,
        birthYear: birthYear
    };

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

export { createBirthYearCredential }