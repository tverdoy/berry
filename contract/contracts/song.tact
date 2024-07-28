import "@stdlib/deploy";
import "@stdlib/ownable";
import "./album";

message AddSong {
    songTitle: String;
    albumTitle: String?;
}

trait SongMaster {
    totalSongs: Int;
    totalAlbums: Int;

    receive(addSong: AddSong) {
        if (addSong.albumTitle != null) {
            self.createAlbum(addSong.albumTitle!!, addSong.songTitle)
        } else {
            self.createSong(addSong.songTitle, null)
        }
    }

    receive(addSong: AddedSongToAlbumNotification) {
        self.createSong(addSong.songTitle, addSong.albumAddress)
    }

    fun createSong(songTitle: String, albumAddress: Address?) {
        let songInit = self.getSongInit(songTitle, albumAddress);

        send(SendParameters{
            to: contractAddress(songInit),
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            code: songInit.code,
            data: songInit.data
        });
    }

    fun createAlbum(albumTitle: String, songTitle: String) {
        let albumInit = self.getAlbumInit(albumTitle);
        let songAddress = self.songAddress(songTitle, albumTitle);
        self.totalAlbums += 1;

        send(SendParameters{
            to:  contractAddress(albumInit),
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: AddSongToAlbum{
                songAddress: songAddress,
                songTitle: songTitle
            }.toCell(),
            code: albumInit.code,
            data: albumInit.data
        });
    }

    get fun songAddress(songTitle: String, albumTitle: String?): Address {
        let albumAddress: Address? = null;
        if albumTitle != null {
            let albumInit: StateInit = self.getAlbumInit(albumTitle!!);
            albumAddress = contractAddress(albumInit);
        }

        let songInit: StateInit = self.getSongInit(songTitle, albumAddress);

        return contractAddress(songInit)
    }

    fun getSongInit(songTitle: String, albumAdddress: Address?): StateInit {
        return initOf Song(myAddress(), songTitle, albumAdddress);
    }

    fun getAlbumInit(albumTitle: String): StateInit {
        return initOf Album(myAddress(), albumTitle);
    }
}

contract Song with Ownable {
    owner: Address;
    title: String;
    albumAddress: Address?;

    init(owner: Address, title: String, albumAddress: Address?) {
        self.owner = owner;
        self.title = title;
        self.albumAddress = albumAddress;
    }

    get fun title(): String {
        return self.title
    }

    get fun album(): Address? {
        return self.albumAddress
    }
}

