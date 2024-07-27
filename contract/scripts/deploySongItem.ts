import { toNano } from '@ton/core';
import { SongItem } from '../wrappers/SongItem';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const songItem = provider.open(await SongItem.fromInit());

    await songItem.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(songItem.address);

    // run methods on `songItem`
}
