import { NetworkProvider } from '@ton/blueprint';
import { Address, toNano } from '@ton/core';
import { KWTMaster } from '../build/KWTMaster/KWTMaster_KWTMaster';
import { MASTER_ADDRESS_MAINNET, OWNER_ADDRESS_MAINNET } from '../config/mainnet';
import { openMaster, getJettonData, formatKWT } from './helpers/kwtHelpers';

/**
 * ============================================================================
 * SIMULATE INITIAL ALLOCATION - MAINNET
 * ============================================================================
 * 
 * This script simulates the initial launch allocation on MAINNET.
 * 
 * ⚠️  WARNING: This script runs on MAINNET and sends real transactions!
 * 
 * Key features:
 * - Uses on-chain logic (max_supply, allocation wallets are read from contract)
 * - Allocation amounts are calculated based on max_supply and burn_reserve_total
 * - After successful execution, minting is permanently disabled (mintable = false)
 * - Final totalSupply must be exactly equal to max_supply = 66B KWT
 * 
 * This script:
 * 1. Reads contract state (configured, mintable, totalSupply, allocation wallets)
 * 2. Calculates allocation amounts from on-chain constants
 * 3. Sends MintMany for each allocation wallet
 * 4. Sends "Owner: MintClose" to disable minting
 * 
 * ⚠️  Important: Only the owner can run this script.
 */
