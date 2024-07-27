import "@stdlib/deploy";
import "@stdlib/ownable";

message AddSong {
    title: String
}

trait SongMaster {
    receive(addSong: AddSong) {
        let winit: StateInit = self.getSongInit(addSong.title); // Create message
        send(SendParameters{
        to: contractAddress(winit),
        value: 0,
        bounce: false,
        mode: SendRemainingValue,
        code: winit.code,
        data: winit.data
        });
    }

    get fun songAddress(title: String): Address {
        let winit: StateInit = self.getSongInit(title);
        return contractAddress(winit)
    }

    fun getSongInit(title: String): StateInit {
        return initOf Song(myAddress(), title);
    }
}


contract Song with Ownable {
    owner: Address;
    title: String;

    init(owner: Address, title: String) {
        self.owner = owner;
        self.title = title;
    }

    get fun title(): String {
        return self.title
    }
}

