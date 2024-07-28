import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {address, beginCell, toNano} from '@ton/core';
import { Berry } from '../wrappers/Berry';
import '@ton/test-utils';
import {Song} from "../build/Song/tact_Song";
import {Album} from "../build/Song/tact_Album";

const songTitle = "Trap day"
const albumTitle = "Supreme swings"

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

    it('add song with album', async () => {
        const addSongResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano("0.2")
            },
            {
                $$type: "AddSong",
                title: songTitle,
                albumTitle: albumTitle
            }
        )

        console.log(addSongResult.transactions.length)
        expect(addSongResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: berry.address,
            success: true,
        });

        const addressSong = await berry.getSongAddress(songTitle, albumTitle)
        const song: SandboxContract<Song> = blockchain.openContract(Song.fromAddress(addressSong))

        const songTitleBlockchain = await song.getTitle()
        expect(songTitle).toEqual(songTitleBlockchain)

        const songAlbumAddress = await song.getAlbum()
        expect(songAlbumAddress).not.toBeNull()

        if (songAlbumAddress == null) {
            return
        }

        const album: SandboxContract<Album> = blockchain.openContract(Album.fromAddress(songAlbumAddress))
        const albumTitleBlockchain = await album.getTitle()

        expect(albumTitle).toEqual(albumTitleBlockchain)
    });
});