export async function run(provider: NetworkProvider) {
    const sender = provider.sender();

    console.log("\n" + "=".repeat(60));
    console.log("🚀 SIMULATE INITIAL ALLOCATION - MAINNET");
    console.log("=".repeat(60));
    console.log();
    console.log("⚠️  WARNING: This script runs on MAINNET!");
    console.log("   Real transactions will be sent. Make sure you're ready!");
    console.log();

    // ============================================================================
    // STEP 1: Validate config and open master
    // ============================================================================
    if (!MASTER_ADDRESS_MAINNET) {
        throw new Error("❌ MASTER_ADDRESS_MAINNET is not set in config/mainnet.ts");
    }

    if (!OWNER_ADDRESS_MAINNET) {
        throw new Error("❌ OWNER_ADDRESS_MAINNET is not set in config/mainnet.ts");
    }

    const master = openMaster(provider, MASTER_ADDRESS_MAINNET);
    const ownerAddress = Address.parse(OWNER_ADDRESS_MAINNET);

    console.log("📍 Master Address:", master.address.toString());
    console.log("👤 Owner Address:", ownerAddress.toString());
    console.log();

    // ============================================================================
    // STEP 2: Read contract state BEFORE
    // ============================================================================
    console.log("🔍 Reading contract state (BEFORE)...");
    console.log("-".repeat(60));

    let initialJettonData;
    let debugState;
    let allocationWallets: { airdrop_wallet: Address; treasury_wallet: Address; team_wallet: Address; burn_reserve_wallet: Address } | null = null;
    let supplyInfo: { max_supply: bigint; burn_reserve_total: bigint } | null = null;

    try {
        initialJettonData = await getJettonData(master);
        console.log("   ✅ get_jetton_data() successful");
    } catch (error: any) {
        throw new Error(`❌ Failed to read jetton data: ${error.message}`);
    }

    try {
        debugState = await master.getGetDebugState();
        console.log("   ✅ get_debug_state() successful");
    } catch (error: any) {
        console.log("   ⚠️  get_debug_state() not available (using jetton_data instead)");
        debugState = {
            configured: !!initialJettonData.content,
            mintable: initialJettonData.mintable,
            totalSupply: initialJettonData.totalSupply,
            owner: initialJettonData.owner,
        };
    }

    try {
        allocationWallets = await master.getGetAllocationWallets();
        console.log("   ✅ get_allocation_wallets() successful");
    } catch (error: any) {
        console.log("   ⚠️  get_allocation_wallets() not available");
        throw new Error("❌ Cannot read allocation wallets from contract. Please add get_allocation_wallets() getter to KWTMaster.tact");
    }

    try {
        supplyInfo = await master.getGetSupplyInfo();
        console.log("   ✅ get_supply_info() successful");
    } catch (error: any) {
        console.log("   ⚠️  get_supply_info() not available");
        throw new Error("❌ Cannot read supply info from contract. Please add get_supply_info() getter to KWTMaster.tact");
    }

    const currentTotalSupply = initialJettonData.totalSupply;
    const contractOwner = initialJettonData.owner;
    const isConfigured = debugState.configured;
    const isMintable = debugState.mintable;
    const maxSupply = supplyInfo.max_supply;
    const burnReserveTotal = supplyInfo.burn_reserve_total;

    console.log();
    console.log("📊 Contract State:");
    console.log("   Configured:", isConfigured ? "✅ Yes" : "❌ No");
    console.log("   Mintable:", isMintable ? "✅ Yes" : "❌ No");
    console.log("   Total Supply:", formatKWT(currentTotalSupply), "KWT");
    console.log("   (", currentTotalSupply.toString(), "nano )");
    console.log("   Max Supply:", formatKWT(maxSupply), "KWT");
    console.log("   Owner:", contractOwner.toString());
    console.log();

    // Extract wallet addresses
    const airdropWallet = allocationWallets.airdrop_wallet;
    const treasuryWallet = allocationWallets.treasury_wallet;
    const teamWallet = allocationWallets.team_wallet;
    const burnReserveWallet = allocationWallets.burn_reserve_wallet;
    console.log("📋 Allocation Wallets (from contract):");
    console.log("   Airdrop:", airdropWallet.toString());
    console.log("   Treasury:", treasuryWallet.toString());
    console.log("   Team:", teamWallet.toString());
    console.log("   Burn Reserve:", burnReserveWallet.toString());
    console.log();

    // ============================================================================
    // STEP 3: Validation checks
    // ============================================================================
    console.log("🔍 Validating prerequisites...");
    console.log("-".repeat(60));

    if (!isConfigured) {
        throw new Error("❌ Contract is NOT configured! Please run 'sendConfigure' first.");
    }
    console.log("   ✅ Contract is configured");

    if (!isMintable) {
        throw new Error("❌ Minting is disabled! Cannot perform initial allocation.");
    }
    console.log("   ✅ Minting is enabled");

    if (currentTotalSupply !== BigInt(0)) {
        console.log("   ⚠️  WARNING: Total supply is not zero!");
        console.log("      Current supply:", formatKWT(currentTotalSupply), "KWT");
        console.log("      Initial allocation should start with totalSupply = 0");
        console.log("      Aborting to prevent double allocation.");
        throw new Error("❌ Total supply is not zero. Initial allocation already performed or tokens already minted.");
    }
    console.log("   ✅ Total supply is zero (ready for initial allocation)");

    if (!contractOwner.equals(ownerAddress)) {
        throw new Error(
            `❌ Owner mismatch! Contract owner: ${contractOwner.toString()}, Expected: ${ownerAddress.toString()}`
        );
    }
    console.log("   ✅ Owner matches config");

    let senderAddress: Address | null = null;
    if (sender.address) {
        senderAddress = sender.address;
    }

    if (!senderAddress) {
        console.log("   ⚠️  WARNING: Cannot verify sender address (using ton:// link)");
        console.log("      Make sure you're using the owner wallet:", ownerAddress.toString());
    } else {
        console.log("   🔐 Sender (wallet):", senderAddress.toString());
        if (!senderAddress.equals(ownerAddress)) {
            throw new Error(
                `❌ Sender (${senderAddress.toString()}) is not the contract owner (${ownerAddress.toString()})!\n` +
                `   Only the owner can perform initial allocation.`
            );
        }
        console.log("   ✅ Sender matches contract owner");
    }
    console.log();

    // ============================================================================
    // STEP 4: Calculate allocations from on-chain constants
    // ============================================================================
    console.log("📊 Calculating allocations from on-chain constants...");
    console.log("-".repeat(60));

    const allocBurnReserve = burnReserveTotal; // 6.6B from contract
    const remainingAfterBurnReserve = maxSupply - allocBurnReserve;
    
    // Split remaining 59.4B: 50% Treasury, 30% Team, 20% Airdrop
    const allocTreasury = (remainingAfterBurnReserve * BigInt(50)) / BigInt(100);
    const allocTeam = (remainingAfterBurnReserve * BigInt(30)) / BigInt(100);
    const allocAirdrop = (remainingAfterBurnReserve * BigInt(20)) / BigInt(100);
    
    const totalCalculated = allocAirdrop + allocTreasury + allocTeam + allocBurnReserve;
    
    let finalAllocations: {
        airdrop: bigint;
        treasury: bigint;
        team: bigint;
        burnReserve: bigint;
    };

    if (totalCalculated !== maxSupply) {
        const difference = maxSupply - totalCalculated;
        const allocTreasuryAdjusted = allocTreasury + difference;
        const finalTotal = allocAirdrop + allocTreasuryAdjusted + allocTeam + allocBurnReserve;
        
        if (finalTotal !== maxSupply) {
            throw new Error(
                `❌ CRITICAL: Cannot calculate allocations that sum to exactly max_supply!\n` +
                `   Calculated: ${formatKWT(finalTotal)} KWT\n` +
                `   Expected: ${formatKWT(maxSupply)} KWT\n` +
                `   Difference: ${formatKWT(maxSupply - finalTotal)} KWT`
            );
        }
        
        finalAllocations = {
            airdrop: allocAirdrop,
            treasury: allocTreasuryAdjusted,
            team: allocTeam,
            burnReserve: allocBurnReserve
        };
    } else {
        finalAllocations = {
            airdrop: allocAirdrop,
            treasury: allocTreasury,
            team: allocTeam,
            burnReserve: allocBurnReserve
        };
    }

    console.log("   Max Supply:", formatKWT(maxSupply), "KWT");
    console.log("   Burn Reserve Total (from contract):", formatKWT(burnReserveTotal), "KWT");
    console.log();
    console.log("   ✅ Final Allocations (sum = max_supply):");
    console.log("   Airdrop:", formatKWT(finalAllocations.airdrop), "KWT");
    console.log("   Treasury:", formatKWT(finalAllocations.treasury), "KWT");
    console.log("   Team:", formatKWT(finalAllocations.team), "KWT");
    console.log("   Burn Reserve:", formatKWT(finalAllocations.burnReserve), "KWT");
    const verifiedTotal = finalAllocations.airdrop + finalAllocations.treasury + finalAllocations.team + finalAllocations.burnReserve;
    console.log("   Total:", formatKWT(verifiedTotal), "KWT");
    console.log("   ✅ Verified: Total equals max_supply!");
    console.log();

    // ============================================================================
    // STEP 5: Send MintMany messages
    // ============================================================================
    console.log("=".repeat(60));
    console.log("📤 SENDING INITIAL ALLOCATION MESSAGES");
    console.log("=".repeat(60));
    console.log();
    console.log("⚠️  CRITICAL: Only the multisig owner can mint tokens!");
    console.log("   You MUST use the multisig wallet:", OWNER_ADDRESS_MAINNET);
    console.log("   Regular wallets cannot mint - only the multisig owner.");
    console.log("   💡 TIP: Use Mnemonic of one of the multisig signers if needed.");
    console.log();

    const distributions = [
        { label: "AIRDROP", wallet: airdropWallet, amount: finalAllocations.airdrop },
        { label: "TREASURY", wallet: treasuryWallet, amount: finalAllocations.treasury },
        { label: "TEAM", wallet: teamWallet, amount: finalAllocations.team },
        { label: "BURN_RESERVE", wallet: burnReserveWallet, amount: finalAllocations.burnReserve },
    ].filter(d => d.amount > 0);

    const totalMinted = finalAllocations.airdrop + finalAllocations.treasury + finalAllocations.team + finalAllocations.burnReserve;

    for (let i = 0; i < distributions.length; i++) {
        const dist = distributions[i];
        
        console.log(`📤 MintMany ${i + 1}/${distributions.length}: ${dist.label}`);
        console.log("   Receiver:", dist.wallet.toString());
        console.log("   Amount:", dist.amount.toString(), "nano");
        console.log("   (Human readable:", formatKWT(dist.amount), "KWT)");
        console.log();

        const mintManyMessage = {
            $$type: 'MintMany' as const,
            amount: dist.amount,
            receiver: dist.wallet,
        };

        await master.send(
            sender,
            {
                value: toNano("0.3"),
            },
            mintManyMessage
        );

        console.log("   ✅ MintMany transaction sent!");
        
        if (i < distributions.length - 1) {
            console.log("   ⏳ Waiting 15 seconds before next mint...");
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
        console.log();
    }

    // ============================================================================
    // STEP 6: Wait and verify
    // ============================================================================
    console.log("⏳ Waiting for all transactions to be processed (30 seconds)...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log("\n🔍 Verifying initial allocation...");
    console.log("-".repeat(60));

    let finalJettonData;
    let finalDebugState;
    let verificationAttempts = 0;
    const maxAttempts = 6;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            if (attempt > 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            finalJettonData = await getJettonData(master);
            finalDebugState = await master.getGetDebugState().catch(() => null);

            const finalTotalSupply = finalJettonData.totalSupply;
            const finalMintable = finalJettonData.mintable;

            console.log(`   Attempt ${attempt}:`);
            console.log("      Total Supply:", formatKWT(finalTotalSupply), "KWT");
            console.log("      Mintable:", finalMintable ? "✅ Yes" : "❌ No");

            if (finalTotalSupply >= totalMinted) {
                console.log("   ✅ Initial allocation verified!");
                console.log("      Expected:", formatKWT(totalMinted), "KWT");
                console.log("      Actual:", formatKWT(finalTotalSupply), "KWT");
                verificationAttempts = attempt;
                break;
            } else {
                if (attempt < maxAttempts) {
                    console.log("   ⏳ Waiting for transactions to complete...");
                }
            }
        } catch (error: any) {
            console.log(`   ⚠️  Attempt ${attempt} failed:`, error.message);
            if (attempt < maxAttempts) {
                console.log("   ⏳ Retrying...");
            }
        }
    }

    if (!finalJettonData) {
        console.log("   ⚠️  WARNING: Could not verify allocation after multiple attempts");
        console.log("      Please check the explorer manually");
    }

    // ============================================================================
    // STEP 7: Send "Owner: MintClose" to permanently disable minting
    // ============================================================================
    console.log();
    console.log("=".repeat(60));
    console.log("🔒 STEP 2: PERMANENTLY DISABLING MINTING");
    console.log("=".repeat(60));
    console.log();
    console.log("📤 Sending 'Owner: MintClose' message...");
    console.log("   ⚠️  This will permanently disable minting (one-way operation)");
    console.log();

    await master.send(
        sender,
        {
            value: toNano("0.1"),
        },
        "Owner: MintClose" as any
    );

    console.log("✅ 'Owner: MintClose' transaction sent!");
    console.log("⏳ Waiting for confirmation (15 seconds)...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log("\n🔍 Verifying minting is disabled...");
    try {
        const finalCheck = await getJettonData(master);
        if (!finalCheck.mintable) {
            console.log("   ✅ Minting is now permanently disabled!");
        } else {
            console.log("   ⚠️  Minting is still enabled (transaction may still be processing)");
        }
    } catch (error: any) {
        console.log("   ⚠️  Could not verify:", error.message);
    }
    console.log();

    // ============================================================================
    // STEP 8: Final Summary
    // ============================================================================
    console.log("=".repeat(60));
    console.log("✅ INITIAL ALLOCATION COMPLETE");
    console.log("=".repeat(60));
    console.log();

    if (finalJettonData) {
        console.log("📊 Final Contract State:");
        console.log("   Total Supply:", formatKWT(finalJettonData.totalSupply), "KWT");
        console.log("   (", finalJettonData.totalSupply.toString(), "nano )");
        console.log("   Expected Total Supply:", formatKWT(maxSupply), "KWT (66B)");
        
        if (finalJettonData.totalSupply === maxSupply) {
            console.log("   ✅ Total Supply matches max_supply (66B)!");
        } else {
            console.log("   ⚠️  WARNING: Total Supply does not match max_supply!");
            console.log("      Difference:", formatKWT(maxSupply - finalJettonData.totalSupply), "KWT");
        }
        
        console.log("   Mintable:", finalJettonData.mintable ? "⚠️  Yes (should be false!)" : "✅ No (permanently disabled)");
        console.log("   Owner:", finalJettonData.owner.toString());
        console.log();
    }

    console.log("📋 Final Allocation Summary:");
    console.log("   " + "-".repeat(60));
    console.log("   Wallet         | Address                                    | Amount (KWT)");
    console.log("   " + "-".repeat(60));
    console.log(`   AIRDROP        | ${airdropWallet.toString().padEnd(42)} | ${formatKWT(finalAllocations.airdrop)}`);
    console.log(`   TREASURY       | ${treasuryWallet.toString().padEnd(42)} | ${formatKWT(finalAllocations.treasury)}`);
    console.log(`   TEAM           | ${teamWallet.toString().padEnd(42)} | ${formatKWT(finalAllocations.team)}`);
    console.log(`   BURN_RESERVE   | ${burnReserveWallet.toString().padEnd(42)} | ${formatKWT(finalAllocations.burnReserve)}`);
    console.log("   " + "-".repeat(60));
    console.log(`   TOTAL          | ${" ".padEnd(42)} | ${formatKWT(totalMinted)}`);
    console.log();
    
    if (finalJettonData) {
        console.log("✅ Verification:");
        console.log("   Total Supply =", formatKWT(finalJettonData.totalSupply), "KWT");
        console.log("   Max Supply =", formatKWT(maxSupply), "KWT");
        console.log("   Match:", finalJettonData.totalSupply === maxSupply ? "✅ Yes" : "❌ No");
        console.log("   Mintable =", finalJettonData.mintable ? "❌ true (ERROR!)" : "✅ false (correct)");
        console.log();
    }

    console.log("=".repeat(60));
    console.log("✅ Initial allocation simulation completed on MAINNET!");
    console.log();
    console.log("💡 Next Steps:");
    console.log("   1. Verify transactions on explorer:");
    console.log(`      https://tonscan.org/address/${master.address.toString({ urlSafe: true, bounceable: false })}`);
    console.log("   2. Manually test transfers between users with real wallets");
    console.log("   3. Send large amounts to test the burn logic");
    console.log("   4. Inspect everything in the TON mainnet explorer");
    console.log();
    console.log("=".repeat(60));
}

