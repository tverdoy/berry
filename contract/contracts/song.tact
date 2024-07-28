import "@stdlib/deploy";
import "@stdlib/ownable";
import "./album";

message AddSong {
    title: String;
    albumTitle: String?;
}

trait SongMaster {
    receive(addSong: AddSong) {
        if (addSong.albumTitle != null) {
            let albumInit = self.getAlbumInit(addSong.albumTitle!!);
            let songAddress = self.songAddress(addSong.title, addSong.title);

            send(SendParameters{
                to:  contractAddress(albumInit),
                value: 0,
                bounce: false,
                mode: SendRemainingValue,
                body: AddSongToAlbum{
                    songAddress: songAddress,
                    songTitle: addSong.title
                }.toCell(),
                code: albumInit.code,
                data: albumInit.data
            });
        } else {
            self.createSong(addSong.title, null)
        }
    }

    receive(addSong: AddedSongToAlbumNotification) {
        self.createSong(addSong.songTitle, addSong.album)
    }

    fun createSong(title: String, album: Address?) {
        let songInit = self.getSongInit(title, album);

        send(SendParameters{
            to: contractAddress(songInit),
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            code: songInit.code,
            data: songInit.data
        });
    }

    get fun songAddress(title: String, albumTitle: String?): Address {
        let albumAddress: Address? = null;
        if albumTitle != null {
            let albumInit: StateInit = self.getAlbumInit(albumTitle!!);
            albumAddress = contractAddress(albumInit);
        }

        let songInit: StateInit = self.getSongInit(title, albumAddress);

        return contractAddress(songInit)
    }

    fun getSongInit(title: String, album: Address?): StateInit {
        return initOf Song(myAddress(), title, album);
    }

    fun getAlbumInit(title: String): StateInit {
        return initOf Album(myAddress(), title);
    }
}

contract Song with Ownable {
    owner: Address;
    title: String;
    album: Address?;

    init(owner: Address, title: String, album: Address?) {
        self.owner = owner;
        self.title = title;
        self.album = album;
    }

    get fun title(): String {
        return self.title
    }

    get fun album(): Address? {
        return self.album
    }
}

