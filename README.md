# KWT v2 - TON Jetton Contract

KWT v2 is a TON blockchain jetton (token) contract with advanced features including burn mechanics and supply optimization. Fully TEP-74 compatible for exchange listing.

> ⚠️ **SECURITY WARNING**  
> Never commit or store real mnemonics, private keys, or other secrets in this repository.  
> Any `WALLET_MNEMONIC` usage in this project is for **local testing only**.  
> For mainnet operations, prefer **TON Connect** or **multisig signing**, and keep all secrets outside of source control.

## 📁 Project Structure

```
KWT-v2/
├── contracts/          # Smart contract source code (Tact language)
│   └── KWTMaster.tact  # Main jetton master contract
├── scripts/            # Deployment and interaction scripts
│   ├── deployKWTMaster.ts      # Deploy contract to testnet/mainnet
│   ├── sendConfigure.ts        # Send Configure message after deployment
│   ├── updateMetadataTestnet.ts # Update contract metadata (testnet)
│   ├── checkContractStatus.ts  # Check contract deployment status
│   └── mintTestnet.ts          # Mint tokens (testnet)
├── config/             # Configuration files
│   └── testnet.ts      # Testnet configuration
├── tests/              # Contract tests
├── build/              # Compiled contract artifacts
└── metadata.json       # Off-chain metadata file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Build

```bash
npm run build
```

## 📋 Deployment Guide

### Step 1: Configure

Edit `config/testnet.ts` and set:
- `METADATA_URI` - Your metadata JSON URL
- Wallet addresses for initial allocation (if needed)

### Step 2: Deploy Contract

```bash
npx blueprint run
```

**Select:**
1. `deployKWTMaster`
2. `testnet` (or `mainnet`)
3. Your wallet (regular EOA wallet, NOT the multisig owner)

**Important:**
- **For deploy**: Use a regular Tonkeeper EOA as sender (for example: the wallet with address `UQBMYaEQgbQog8mM7u11q2-3zZAuxU0mo9XVSqHqeLSZaCdu`)
- **Do NOT** use the multisig owner wallet for deployment
- The contract owner is still the multisig defined in `OWNER_ADDRESS_MAINNET`
- If you try to deploy from the multisig wallet, the script will reject the deployment

**After deployment:**
1. Copy the **contract address** from output
2. Copy the **owner address** from output (this will be the multisig wallet from config)
3. Update `config/testnet.ts`:
   ```typescript
   export const MASTER_ADDRESS_TESTNET = "YOUR_CONTRACT_ADDRESS";
   export const OWNER_ADDRESS_TESTNET = "YOUR_OWNER_ADDRESS";
   ```

### Step 3: Configure Contract

After deployment, you need to send the `Configure` message:

```bash
npx blueprint run
```

**Select:**
1. `sendConfigure`
2. `testnet`
3. **Multisig owner wallet** (MUST use multisig owner, not the deployment wallet)

**Important:**
- **For Configure and Initial Allocation**: Transactions MUST be sent from the multisig owner wallet

> ⚠️ **SECURITY WARNING**  
> Never commit or store real mnemonics, private keys, or other secrets in this repository.  
> Any `WALLET_MNEMONIC` examples below are for **local testing only**.  
> For mainnet operations, prefer **TON Connect** or **multisig signing**, and keep all secrets outside of source control.

**Using Mnemonic (recommended):**
```powershell
$env:WALLET_MNEMONIC="your 24 words"
$env:WALLET_VERSION="v4"
npx blueprint run
# → sendConfigure → testnet → Mnemonic
```

### Step 4: Update Metadata (if needed)

```bash
npx blueprint run
```

**Select:**
1. `updateMetadataTestnet`
2. `testnet`
3. **Owner wallet** (same as deployment)

⚠️ **Important:** Only the contract owner can update metadata!

## 📝 Configuration

### `config/testnet.ts`

```typescript
// Contract address - set after deployment
export const MASTER_ADDRESS_TESTNET = "";

// Owner wallet - set after deployment
export const OWNER_ADDRESS_TESTNET = "";

// Metadata URI
export const METADATA_URI = "https://kiwi.eu.com/kwt/metadata.json";

// Wallet addresses for initial allocation
export const AIRDROP_WALLET_TESTNET = "...";
export const TREASURY_WALLET_TESTNET = "...";
export const TEAM_WALLET_TESTNET = "...";
export const BURN_RESERVE_WALLET_TESTNET = "...";
```

## 📦 Metadata

Metadata follows TEP-64 standard (off-chain):

- **Location:** `https://kiwi.eu.com/kwt/metadata.json`
- **Format:** JSON with required fields:
  ```json
  {
    "name": "KWT Token",
    "description": "KWT v2 – TON jetton with burn mechanics",
    "symbol": "KWT",
    "decimals": 9,
    "image": "https://kiwi.eu.com/kwt/kwt-logo.webp"
  }
  ```

## 🔧 Contract Features

- ✅ **TEP-74 Compatible**: Full jetton standard implementation
- ✅ **Burn Mechanics**: Phase 1 and Phase 2 burn mechanisms
- ✅ **Supply Control**: Maximum supply enforcement (66B tokens)
- ✅ **Volume Tracking**: Daily volume tracking with automatic burns
- ✅ **On-Chain Metadata**: Metadata stored directly in contract

## 📜 Available Scripts

### `deployKWTMaster`
Deploys the contract to testnet/mainnet and sends Configure message.

**Usage:**
```bash
npx blueprint run
# → deployKWTMaster
# → testnet/mainnet
# → wallet
```

### `sendConfigure`
Sends Configure message to set metadata and wallet addresses.

**Usage:**
```bash
npx blueprint run
# → sendConfigure
# → testnet/mainnet
# → owner wallet (Mnemonic recommended)
```

⚠️ **Note:** Configure can only be sent once!

### `updateMetadataTestnet`
Updates contract metadata using TokenUpdateContent message (testnet).

**Usage:**
```bash
npx blueprint run
# → updateMetadataTestnet
# → testnet
# → owner wallet
```

⚠️ **Note:** Only contract owner can update metadata!

### `mintTestnet`
Mints tokens to a specified address (testnet).

**Usage:**
```bash
npx blueprint run
# → mintTestnet
# → testnet
# → owner wallet
```

⚠️ **Note:** Only contract owner can mint tokens!

### `checkContractStatus`
Checks contract deployment and configuration status.

**Usage:**
```bash
npx blueprint run
# → checkContractStatus
# → testnet/mainnet
```

## 🧪 Testing

```bash
npm test
```

## 📚 Contract Messages

### Owner Messages
- `Configure` - Set metadata and wallet addresses (one-time)
- `TokenUpdateContent` - Update metadata
- `Mint` - Mint tokens to a wallet
- `Owner: MintClose` - Permanently disable minting

### Standard Jetton Messages
- `TokenTransfer` - Transfer tokens
- `TokenBurn` - Burn tokens
- `TokenNotification` - Internal transfer notification

## 🔗 Links

- **TON Documentation:** https://ton.org/docs
- **Tact Language:** https://tact-lang.org
- **TEP-74 Standard:** https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md

## 📄 License

MIT
