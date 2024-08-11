import "@stdlib/deploy";
import "@stdlib/ownable";
import "./song";
import "./album";

// Berry is a contract that manages all data.
// This entry point is the main contract that will be deployed.
contract Berry with Deployable, Ownable, SongMaster, AlbumMaster {
    override const storageReserve: Int = ton("0.5");

    owner: Address;

    totalSongs: Int = 0;    // Total number of songs
    totalAlbums: Int = 0;   // Total number of albums

    init(owner: Address) {
        self.owner = owner;
    }

    receive() {}

    receive("withdraw safe") {
        self.requireOwner();

        send(SendParameters{
            to: sender(),
            bounce: true,
            value: myBalance() - context().value - self.storageReserve,
            mode: SendRemainingValue + SendIgnoreErrors
        });
    }
}
