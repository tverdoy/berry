import "@stdlib/deploy";
import "@stdlib/ownable";
import "./album";

const MaxBytesTitleChars: Int = 800;    // Max bytes for song and album title

const TonForStorageSong: Int = ton("0.2");  // TON for storage of the Song contract
const TonForStorageAlbum: Int = ton("0.2"); // TON for storage of the Album contract
const FeeForAddSong: Int = ton("0.01");     // Fee for adding a song (donation to the contract)

// Message for adding a song to the SongMaster contract
message AddSong {
    songTitle: String;      // Title of the song
    albumTitle: String?;    // Title of the album. Optional because a song can be added without an album
}

// SongMaster is the main contract that manages songs.
//
// User can call the [AddSong] message to add a song.
trait SongMaster {
    owner: Address;

    totalSongs: Int;    // Total number songs
    totalAlbums: Int;   // Total number albums

    // Add a song to the system.
    // If [AddSong].albumTitle is not null then create an album.
    // Otherwise, create a song.
    receive(addSong: AddSong) {
        let minFee = FeeForAddSong + TonForStorageSong + TonForStorageAlbum + ton("0.5");
        nativeThrowIf(100, context().value < minFee); // Not enough value for add song

        let songTitleBytes = addSong.songTitle.asSlice().bits();
        nativeThrowIf(200, songTitleBytes > MaxBytesTitleChars);    // Song title cannot be more than max bytes
        nativeThrowIf(201, songTitleBytes == 0);                    // Song title cannot be empty

        if (addSong.albumTitle != null) {
            let albumTitleBytes = addSong.albumTitle!!.asSlice().bits();
            nativeThrowIf(202, albumTitleBytes > MaxBytesTitleChars);   // Album title cannot be more than max bytes
            nativeThrowIf(203, albumTitleBytes == 0);                   // Album title cannot be empty

            self.createAlbum(addSong.albumTitle!!, addSong.songTitle, sender(), sender())
        } else {
            self.createSong(addSong.songTitle, null, sender())
        }
    }

    // This message notification from Album contract when a song is added to the album.
    // It is used to create a song in the SongMaster contract.
    receive(addSong: AddedSongToAlbumNotify) {
        let albumAddress = contractAddress(initOf Album(myAddress(), addSong.albumTitle));
        nativeThrowIf(151, sender() != albumAddress); // Only the Album contract can send this message

        if addSong.status == AddedSongToAlbumStatusOk {
            if !addSong.isWasInit {
                self.totalAlbums += 1;
            }

            self.createSong(addSong.songTitle, albumAddress, addSong.ownerSongAddress)
        } else {
            self.sendChange(addSong.ownerSongAddress, 0);
        }

        self.createSong(addSong.songTitle, albumAddress, addSong.ownerSongAddress)
    }

    // This message notification from Album contract when a song is removed from the album.
    receive(removeSong: RemoveSongFromAlbumNotify) {
        let albumAddress = contractAddress(initOf Album(myAddress(), removeSong.albumTitle));
        nativeThrowIf(151, sender() != albumAddress); // Only the Album contract can send this message

        self.sendChange(removeSong.ownerSongAddress, 0);
    }

    // This message notification from Song contract when a song is created.
    receive(initSong: InitSongNotify) {
        let songAddress = contractAddress(initOf Song(myAddress(), initSong.title, initSong.albumAddress));
        nativeThrowIf(152, sender() != songAddress); // Only the Song contract can send this message

        if (initSong.status == InitSongStatusOk) {
            self.totalSongs += 1;
            self.sendChange(initSong.ownerSongAddress, FeeForAddSong);
        } else if (initSong.status == InitSongStatusOwnerAlreadySet) {
            if (initSong.albumAddress != null) {
                self.forward(
                    initSong.albumAddress!!,
                    RemoveSongFromAlbum{
                        songAddress: songAddress,
                        ownerSongAddress: initSong.ownerSongAddress
                    }.toCell(),
                    false, null
                );
            } else {
                self.sendChange(initSong.ownerSongAddress, 0);
            }
        }
    }

