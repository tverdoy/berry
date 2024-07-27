import { toNano } from '@ton/core';
import { Song } from '../wrappers/Song';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const song = provider.open(await Song.fromInit());

    await song.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(song.address);

    // run methods on `song`
}
