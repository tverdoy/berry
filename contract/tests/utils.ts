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

const songTitles = ["Goloden", "Good Times", "Fine shine"]  // Test data
const albumTitles = ["Supreme swings", "OMG", "Skywalker"]  // Test data

// Get random song title from test data
export function GetRandomSongTitle() {
    return songTitles[randomInt(0, songTitles.length)]
}

// Get random album title from test data
export function GetRandomAlbumTitle() {
    return albumTitles[randomInt(0, albumTitles.length)]
}

// Deploy Berry contract
export async function DeployBerry(blockchain: Blockchain, deployer: SandboxContract<TreasuryContract>): Promise<SandboxContract<Berry>> {
    const berry = blockchain.openContract(await Berry.fromInit(deployer.address));

    const deployResult = await berry.send(
        deployer.getSender(),
        {
            value: toNano('1'),
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

    return berry
}

// Check that transaction is successful
export function ExceptSuccess(result: SendMessageResult, from: Address, to: Address) {
    expect(result.transactions).toHaveTransaction({
        from: from,
        to: to,
        success: true,
        deploy: false
    })
}

// Check that transaction is failed
export function ExceptFailed(result: SendMessageResult, from: Address, to: Address) {
    expect(result.transactions).toHaveTransaction({
        from: from,
        to: to,
        aborted: true,
        deploy: false
    })
}

/**
 * Check that transactions match the checks and count transactions.
 * @param transactions Transactions to check
 * @param checks List of check rules
 *
 * Example use:
 * ```
 * ExceptTransactions(sendResult.transactions, [
 *      {from: deployer.address, to: berry.address},
 *      {from: berry.address, to: album.address, success: true},
 *      {from: album.address, to: berry.address, success: true},
 *      {from: berry.address, to: song.address, success: false, deploy: true},
 * ])
 * ```
 */
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
    for (let i = 0; i < transactions.length; i++) {
        let pretty = prettyLogTransaction(transactions[i])
        contracts.forEach(contract => {
            pretty = pretty.replace(contract.address.toString(), contract.name)
        })

        console.log(`${i} - ${pretty}`)
    }
}