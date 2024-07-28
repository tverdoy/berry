import "@stdlib/deploy";
import "@stdlib/ownable";


const MaxSongsInAlbum: Int = 50;

message AddSongToAlbum {
    songAddress: Address;
    songTitle: String
}

message AddedSongToAlbumNotification {
    songTitle: String;
    albumTitle: String
}

contract Album with Ownable {
    owner: Address;
    title: String;
    songs: map<Int as uint16, Address>;
    lenghtSongs: Int = 0;

    init(owner: Address, title: String) {
        self.owner = owner;
        self.title = title;
    }

    receive(addSong: AddSongToAlbum) {
        require(context().sender == self.owner, "Only the owner can add songs to the album");

        require(self.lenghtSongs + 1 <= MaxSongsInAlbum, "No space in the album for new song!");
        require(!self.hasSong(addSong.songAddress), "The song is already on the album");

        self.lenghtSongs += 1;
        self.songs.set(self.lenghtSongs, addSong.songAddress);


        send(SendParameters{
            to:  self.owner,
            value: 0,
            bounce: false,
            mode: SendRemainingValue,
            body: AddedSongToAlbumNotification{
                songTitle: addSong.songTitle,
                albumTitle: self.title
            }.toCell(),
        });
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
