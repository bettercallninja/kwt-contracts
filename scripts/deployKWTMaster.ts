import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { OWNER_ADDRESS_MAINNET, MAX_SUPPLY_NANO } from '../config/mainnet';

export async function run(provider: NetworkProvider) {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 Deploying KWTMaster Contract");
    console.log("=".repeat(60));
    console.log();
    
    // Owner is the multisig wallet (from config)
    const owner = Address.parse(OWNER_ADDRESS_MAINNET);
    const maxSupply = MAX_SUPPLY_NANO;
    
    console.log("👤 Owner Address (Multisig):", owner.toString());
    console.log("📊 Max Supply:", maxSupply.toString(), "nano (66B tokens)");
    console.log("🌐 Network:", provider.network());
    console.log();

    const sender = provider.sender();
    
    // Check sender address - must NOT be the multisig owner wallet
    if (sender.address) {
        const senderAddress = sender.address;
        console.log("🔐 Sender Wallet:", senderAddress.toString());
        console.log();
        
        // IMPORTANT: forbid deploying from the owner (multisig) wallet
        // Check both bounceable and non-bounceable formats for comparison
        const senderBounceable = senderAddress.toString({ urlSafe: true, bounceable: true });
        const senderNonBounceable = senderAddress.toString({ urlSafe: true, bounceable: false });
        const ownerBounceable = owner.toString({ urlSafe: true, bounceable: true });
        const ownerNonBounceable = owner.toString({ urlSafe: true, bounceable: false });
        
        if (senderAddress.equals(owner) || 
            senderBounceable === ownerBounceable || 
            senderBounceable === ownerNonBounceable ||
            senderNonBounceable === ownerBounceable ||
            senderNonBounceable === ownerNonBounceable) {
            console.error("❌ ERROR: You must NOT deploy from the owner (multisig) wallet.");
            console.error("   Use a regular Tonkeeper EOA as sender.");
            console.error("   Example sender wallet: UQBMYaEQgbQog8mM7u11q2-3zZAuxU0mo9XVSqHqeLSZaCdu");
            console.error();
            throw new Error("Refusing to deploy from owner (multisig) wallet. Use a regular EOA wallet as sender.");
        }
        console.log("✅ Sender is a regular wallet (not multisig owner)");
    } else {
        // If using ton:// link, we can't verify the address immediately
        // But we still check the string format if possible
        console.log("⚠️  Warning: Cannot verify sender address (using ton:// link)");
        console.log("   Please make sure you're using a regular wallet, NOT the multisig owner wallet");
        console.log("   Multisig owner:", owner.toString());
        console.log();
    }
    
    console.log("ℹ️  Note: For deploy, use a regular Tonkeeper EOA as sender.");
    console.log("   The contract owner is the multisig defined in OWNER_ADDRESS_MAINNET.");
    console.log("   For Configure and Initial Allocation, you MUST use the multisig wallet.");
    console.log();

    // Create contract instance with multisig as owner
    const master = provider.open(
        await KWTMaster.fromInit(owner, maxSupply)
    );

    console.log("📍 Contract Address:", master.address.toString());
    console.log();

    // Deploy contract
    console.log("📤 Sending deploy transaction...");
    await master.send(
        sender,
        {
            value: toNano("0.5"),
        },
        {
            $$type: 'Deploy' as const,
        }
    );

    console.log("✅ Deploy transaction sent!");
    console.log("⏳ Waiting for deployment confirmation...");
    
    try {
        await provider.waitForDeploy(master.address);
        console.log("✅ Contract deployed successfully!");
    } catch (error: any) {
        console.log("⚠️  Deployment verification timeout.");
        console.log("💡 Transaction was sent. Please check the explorer:");
        const explorerBase = provider.network() === 'mainnet' 
            ? 'https://tonscan.org' 
            : 'https://testnet.tonscan.org';
        console.log(`   ${explorerBase}/address/${master.address.toString({ urlSafe: true, bounceable: false })}`);
    }

    console.log();
    console.log("=".repeat(60));
    console.log("✅ DEPLOYMENT COMPLETED");
    console.log("=".repeat(60));
    console.log();
    console.log("📍 KWTMaster deployed at:", master.address.toString());
    console.log();
    console.log("⚠️  IMPORTANT: For next steps (Configure and Initial Allocation),");
    console.log("   you MUST use the multisig wallet:", owner.toString());
    console.log();
}
