# 🚀 KWT Token - Mainnet Deployment Guide

## 📋 Overview

This document contains the complete deployment checklist and allocation details for the KWT token mainnet launch.

---

## 📊 Token Allocation Details

### Max Supply
- **Total Supply**: 66,000,000,000 KWT (66 Billion)
- **Decimals**: 9

### Allocation Breakdown

| Wallet Name | Address | Amount (KWT) | Percentage |
|-------------|---------|--------------|-------------|
| **AIRDROP** | `[Set in Configure]` | 11,880,000,000 | 18% |
| **TREASURY** | `[Set in Configure]` | 29,700,000,000 | 45% |
| **TEAM** | `[Set in Configure]` | 17,820,000,000 | 27% |
| **BURN_RESERVE** | `[Set in Configure]` | 6,600,000,000 | 10% |
| **TOTAL** | - | **66,000,000,000** | **100%** |

### Calculation Details

- **Burn Reserve**: 6.6B KWT (10% of 66B) - stored in contract as `burn_reserve_total`
- **Remaining**: 59.4B KWT (90% of 66B)
  - Treasury: 50% of 59.4B = **29.7B KWT**
  - Team: 30% of 59.4B = **17.82B KWT**
  - Airdrop: 20% of 59.4B = **11.88B KWT**

**Verification**: 6.6B + 29.7B + 17.82B + 11.88B = **66B KWT** ✅

---

## ✅ Mainnet Launch Checklist

### Phase 1: Build and Verify Contract

#### Step 1.1: Build Contract
```bash
npx blueprint build
```

**What to check:**
- ✅ Build completes without errors
- ✅ `build/KWTMaster.compiled.json` is generated
- ✅ No compilation warnings

**Expected output:**
```
✅ Compiled successfully!
✅ Wrote compilation artifact to build\KWTMaster.compiled.json
```

---

### Phase 2: Deploy Contract

#### Step 2.1: Deploy KWTMaster
```bash
npx blueprint run
→ Select: deployKWTMaster
→ Select: mainnet
→ Connect: Regular Tonkeeper wallet (TON Connect)
```

**Important Notes:**
- ⚠️  **CRITICAL**: Use a regular Tonkeeper EOA as sender (for example: the wallet with address `UQBMYaEQgbQog8mM7u11q2-3zZAuxU0mo9XVSqHqeLSZaCdu`)
- ⚠️  **DO NOT** use the multisig owner wallet for deployment
- ✅ The contract owner is still the multisig defined in `OWNER_ADDRESS_MAINNET`
- ✅ If you try to deploy from the multisig wallet, the script will reject the deployment and throw an error

**What to check in Terminal:**
- ✅ Deployment transaction sent successfully
- ✅ Contract address displayed (save this address!)
- ✅ Owner address is the multisig wallet (from config)
- ✅ No errors in console

**What to check in Explorer:**
- Go to: `https://tonscan.org/address/[CONTRACT_ADDRESS]`
- ✅ Contract is deployed (shows code hash)
- ✅ Owner matches the multisig wallet address (from config)
- ✅ Total Supply = 0
- ✅ Latest transaction is the deployment

**Save the contract address:**
- Update `config/mainnet.ts` with `MASTER_ADDRESS_MAINNET`

---

### Phase 3: Configure Contract

#### Step 3.1: Send Configure Message
```bash
npx blueprint run
→ Select: sendConfigure
→ Select: mainnet
→ Connect: Multisig wallet (MUST use multisig owner)
```

**Important Notes:**
- ⚠️  **CRITICAL**: Transactions MUST be sent from the multisig owner wallet
- ⚠️  Regular wallets cannot send Configure - only the multisig owner
- ✅ Multisig wallet address: `EQCY8a7rHtvsyCpw-ZrwG4lkkhU79ppKQVT1OIIGrkXSN9wI`
- 💡 Tip: Use Mnemonic of one of the multisig signers if needed

**What to check in Terminal:**
- ✅ Configure transaction sent successfully
- ✅ Metadata URI set correctly
- ✅ Allocation wallets set correctly
- ✅ No errors

**What to check in Explorer:**
- Go to contract address
- ✅ Latest transaction is Configure
- ✅ Transaction status: Success
- ✅ Check contract state (if getter available):
  - `configured = true`
  - Allocation wallets match your addresses

**What to check in Contract State:**
- Run: `npx blueprint run → checkContractStatus → mainnet`
- ✅ Configured: Yes
- ✅ Metadata URI: `https://kiwi.eu.com/kwt/metadata.json`
- ✅ Allocation wallets match your addresses

---

### Phase 4: Update Metadata (Optional)

#### Step 4.1: Update Metadata if Needed
```bash
npx blueprint run
→ Select: updateMetadataMainnet
→ Select: mainnet
→ Connect: Owner wallet (TON Connect)
```

**What to check in Terminal:**
- ✅ Metadata update transaction sent successfully
- ✅ New metadata URI confirmed

**What to check in Explorer:**
- ✅ Latest transaction is TokenUpdateContent
- ✅ Transaction status: Success

**What to check in Contract State:**
- Run: `npx blueprint run → checkContractStatus → mainnet`
- ✅ Metadata URI updated correctly

---

