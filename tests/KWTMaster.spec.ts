import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import '@ton/test-utils';

describe('KWTMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let kWTMaster: SandboxContract<KWTMaster>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        const MAX_SUPPLY = toNano("66000000000"); // 66B with 9 decimals
        kWTMaster = blockchain.openContract(await KWTMaster.fromInit(
            deployer.address,
            MAX_SUPPLY
        ));

        const deployResult = await kWTMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.15'),
            },
            {
                $$type: 'Deploy' as const,
            },
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: kWTMaster.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and kWTMaster are ready to use
    });
});
