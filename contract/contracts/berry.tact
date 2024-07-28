import "@stdlib/deploy";
import "@stdlib/ownable";
import "./song";
import "./album";

// Berry is a contract that manages all data.
// This entry point is the main contract that will be deployed.
contract Berry with Deployable, Ownable, SongMaster, AlbumMaster {
    owner: Address;

    totalSongs: Int = 0;    // Total number of songs
    totalAlbums: Int = 0;   // Total number of albums

    init(owner: Address) {
        self.owner = owner;
    }
}
