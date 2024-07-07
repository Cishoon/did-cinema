import { generateKeyPair } from "../utils/did";
import { ec as EC } from 'elliptic';
import multibase from 'multibase';
import crypto from 'crypto';
import shajs from 'sha.js';
import { signData } from "../utils/utils";

import { MerkleTree } from "../utils/MerkleTree";


async function main()
{
    let hashFunctionWithoutSalt = (input: string) => { return shajs("sha256").update(input).digest("hex") };
    // let hashFunctionWithoutSalt = (input: string) => { return input };
    let seed = "1324564897";
    let nodes = ["a", "b", "c", "d", "e", "f", "g", "h"];

    let merkleTree = new MerkleTree(
        nodes,
        seed,
    )

    let salts = merkleTree.getSalts();



    // console.log(merkleTree.getRoot());
    // console.log(merkleTree.getMerklesibling(0));
    // console.log(merkleTree.calculateRootBySibling(merkleTree.getMerklesibling(0), "a", 0));
    const root = merkleTree.getRoot();
    const leaf = "f";
    const index = 5;
    const sibling = merkleTree.getMerklesibling(index);
    const calculatedRoot = MerkleTree.calculateRootBySibling(sibling, leaf, salts[index], index);

    console.log(root)
    console.log(sibling)
    console.log(calculatedRoot)
    console.log(root == calculatedRoot);
}


console.log("=================================================")
main();
