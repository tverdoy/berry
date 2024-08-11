import "@stdlib/deploy";
import "@stdlib/ownable";


const MaxSongsInAlbum: Int = 50;    // Maximum number of songs in an album

// Message for adding a song to the Album contract
message AddSongToAlbum {
    ownerAlbum: Address;        // Owner of the album
    songAddress: Address;       // Address of the song
    songTitle: String;          // Title of the song
    ownerSongAddress: Address;  // Owner of the song
}

const AddedSongToAlbumStatusOk: Int = 1;                // Status code for adding a song to the album
const AddedSongToAlbumOwnerAlreadySet: Int = 220;       // Status code for owner of album already set
const AddedSongToAlbumSongsInAlbumOverflow: Int = 221;  // Status code for songs in album overflow
const AddedSongToAlbumSongAlreadyOnAlbum: Int = 222;    // Status code for song already on the album

// Message notification when a song is added to the album
message AddedSongToAlbumNotify {
    songTitle: String;  // Title of the song
    albumTitle: String; // Title of the album

    ownerSongAddress: Address;  // Owner of the song
    status: Int;                // Status code
    isWasInit: Bool = false;    // Flag for checking if the album was initialized
}

// Message for removing a song from the Album contract
message RemoveSongFromAlbum {
    songAddress: Address;   // Address of the song
    ownerSongAddress: Address;
}

// Message notification when a song is removed from the album
message RemoveSongFromAlbumNotify {
    albumTitle: String;         // Title of the album
    ownerSongAddress: Address;  // Owner of the song
}

trait AlbumMaster {
    owner: Address;

    totalAlbums: Int;   // Total number albums

    // Get total number albums
    get fun totalAlbums(): Int {
        return self.totalAlbums
    }

    // Get the address of the song.
    get fun albumAddress(albumTitle: String): Address {
        return contractAddress(initOf Album(myAddress(), albumTitle));
    }

}

// Album is a contract that manages an album.
contract Album with Ownable {
    override const storageReserve: Int = ton("0.2"); // Should be same as TonForStorageAlbum

    owner: Address;

    ownerAlbum: Address?;                   // Owner of the album
    title: String;                          // Title of the album
    songs: map<Int, Address>;               // List of songs in the album
    lenghtSongs: Int = 0;                   // Number of songs in the album

    init(owner: Address, title: String) {
        self.owner = owner;
        self.title = title;
    }

    receive() {}

    // Add a song to the album and notify the owner.
    receive(addSong: AddSongToAlbum) {
        self.requireOwner();
        let status = AddedSongToAlbumStatusOk;
        let isWasInit = self.ownerAlbum != null;

        if (self.ownerAlbum != null && self.ownerAlbum != addSong.ownerAlbum) {
            status = AddedSongToAlbumOwnerAlreadySet;       // Owner of album already set
        } else if (self.lenghtSongs >= MaxSongsInAlbum) {
            status = AddedSongToAlbumSongsInAlbumOverflow;  // Songs in album is overflow
        } else if (self.hasSong(addSong.songAddress)) {
            status = AddedSongToAlbumSongAlreadyOnAlbum;    // The song is already on the album
        } else {
            self.ownerAlbum = addSong.ownerAlbum;
            self.songs.set(addSong.songTitle.asComment().hash(), addSong.songAddress);
            self.lenghtSongs += 1;
        }

        self.notify(AddedSongToAlbumNotify {
            songTitle: addSong.songTitle,
            albumTitle: self.title,
            ownerSongAddress: addSong.ownerSongAddress,
            status: status,
            isWasInit: isWasInit
        }.toCell());
    }

    // Remove a song from the album and notify the owner.
    receive(removeSong: RemoveSongFromAlbum) {
        self.requireOwner();
        self.lenghtSongs -= 1;

        self.notify(RemoveSongFromAlbumNotify{
            albumTitle: self.title,
            ownerSongAddress: removeSong.ownerSongAddress
        }.toCell());
    }

    get fun title(): String {
        return self.title
    }

    get fun songs(): map<Int, Address> {
        return self.songs
    }

    get fun lenghtSongs(): Int {
        return self.lenghtSongs
    }

    get fun ownerAlbum(): Address? {
        return self.ownerAlbum
    }

    // Return true if the song is in the album.
    fun hasSong(song: Address): Bool {
        foreach (key, value in self.songs) {
           if value == song {
               return true
           }
        }

        return false
    }
}
