import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Berry } from '../wrappers/Berry';
import '@ton/test-utils';
import {Song} from "../build/Song/tact_Song";

const songTitle = "Trap day"


describe('Berry', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let berry: SandboxContract<Berry>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        berry = blockchain.openContract(await Berry.fromInit(deployer.address));


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
    });

    it('add song', async () => {
        const addSongResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano("0.02")
            },
            {
                $$type: "AddSong",
                title: songTitle
            }
        )

        expect(addSongResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: berry.address,
            success: true,
        });

        const addressSong = await berry.getSongAddress(songTitle)
        const song: SandboxContract<Song> = blockchain.openContract(Song.fromAddress(addressSong))

        const songTitleBlockchain = await song.getTitle()
        expect(songTitle).toEqual(songTitleBlockchain)
    });
});
