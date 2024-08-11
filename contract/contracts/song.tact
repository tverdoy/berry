import "@stdlib/deploy";
import "@stdlib/ownable";
import "./album";

const MaxBytesTitleChars: Int = 800;

const TonForStorageSong: Int = ton("0.2");
const FeeForAddSong: Int = ton("0.01");

// Message for adding a song to the SongMaster contract
message AddSong {
    songTitle: String;      // Title of the song
    albumTitle: String?;    // Title of the album. Optional because a song can be added without an album
}

// SongMaster is the main contract that manages songs.
//
// Can:
// - Add songs (with and without an album)
//
// Add song message flow:
//      1. Deployer -> Berry (SongMaster) [AddSong]
//      if [AddSong].albumTitle is not null then create album:
//          2. Berry (SongMaster) -> Album [AddSongToAlbum]
//          3. Album -> Berry (SongMaster) [AddedSongToAlbumNotification]
//          4. Berry (SongMaster) -> Song [init]
//      else create song:
//          2. Berry (SongMaster) -> Song [init]
trait SongMaster {
    owner: Address;

    totalSongs: Int;    // Total number songs
    totalAlbums: Int;   // Total number albums

    // Add a song to the system.
    // If [AddSong].albumTitle is not null then create an album.
    // Otherwise, create a song.
    receive(addSong: AddSong) {
        require(sender() == self.owner, "Only the owner can add songs");

        // business logic checks
        let songTitleBytes = addSong.songTitle.asSlice().bits();
        require(songTitleBytes <= MaxBytesTitleChars, "Song title cannot be more than 100 characters");

        if (addSong.albumTitle != null) {
            let albumTitleBytes = addSong.albumTitle!!.asSlice().bits();
            require(songTitleBytes != 0, "Song title cannot be empty");
            require(albumTitleBytes != 0, "Album title cannot be empty");
            require(albumTitleBytes <= MaxBytesTitleChars, "Album title cannot be more than 100 characters");
        }

        if (addSong.albumTitle != null) {
            self.createAlbum(addSong.albumTitle!!, addSong.songTitle, sender())
        } else {
            self.createSong(addSong.songTitle, null, sender())
        }
    }

    // This message notification from Album contract when a song is added to the album.
    // It is used to create a song in the SongMaster contract.
    receive(addSong: AddedSongToAlbumNotification) {
        let albumAddress = contractAddress(initOf Album(myAddress(), addSong.albumTitle));
        require(sender() == albumAddress, "Only Album contract can notify add songs to the album");

        self.createSong(addSong.songTitle, albumAddress, addSong.forwardAddress)
    }

    // Get the address of the song.
    get fun songAddress(songTitle: String, albumTitle: String?): Address {
        let albumAddress = albumTitle != null ? contractAddress(initOf Album(myAddress(), albumTitle!!)) : null;
        return contractAddress(self.getSongInit(songTitle, albumAddress));
    }

    // Bounce if failed to add song to album
    bounced(_: bounced<AddSongToAlbum>) {
        self.totalAlbums -= 1;
    }

    // Get total number songs
    get fun totalSongs(): Int {
        return self.totalSongs
    }

    // Send a message to the Song contract to create a song.
    fun createSong(songTitle: String, albumAddress: Address?, forwardAddress: Address) {
        let songInit = self.getSongInit(songTitle, albumAddress);
        let forwardValue = context().value - (FeeForAddSong + context().readForwardFee() * 25);

        send(SendParameters{
            to: contractAddress(songInit),
            value: forwardValue,
            mode: SendPayGasSeparately,
            body: ForwardAddSong{
                forwardAddress: forwardAddress
            }.toCell(),
            bounce: false,
            code: songInit.code,
            data: songInit.data
        });
    }

    // Send a message to the Album contract to create an album.
    fun createAlbum(albumTitle: String, songTitle: String, forwardAddress: Address) {
        let albumInit = initOf Album(myAddress(), albumTitle);
        let songAddress = self.songAddress(songTitle, albumTitle);
        self.totalAlbums += 1;

        send(SendParameters{
            to:  contractAddress(albumInit),
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
            body: AddSongToAlbum {
                songAddress: songAddress,
                songTitle: songTitle,
                forwardAddress: forwardAddress
            }.toCell(),
            code: albumInit.code,
            data: albumInit.data
        });
    }

    // Get the initial state of the Song contract.
    fun getSongInit(songTitle: String, albumAdddress: Address?): StateInit {
        return initOf Song(myAddress(), songTitle, albumAdddress);
    }
}

message ForwardAddSong {
    forwardAddress: Address
}

// Song is contract that represents a song.
contract Song with Ownable {
    override const storageReserve: Int = ton("0.2"); // Should be same as TonForStorageSong

    owner: Address;
    title: String;              // Title of the song
    albumAddress: Address?;     // Address of the album. Optional because a song can be added without an album

    init(owner: Address, title: String, albumAddress: Address?) {
        self.owner = owner;
        self.title = title;
        self.albumAddress = albumAddress;
    }

    receive(forward: ForwardAddSong) {
        require(sender() == self.owner, "Only the owner can add songs");

        self.forward(forward.forwardAddress, null, false, null);
    }

    get fun title(): String {
        return self.title
    }

    get fun album(): Address? {
        return self.albumAddress
    }
}

