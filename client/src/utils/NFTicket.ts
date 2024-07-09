interface NFTicket
{
    ticketId: string;
    movie: string;
    expirationDate: string;
    ownerDid: string;
}

class NFTicketManager
{
    public static NFTicketKey = 'NFTickets';

    public static async storeNFTicketAsync(NFTicket: NFTicket): Promise<void>
    {
        let NFTickets = await this.getNFTicketsAsync();
        NFTickets.push(NFTicket);
        localStorage.setItem(NFTicketManager.NFTicketKey, JSON.stringify(NFTickets));
    }

    public static async getNFTicketsAsync(): Promise<string[]>
    {
        const NFTicketsString = localStorage.getItem(NFTicketManager.NFTicketKey) || '[]';
        return JSON.parse(NFTicketsString) as NFTicket[];
    }
}

export { NFTicketManager };
export type { NFTicket };

