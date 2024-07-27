import "@stdlib/deploy";
import "@stdlib/ownable";
import "./song";

contract Berry with Deployable, Ownable, SongMaster {
    owner: Address;

    init(owner: Address) {
        self.owner = owner;
    }
}
