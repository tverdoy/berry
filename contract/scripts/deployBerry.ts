import { toNano } from '@ton/core';
import { Berry } from '../wrappers/Berry';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const berry = provider.open(await Berry.fromInit());

    await berry.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(berry.address);

    // run methods on `berry`
}
