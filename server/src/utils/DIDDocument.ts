// DID文档接口
interface VerificationMethod
{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk?: object;
    publicKeyMultibase?: string;
}

interface ServiceEndpoint
{
    id: string;
    type: string | string[];
    serviceEndpoint: string | string[] | object | object[];
}

export interface DIDDocument
{
    '@context': string | string[];
    id: string;
    alsoKnownAs?: string[];
    controller?: string | string[];
    verificationMethod?: VerificationMethod[];
    authentication?: (string | VerificationMethod)[];
    assertionMethod?: (string | VerificationMethod)[];
    keyAgreement?: (string | VerificationMethod)[];
    capabilityInvocation?: (string | VerificationMethod)[];
    capabilityDelegation?: (string | VerificationMethod)[];
    service?: ServiceEndpoint[];
    created: string;
    updated: string;
    versionId: string;
}