interface VerifiableCredential
{
    "@context": string | string[];
    id?: string;
    type: string[];
    issuer: string | { id: string; name?: string };
    issuanceDate: string;
    credentialSubject: CredentialSubject | CredentialSubject[];
    proof?: Proof;
    expirationDate?: string;
    credentialStatus?: CredentialStatus;
}

interface CredentialSubject
{
    id?: string;
    [property: string]: any;  // 可以包含任意其他属性，如name, spouse, degree等
}

interface Proof
{
    type: string;
    created?: string;
    verificationMethod?: string;
    proofPurpose?: string;
    proofValue?: string;
}

interface CredentialStatus
{
    id: string;
    type: string;
}

interface VerifiablePresentation
{
    "@context": string | string[];
    id?: string;
    type: string[];
    verifiableCredential: VerifiableCredential[];
    holder?: string;
    proof?: Proof;
}



export { VerifiableCredential, CredentialSubject, Proof, CredentialStatus, VerifiablePresentation }