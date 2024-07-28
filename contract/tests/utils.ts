import {randomInt} from "node:crypto";
import {
    Blockchain,
    BlockchainTransaction,
    prettyLogTransaction,
    SandboxContract,
    SendMessageResult,
    TreasuryContract
} from "@ton/sandbox";
import {Berry} from "../build/Berry/tact_Berry";
import {Address, toNano} from "@ton/core";
import {FlatTransactionComparable} from "@ton/test-utils";

const songTitles = ["Goloden", "Good Times", "Fine shine"]
const albumTitles = ["Supreme swings", "OMG", "Skywalker"]

export function GetRandomSongTitle() {
    return songTitles[randomInt(0, songTitles.length)]
}

export function GetRandomAlbumTitle() {
    return albumTitles[randomInt(0, albumTitles.length)]
}

export async function DeployBerry(blockchain: Blockchain, deployer: SandboxContract<TreasuryContract>): Promise<SandboxContract<Berry>> {
    const berry = blockchain.openContract(await Berry.fromInit(deployer.address));


    const deployResult = await berry.send(
        deployer.getSender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        },
    );

    expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: berry.address,
        deploy: true,
        success: true,
    });

    let owner = await berry.getOwner()
    expect(owner).toEqualAddress(deployer.address)

    return berry
}

export function ExceptSuccess(result: SendMessageResult, from: Address, to: Address) {
    expect(result.transactions).toHaveTransaction({
        from: from,
        to: to,
        success: true,
        deploy: false
    })
}

export function ExceptTransactions(transactions: BlockchainTransaction[], checks:  FlatTransactionComparable[]) {
    checks.forEach((check) => {
        expect(transactions).toHaveTransaction(check)
    })

    expect(transactions.length - 1).toEqual(checks.length)
}

/**
 * Log transaction using `console.log` with name of contract. Logs base on result of {@link prettyLogTransaction}.
 * Example output:
 * ```
 *  1 - deployer  ➡️  berry ➡️  0.1844936 💎 album
 * ```
 * @param transactions Transactions to log
 * @param contracts Matches address and it names
 *
 * Example use:
 * ```
 * PrettyLogNamedTransactions(sendResult.transactions, [
 *      {name: "deployer", address: deployer.address},
 *      {name: "berry", address: berry.address},
 *      {name: "song", address: song.address},
 *      {name: "album", address: album.address},
 * ])
 *```
 */
export function PrettyLogNamedTransactions(transactions: BlockchainTransaction[], contracts: {address: Address, name: string}[]) {
    for (let i = 0; i < transactions.length - 1; i++) {
        let pretty = prettyLogTransaction(transactions[i])
        contracts.forEach(contract => {
            pretty = pretty.replace(contract.address.toString(), contract.name)
        })

        console.log(`${i} - ${pretty}`)
    }
}