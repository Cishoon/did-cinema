import { Context, Contract, Returns, Transaction } from 'fabric-contract-api';
import stringify from 'json-stringify-deterministic';
import sortKeysRecursive from 'sort-keys-recursive';
import { NFTicket } from './NFTicket';
import { DIDDocument } from '../did/DIDDocument';
import { verifySignature } from '../utils/utils';

export class NFTicketContract extends Contract
{
    @Transaction()
    @Returns('string')
    public async createNFTicket(ctx: Context, movie: string, expirationDate: string, ownerDid: string): Promise<string>
    {
        const ticketId = ctx.stub.getTxID();
        const nfticket: NFTicket = {
            ticketId,
            movie,
            expirationDate,
            ownerDid
        };

        await ctx.stub.putState(ticketId, Buffer.from(stringify(sortKeysRecursive(nfticket))));

        return stringify(sortKeysRecursive(nfticket));
    }

    @Transaction(false)
    @Returns('string')
    public async queryNFTicket(ctx: Context, ticketId: string): Promise<string>
    {
        const nfticketBytes = await ctx.stub.getState(ticketId);
        if (!nfticketBytes || nfticketBytes.length === 0) {
            throw new Error(`NFTicket with ID ${ticketId} does not exist`);
        }
        return nfticketBytes.toString();
    }

    @Transaction(false)
    @Returns('boolean')
    public async nfticketExists(ctx: Context, ticketId: string): Promise<boolean>
    {
        const nfticketBytes = await ctx.stub.getState(ticketId);
        return nfticketBytes && nfticketBytes.length > 0;
    }

    @Transaction(false)
    @Returns('boolean')
    public async verifyNFTicketOwner(ctx: Context, ticketId: string, signedTickedId: string): Promise<boolean>
    {
        const nfticketBytes = await ctx.stub.getState(ticketId);
        if (!nfticketBytes || nfticketBytes.length === 0) {
            throw new Error(`NFTicket with ID ${ticketId} does not exist`);
        }
        const nfticket: NFTicket = JSON.parse(nfticketBytes.toString());

        // return nfticket.ownerDid === signedTickedId;
        const didDocument = await this.getDIDDocumentFromDIDContract(ctx, nfticket.ownerDid);

        const publicKeyMultibase = didDocument?.verificationMethod?.[0]?.publicKeyMultibase || ''; // Add null check and default value assignment
        if (!publicKeyMultibase) {
            return false;
        }

        // Verify the signature
        return await verifySignature(ticketId, signedTickedId, publicKeyMultibase);
    }

    @Transaction(false)
    @Returns('string')
    public async getNFTicketsByOwner(ctx: Context, ownerDid: string): Promise<string>
    {
        const queryString = JSON.stringify({
            selector: {
                ownerDid: ownerDid
            }
        });

        const iterator = await ctx.stub.getQueryResult(queryString);
        const allResults = await this.getAllResults(iterator);

        return stringify(allResults);
    }
    private async getAllResults(iterator: any): Promise<NFTicket[]>
    {
        const results: NFTicket[] = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const nfticket: NFTicket = JSON.parse(res.value.value.toString('utf8'));
                results.push(nfticket);
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
        return results;
    }

    private async getDIDDocumentFromDIDContract(ctx: Context, did: string): Promise<DIDDocument>
    {
        const didContractName = 'DIDContract'; // Name of the deployed DIDContract
        const functionName = 'getDIDDocument'; // Function to call in DIDContract
        const args = [did]; // Arguments to pass to the function

        // Invoke the DIDContract function
        const response = await ctx.stub.invokeChaincode(didContractName, [functionName, ...args], 'mychannel');

        if (response.status !== 200 || !response.payload) {
            throw new Error(`Failed to invoke chaincode. Status: ${response.status}, Message: ${response.message}`);
        }

        let didDocument: DIDDocument = JSON.parse(Buffer.from(response.payload).toString());
        return didDocument;
    }

}

export default NFTicketContract;