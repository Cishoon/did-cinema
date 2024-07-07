import shajs from "sha.js";

export class MerkleTree
{
    public static defaultHashFunction(input: string): string
    {
        return shajs("sha256").update(input).digest("hex");
    }

    private hashFunction: (input: string) => string;
    private salts: string[];
    private saltSeed: string;
    private nodes: string[];

    private __removeSalt: boolean; // for testing

    constructor(
        nodes: string[],
        saltSeed: string,
        hashFunction: (input: string) => string = MerkleTree.defaultHashFunction,
        __removeSalt: boolean = false)
    {
        this.hashFunction = hashFunction;
        this.saltSeed = saltSeed;
        this.nodes = nodes;
        this.salts = [];
        for (let i = 0; i < nodes.length; i++) {
            this.salts.push(this.hashFunction(this.saltSeed + i.toString()));
        }

        this.__removeSalt = __removeSalt;
    }

    private getLeafLevel(): string[]
    {
        if (this.__removeSalt) {
            return this.nodes.map((node, index) => this.hashFunction(node));
        }

        return this.nodes.map((node, index) => this.hashFunction(node + this.salts[index]));
    }

    // Returns the root of the Merkle tree
    public getRoot(): string
    {
        let currentLevel = this.getLeafLevel();

        while (currentLevel.length > 1) {
            let nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                if (i + 1 < currentLevel.length) {
                    nextLevel.push(this.hashFunction(currentLevel[i] + currentLevel[i + 1]));
                } else {
                    nextLevel.push(this.hashFunction(currentLevel[i] + currentLevel[i]));
                }
            }
            currentLevel = nextLevel;
        }
        return currentLevel[0];
    }

    public getMerklesibling(index: number): string[]
    {
        let currentLevel = this.getLeafLevel();
        let siblings: string[] = [];

        while (currentLevel.length > 1) {
            let nextLevel = [];
            for (let i = 0; i < currentLevel.length; i += 2) {
                if (i + 1 < currentLevel.length) {
                    nextLevel.push(this.hashFunction(currentLevel[i] + currentLevel[i + 1]));

                    if (i == index) siblings.push(currentLevel[i + 1]);
                    if (i + 1 == index) siblings.push(currentLevel[i]);

                } else {
                    nextLevel.push(this.hashFunction(currentLevel[i] + currentLevel[i]));

                    if (i == index) siblings.push(currentLevel[i]);
                }
            }
            currentLevel = nextLevel;
            index = Math.floor(index / 2);
        }

        return siblings;
    }

    public getSalts(): string[]
    {
        return this.salts;
    }

    public static calculateRootBySibling(
        sibling: string[],
        leaf: string,
        leafSalt: string,
        index: number,
        hashFunction: (input: string) => string = MerkleTree.defaultHashFunction
    ): string
    {
        let currentNode = hashFunction(leaf + leafSalt);
        for (let i = 0; i < sibling.length; i++) {
            if (index % 2 == 0) {
                currentNode = hashFunction(currentNode + sibling[i]);
            } else {
                currentNode = hashFunction(sibling[i] + currentNode);
            }
            index = Math.floor(index / 2);
        }
        return currentNode;
    }
}
