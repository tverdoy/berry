import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { Berry } from '../wrappers/Berry';
import '@ton/test-utils';

describe('Berry', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let berry: SandboxContract<Berry>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        berry = blockchain.openContract(await Berry.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await berry.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: berry.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and berry are ready to use
    });
});
