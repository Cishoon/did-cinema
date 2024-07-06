import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { DIDDocument } from './DIDDocument';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';

@Info({ title: 'DID', description: 'Smart contract for DID' })
export class DIDContract extends Contract
{
    // 创建DID文档
    @Transaction()
    public async createDID(ctx: Context, did: string, didDocumentString: string): Promise<void>
    {
        const exists = await this.didExists(ctx, did);
        if (exists) {
            throw new Error(`DID ${did} already exists`);
        }

        let didDocument: DIDDocument = JSON.parse(didDocumentString);

        // 验证DID文档是否符合规范
        if (!didDocument.id || didDocument.id !== did) {
            throw new Error(`DID Document ID does not match provided DID ${did}`);
        }
        if (!didDocument['@context']) {
            throw new Error(`DID Document must contain @context`);
        }

        await ctx.stub.putState(did, Buffer.from(stringify(sortKeysRecursive(didDocument))));
    }

    // 更新
    @Transaction()
    public async updateDID(ctx: Context, did: string, didDocumentString: string): Promise<void>
    {
        const exists = await this.didExists(ctx, did);
        if (!exists) {
            throw new Error(`DID ${did} does not exist`);
        }

        let didDocument: DIDDocument = JSON.parse(didDocumentString);

        // 验证DID文档是否符合规范
        if (!didDocument.id || didDocument.id !== did) {
            throw new Error(`DID Document ID does not match provided DID ${did}`);
        }
        if (!didDocument['@context']) {
            throw new Error(`DID Document must contain @context`);
        }

        await ctx.stub.putState(did, Buffer.from(stringify(sortKeysRecursive((didDocument)))));
    }

    // 根据DID获取DID文档
    @Transaction(false)
    @Returns('string')
    public async getDIDDocument(ctx: Context, did: string): Promise<string>
    {
        const didDocumentBytes = await ctx.stub.getState(did);
        if (!didDocumentBytes || didDocumentBytes.length === 0) {
            throw new Error(`DID ${did} does not exist`);
        }
        return didDocumentBytes.toString();
    }

    // 检查DID是否存在
    @Transaction(false)
    @Returns('boolean')
    public async didExists(ctx: Context, did: string): Promise<boolean>
    {
        const didDocumentBytes = await ctx.stub.getState(did);
        return didDocumentBytes && didDocumentBytes.length > 0;
    }



}