    // Get the address of the song.
    get fun songAddress(songTitle: String, albumTitle: String?): Address {
        let albumAddress = albumTitle != null ? contractAddress(initOf Album(myAddress(), albumTitle!!)) : null;
        return contractAddress(self.getSongInit(songTitle, albumAddress));
    }

    // Get total number songs
    get fun totalSongs(): Int {
        return self.totalSongs
    }

    // Send change to addreses.
    fun sendChange(to: Address, fee: Int) {
        if (fee == 0) {
            self.forward(to, null, false, null);
            return;
        }

        let forwardValue = context().value - (fee + context().readForwardFee() * 25);

        send(SendParameters{
            to: to,
            bounce: false,
            value: forwardValue,
            mode: SendIgnoreErrors
        });
    }

    // Send a message to the Song contract to create a song.
    fun createSong(songTitle: String, albumAddress: Address?, ownerSongAddress: Address) {
        let songInit = self.getSongInit(songTitle, albumAddress);

        self.forward(
            contractAddress(songInit),
            InitSong{
                ownerSongAddress: ownerSongAddress
            }.toCell(),
            false,
            songInit
        );
    }

    // Send a message to the Album contract to create an album.
    fun createAlbum(albumTitle: String, songTitle: String, ownerAlbumAddress: Address, ownerSongAddress: Address) {
        let albumInit = initOf Album(myAddress(), albumTitle);
        let songAddress = self.songAddress(songTitle, albumTitle);

        self.forward(
            contractAddress(albumInit),
            AddSongToAlbum{
                songAddress: songAddress,
                songTitle: songTitle,
                ownerAlbum: ownerAlbumAddress,
                ownerSongAddress: ownerSongAddress
            }.toCell(),
            false,
            albumInit
        );
    }

    // Get the initial state of the Song contract.
    fun getSongInit(songTitle: String, albumAdddress: Address?): StateInit {
        return initOf Song(myAddress(), songTitle, albumAdddress);
    }
}

// Message for initializing a song.
message InitSong {
    ownerSongAddress: Address
}

const InitSongStatusOk: Int = 1;
const InitSongStatusOwnerAlreadySet: Int = 210;

// Message notification for initializing a song.
message InitSongNotify {
    ownerSongAddress: Address;
    title: String;
    albumAddress: Address?;

    status: Int;
}

// Song is contract that represents a song.
contract Song with Ownable {
    override const storageReserve: Int = ton("0.2"); // Should be same as TonForStorageSong

    owner: Address;

    ownerSong: Address?;        // Address of the owner of the song
    title: String;              // Title of the song
    albumAddress: Address?;     // Address of the album. Optional because a song can be added without an album

    init(owner: Address, title: String, albumAddress: Address?) {
        self.owner = owner;
        self.title = title;
        self.albumAddress = albumAddress;
        self.ownerSong = null;
    }

    receive() {}

    // Initialize the song.
    receive(init: InitSong) {
        self.requireOwner();

        if (self.ownerSong == null) {
            self.ownerSong = init.ownerSongAddress;

            self.notify(InitSongNotify{
                ownerSongAddress: init.ownerSongAddress,
                title: self.title,
                albumAddress: self.albumAddress,
                status: InitSongStatusOk
            }.toCell());
        } else {
            // Owner is already set, so notify the SongMaster contract to remove the song.
            self.notify(InitSongNotify{
                ownerSongAddress: self.ownerSong!!,
                title: self.title,
                albumAddress: self.albumAddress,
                status: InitSongStatusOwnerAlreadySet
            }.toCell());
        }
    }

    get fun title(): String {
        return self.title
    }

    get fun album(): Address? {
        return self.albumAddress
    }

    // If ownerSong is set then the song is created.
    get fun ownerSong(): Address? {
        return self.ownerSong
    }
}
