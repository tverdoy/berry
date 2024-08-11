import {Blockchain, SandboxContract, TreasuryContract} from "@ton/sandbox";
import {Berry} from "../build/Berry/tact_Berry";
import {
    DeployBerry,
    ExceptFailed,
    ExceptSuccess,
    ExceptTransactions,
    GetRandomAlbumTitle,
    GetRandomSongTitle,
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
        const albumLengthSongs = await album.getLenghtSongs();
        const albumSongs = await album.getSongs();

        expect(albumTitleFoo).toEqual(albumTitleBlockchain)
        expect(albumLengthSongs).toEqual(1n)
        expect(albumSongs.size).toEqual(1)
        expect(albumSongs.get(albumSongs.keys()[0])).toEqualAddress(song.address)

        const songOwner = await song.getOwner()
        const albumOwner = await album.getOwner()
        const songOwnerOf = await song.getOwnerSong()
        const albumOwnerOf = await album.getOwnerAlbum()

        expect(songOwner).toEqualAddress(berry.address)
        expect(albumOwner).toEqualAddress(berry.address)
        expect(songOwnerOf).toEqualAddress(deployer.address)
        expect(albumOwnerOf).toEqualAddress(deployer.address)

        ExceptTransactions(sendResult.transactions, [
            {from: deployer.address, to: berry.address},
            {from: berry.address, to: album.address},
            {from: album.address, to: berry.address},
            {from: berry.address, to: song.address},
            {from: song.address, to: berry.address},
            {from: berry.address, to: deployer.address},
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
            {from: song.address, to: berry.address},
            {from: berry.address, to: deployer.address},
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
        const songAlbumAddress = await song.getAlbum()
        const album: SandboxContract<Album> = blockchain.openContract(Album.fromAddress(songAlbumAddress!))

        const balanceDeployerAfter = await deployer.getBalance()
        const balanceBerryAfter = (await blockchain.getContract(berry.address)).balance
        const songBalance = (await blockchain.getContract(song.address)).balance
        const albumBalance = (await blockchain.getContract(album.address)).balance

        expect(-(balanceDeployerAfter - balanceDeployerBefore)).toBeLessThan(toNano("0.6"))
        expect(balanceBerryAfter - balanceBerryBefore).toBeGreaterThan(toNano("0.01"))
        expect(songBalance).toBeLessThanOrEqual(toNano("0.2"))
        expect(albumBalance).toBeLessThanOrEqual(toNano("0.2"))
    });

    it('double add same song with album', async () => {
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

        const sendResult2 = await berry.send(
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

        ExceptSuccess(sendResult2, deployer.address, berry.address)

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

        ExceptTransactions(sendResult2.transactions, [
            {from: deployer.address, to: berry.address},
            {from: berry.address, to: album.address},
            {from: album.address, to: berry.address},
            {from: berry.address, to: deployer.address},
        ])
    });

    it('double add same song without album', async () => {
        const balanceDeployerBefore = await deployer.getBalance()
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

        const sendResult2 = await berry.send(
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

        ExceptSuccess(sendResult2, deployer.address, berry.address)

        const addressSong = await berry.getSongAddress(songTitleFoo, null)
        const song: SandboxContract<Song> = blockchain.openContract(Song.fromAddress(addressSong))

        ExceptTransactions(sendResult2.transactions, [
            {from: deployer.address, to: berry.address},
            {from: berry.address, to: song.address},
            {from: song.address, to: berry.address},
            {from: berry.address, to: deployer.address},
        ])

        const songsTotal = await berry.getTotalSongs()
        expect(Number(songsTotal)).toEqual(1)

        const balanceDeployerAfter = await deployer.getBalance()
        expect(-(balanceDeployerAfter - balanceDeployerBefore)).toBeLessThan(toNano("0.4"))
    });
})