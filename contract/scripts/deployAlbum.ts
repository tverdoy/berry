import { toNano } from '@ton/core';
import { Album } from '../wrappers/Album';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const album = provider.open(await Album.fromInit());

    await album.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(album.address);

    // run methods on `album`
}
