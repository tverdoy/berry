import {Blockchain, SandboxContract, TreasuryContract} from "@ton/sandbox";
import {Berry} from "../build/Berry/tact_Berry";
import {
    DeployBerry,
    ExceptFailed,
    ExceptSuccess,
    ExceptTransactions,
    GetRandomAlbumTitle,
    GetRandomSongTitle, PrettyLogNamedTransactions,
} from "./utils";
import {fromNano, toNano} from "@ton/core";
import {Song} from "../build/Song/tact_Song";
import {Album} from "../build/Song/tact_Album";
import '@ton/test-utils';


describe('Song', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let berry: SandboxContract<Berry>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        berry = await DeployBerry(blockchain, deployer);
    });

    it('add song with album', async () => {
        const songTitleFoo = GetRandomSongTitle()
        const albumTitleFoo = GetRandomAlbumTitle()

        const sendResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano("10")
            },
            {
                $$type: "AddSong",
                songTitle: songTitleFoo,
                albumTitle: albumTitleFoo
            }
        )
        ExceptSuccess(sendResult, deployer.address, berry.address)

        const addressSong = await berry.getSongAddress(songTitleFoo, albumTitleFoo)
        const song: SandboxContract<Song> = blockchain.openContract(Song.fromAddress(addressSong))

        const songTitleBlockchain = await song.getTitle()
        expect(songTitleFoo).toEqual(songTitleBlockchain)

        const songAlbumAddress = await song.getAlbum()
        expect(songAlbumAddress).not.toBeNull()

        if (songAlbumAddress == null) {
            return
        }

        const album: SandboxContract<Album> = blockchain.openContract(Album.fromAddress(songAlbumAddress))
        const albumTitleBlockchain = await album.getTitle()

        expect(albumTitleFoo).toEqual(albumTitleBlockchain)


        const songOwner = await song.getOwner()
        const albumOwner = await album.getOwner()

        expect(songOwner).toEqualAddress(berry.address)
        expect(albumOwner).toEqualAddress(berry.address)

        ExceptTransactions(sendResult.transactions, [
            {from: deployer.address, to: berry.address},
            {from: berry.address, to: album.address},
            {from: album.address, to: berry.address},
            {from: berry.address, to: song.address},
            {from: song.address, to: deployer.address},
        ])

        const songTotal = await berry.getTotalSongs()
        const albumTotal = await berry.getTotalAlbums()
        expect(songTotal).toBeLessThanOrEqual(1n)
        expect(albumTotal).toBeLessThanOrEqual(1n)
    });

    it('add song without album', async () => {
        const songTitleFoo = GetRandomSongTitle()
        const sendResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano("10")
            },
            {
                $$type: "AddSong",
                songTitle: songTitleFoo,
                albumTitle: null
            }
        )

        ExceptSuccess(sendResult, deployer.address, berry.address)

        const addressSong = await berry.getSongAddress(songTitleFoo, null)
        const song: SandboxContract<Song> = blockchain.openContract(Song.fromAddress(addressSong))

        const songTitleBlockchain = await song.getTitle()
        expect(songTitleFoo).toEqual(songTitleBlockchain)

        const songAlbumAddress = await song.getAlbum()
        expect(songAlbumAddress).toBeNull()

        const songOwner = await song.getOwner()
        expect(songOwner).toEqualAddress(berry.address)

        ExceptTransactions(sendResult.transactions, [
            {from: deployer.address, to: berry.address},
            {from: berry.address, to: song.address},
            {from: song.address, to: deployer.address},
        ])

        const songTotal = await berry.getTotalSongs()
        const albumTotal = await berry.getTotalAlbums()
        expect(songTotal).toBeLessThanOrEqual(1n)
        expect(albumTotal).toBeLessThanOrEqual(0n)
    });

    it('should failed with empty song title', async () => {
        const sendResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano("10"),
            },
            {
                $$type: "AddSong",
                songTitle: "",
                albumTitle: GetRandomAlbumTitle()
            }
        )

        ExceptFailed(sendResult, deployer.address, berry.address)
        ExceptTransactions(sendResult.transactions, [
            {from: deployer.address, to: berry.address},
            {from: berry.address, to: deployer.address},
        ])

        const songTotal = await berry.getTotalSongs()
        const albumTotal = await berry.getTotalAlbums()
        expect(songTotal).toBeLessThanOrEqual(0n)
        expect(albumTotal).toBeLessThanOrEqual(0n)
    });

    it('should failed with empty album title', async () => {
        const sendResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano("10")
            },
            {
                $$type: "AddSong",
                songTitle: GetRandomSongTitle(),
                albumTitle: ""
            }
        )

        ExceptFailed(sendResult, deployer.address, berry.address)
        ExceptTransactions(sendResult.transactions, [
            {from: deployer.address, to: berry.address},
            {from: berry.address, to: deployer.address},
        ])

        const songTotal = await berry.getTotalSongs()
        const albumTotal = await berry.getTotalAlbums()
        expect(songTotal).toBeLessThanOrEqual(0n)
        expect(albumTotal).toBeLessThanOrEqual(0n)
    });

    it('should failed because length song title overflow', async () => {
        const songTitleFoo = GetRandomSongTitle()

        const sendResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano("10")
            },
            {
                $$type: "AddSong",
                songTitle: songTitleFoo.repeat(100),
                albumTitle: null
            }
        )

        ExceptFailed(sendResult, deployer.address, berry.address)
    });

    it('fee check', async () => {
        const balanceDeployerBefore = await deployer.getBalance()
        const balanceBerryBefore = (await blockchain.getContract(berry.address)).balance

        const songTitleFoo = GetRandomSongTitle()
        const albumTitleFoo = GetRandomAlbumTitle()

        const sendResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano("10")
            },
            {
                $$type: "AddSong",
                songTitle: songTitleFoo,
                albumTitle: albumTitleFoo
            }
        )

        ExceptSuccess(sendResult, deployer.address, berry.address)

        const addressSong = await berry.getSongAddress(songTitleFoo, albumTitleFoo)
        const song: SandboxContract<Song> = blockchain.openContract(Song.fromAddress(addressSong))

        const songTitleBlockchain = await song.getTitle()
        expect(songTitleFoo).toEqual(songTitleBlockchain)

        const songAlbumAddress = await song.getAlbum()
        expect(songAlbumAddress).not.toBeNull()

        if (songAlbumAddress == null) {
            return
        }

        const album: SandboxContract<Album> = blockchain.openContract(Album.fromAddress(songAlbumAddress))
        const albumTitleBlockchain = await album.getTitle()

        expect(albumTitleFoo).toEqual(albumTitleBlockchain)


        const songOwner = await song.getOwner()
        const albumOwner = await album.getOwner()

        expect(songOwner).toEqualAddress(berry.address)
        expect(albumOwner).toEqualAddress(berry.address)

        ExceptTransactions(sendResult.transactions, [
            {from: deployer.address, to: berry.address},
            {from: berry.address, to: album.address},
            {from: album.address, to: berry.address},
            {from: berry.address, to: song.address},
            {from: song.address, to: deployer.address},
        ])

        const songTotal = await berry.getTotalSongs()
        const albumTotal = await berry.getTotalAlbums()
        expect(songTotal).toBeLessThanOrEqual(1n)
        expect(albumTotal).toBeLessThanOrEqual(1n)

        const balanceDeployerAfter = await deployer.getBalance()
        const balanceBerryAfter = (await blockchain.getContract(berry.address)).balance
        const songBalance = (await blockchain.getContract(song.address)).balance
        const albumBalance = (await blockchain.getContract(album.address)).balance

        expect(balanceDeployerAfter - balanceDeployerBefore).toBeGreaterThan(-toNano("0.6"))
        expect(balanceBerryAfter - balanceBerryBefore).toBeGreaterThan(toNano("0.01"))
        expect(songBalance).toBeLessThanOrEqual(toNano("0.2"))
        expect(albumBalance).toBeLessThanOrEqual(toNano("0.2"))
    });
})