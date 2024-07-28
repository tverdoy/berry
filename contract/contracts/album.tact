import "@stdlib/deploy";
import "@stdlib/ownable";


const MaxSongsInAlbum: Int = 50;    // Maximum number of songs in an album

// Message for adding a song to the Album contract
message AddSongToAlbum {
    songAddress: Address;   // Address of the song
    songTitle: String;      // Title of the song

    forwardAddress: Address;
}

// Message notification when a song is added to the album
message AddedSongToAlbumNotification {
    songTitle: String;  // Title of the song
    albumTitle: String; // Title of the album

    forwardAddress: Address;
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
    owner: Address;
    title: String;                          // Title of the album
    songs: map<Int as uint16, Address>;     // List of songs in the album
    lenghtSongs: Int = 0;                   // Number of songs in the album

    init(owner: Address, title: String) {
        self.owner = owner;
        self.title = title;
    }

    // Add a song to the album and notify the owner.
    receive(addSong: AddSongToAlbum) {
        require(sender() == self.owner, "Only the owner can add songs to the album");
        require(self.lenghtSongs + 1 <= MaxSongsInAlbum, "No space in the album for new song!");
        require(!self.hasSong(addSong.songAddress), "The song is already on the album");

        self.lenghtSongs += 1;
        self.songs.set(self.lenghtSongs, addSong.songAddress);

        self.reply(AddedSongToAlbumNotification{
            songTitle: addSong.songTitle,
            albumTitle: self.title,
            forwardAddress: addSong.forwardAddress
        }.toCell());
    }

    get fun title(): String {
        return self.title
    }

    fun hasSong(song: Address): Bool {
        let i = 0;
        repeat (self.lenghtSongs) {
            if self.songs.get(i) == song {
                return true
            }

            i += 1;
        }

        return false
    }

}
