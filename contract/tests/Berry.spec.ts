import {Blockchain, SandboxContract, TreasuryContract} from '@ton/sandbox';
import {Berry} from '../wrappers/Berry';
import '@ton/test-utils';
import {DeployBerry} from "./utils";


describe('Berry', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let berry: SandboxContract<Berry>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        berry = await DeployBerry(blockchain, deployer);
    });

    it('Owner check', async () => {
        let owner = await berry.getOwner()
        expect(owner).toEqualAddress(deployer.address)
    });
});
