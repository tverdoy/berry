import "@stdlib/deploy";
import "@stdlib/ownable";
import "./song";

contract Berry with Deployable, Ownable, SongMaster {
    owner: Address;

    totalSongs: Int = 0;
    totalAlbums: Int = 0;

    init(owner: Address) {
        self.owner = owner;
    }
}