### Phase 5: Initial Allocation (CRITICAL)

#### Step 5.1: Simulate Initial Allocation
```bash
npx blueprint run
→ Select: simulateInitialAllocationMainnet
→ Select: mainnet
→ Connect: Multisig wallet (MUST use multisig owner)
```

**Important Notes:**
- ⚠️  **CRITICAL**: Transactions MUST be sent from the multisig owner wallet
- ⚠️  Regular wallets cannot mint tokens - only the multisig owner
- ✅ Multisig wallet address: `EQCY8a7rHtvsyCpw-ZrwG4lkkhU79ppKQVT1OIIGrkXSN9wI`
- 💡 Tip: Use Mnemonic of one of the multisig signers if needed

**What to check in Terminal:**
- ✅ Contract state read successfully:
  - Configured: Yes
  - Mintable: Yes
  - Total Supply: 0
- ✅ Allocation wallets read from contract
- ✅ Allocations calculated correctly (sum = 66B)
- ✅ Each MintMany transaction sent successfully
- ✅ "Owner: MintClose" transaction sent successfully
- ✅ Final verification:
  - Total Supply = 66,000,000,000 KWT
  - Mintable = false

**What to check in Explorer:**
- Go to contract address
- ✅ Total Supply = 66,000,000,000 KWT (66B)
- ✅ Latest transactions show:
  - 4x MintMany transactions (one for each wallet)
  - 1x "Owner: MintClose" transaction
- ✅ All transactions: Success
- ✅ Check each allocation wallet:
  - Airdrop wallet: 11,880,000,000 KWT
  - Treasury wallet: 29,700,000,000 KWT
  - Team wallet: 17,820,000,000 KWT
  - Burn Reserve wallet: 6,600,000,000 KWT

**What to check in Contract State:**
- Run: `npx blueprint run → checkContractStatus → mainnet`
- ✅ Total Supply: 66,000,000,000 KWT
- ✅ Mintable: No (permanently disabled)
- ✅ Owner: Your wallet address

**What to check in Wallets:**
- Open each allocation wallet in TON wallet
- ✅ Airdrop wallet shows: 11,880,000,000 KWT
- ✅ Treasury wallet shows: 29,700,000,000 KWT
- ✅ Team wallet shows: 17,820,000,000 KWT
- ✅ Burn Reserve wallet shows: 6,600,000,000 KWT

---

## 🔒 Post-Deployment Verification

### Critical Checks

1. **Total Supply Verification**
   - ✅ Total Supply = 66,000,000,000 KWT exactly
   - ✅ No more tokens can be minted (mintable = false)

2. **Allocation Verification**
   - ✅ Airdrop: 11,880,000,000 KWT
   - ✅ Treasury: 29,700,000,000 KWT
   - ✅ Team: 17,820,000,000 KWT
   - ✅ Burn Reserve: 6,600,000,000 KWT
   - ✅ Sum = 66,000,000,000 KWT

3. **Contract State Verification**
   - ✅ Configured: true
   - ✅ Mintable: false (permanently disabled)
   - ✅ Owner: Your wallet address
   - ✅ Metadata URI: Correct

4. **Security Verification**
   - ✅ Only owner can perform operations (verified during deployment)
   - ✅ Minting is permanently disabled
   - ✅ No additional tokens can be created

---

## 📝 Important Notes

1. **One-Time Operation**: Initial allocation can only be performed once. After "Owner: MintClose", minting is permanently disabled.

2. **Owner Wallet**: Make sure you're using the correct owner wallet for all operations. Only the owner can:
   - Deploy the contract
   - Send Configure
   - Perform initial allocation
   - Close minting

3. **Gas Requirements**: Ensure you have enough TON in your owner wallet:
   - Deployment: ~0.5 TON
   - Configure: ~0.1 TON
   - Each MintMany: ~0.3 TON (4x = 1.2 TON)
   - MintClose: ~0.1 TON
   - **Total**: ~2 TON recommended

4. **Backup**: Save all important information:
   - Contract address
   - Owner wallet address
   - Allocation wallet addresses
   - Transaction hashes

---

## 🆘 Troubleshooting

### Issue: "Contract is not configured"
- **Solution**: Run `sendConfigure` first

### Issue: "Minting is disabled"
- **Solution**: This means minting was already closed. Check if initial allocation was already performed.

### Issue: "Total Supply does not match max_supply"
- **Solution**: Check each MintMany transaction in explorer. Verify all 4 transactions succeeded.

### Issue: "Sender is not owner"
- **Solution**: Make sure you're using the owner wallet that deployed the contract.

---

## ✅ Final Checklist Summary

- [ ] Contract built successfully
- [ ] Contract deployed on mainnet
- [ ] Contract address saved in config
- [ ] Configure message sent successfully
- [ ] Allocation wallets verified
- [ ] Metadata URI verified
- [ ] Initial allocation performed (4x MintMany)
- [ ] Total Supply = 66B verified
- [ ] MintClose sent successfully
- [ ] Mintable = false verified
- [ ] All allocation wallets verified in explorer
- [ ] All allocation wallets verified in TON wallet
- [ ] All transaction hashes saved
- [ ] Documentation updated with final addresses

---

**🎉 Congratulations! Your KWT token is now live on mainnet!**

