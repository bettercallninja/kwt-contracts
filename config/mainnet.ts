/**
 * Mainnet Configuration
 * Single source of truth for mainnet deployment
 * 
 * ⚠️  IMPORTANT: Fill in all addresses before deployment!
 */

import { toNano } from '@ton/core';

// Contract address - set after deployment
export const MASTER_ADDRESS_MAINNET = "EQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt740sr";

// Owner wallet address - the wallet that will deploy and own the contract
// This is the multisig wallet that will control the contract
export const OWNER_ADDRESS_MAINNET = "EQCY8a7rHtvsyCpw-ZrwG4lkkhU79ppKQVT1OIIGrkXSN9wI";
export const OWNER = OWNER_ADDRESS_MAINNET; // Alias for convenience

// Metadata URI
export const METADATA_URI = "https://kiwi.eu.com/kwt/metadata.json";

// Mainnet wallet addresses for initial allocation
// ⚠️  CRITICAL: These addresses will receive the allocated tokens!
export const AIRDROP_WALLET_MAINNET = "UQA1CmtLSWj7MyAlFo7Hf1G1ACoQpSWuS2PDP4w6x-hHm-RK";
export const TREASURY_WALLET_MAINNET = "UQBRMP2yDQDqoy9TNkx8VDqpx5Xs9N1NjyCkzkNWPEeBNbcT";
export const TEAM_WALLET_MAINNET = "UQAoYk-kXRulgzWU5d-H5TB49sEglrDK5BvMlnYrGu117BOx";
export const BURN_RESERVE_WALLET_MAINNET = "UQByU6VQYPHZCh6jJ7oE7kIUjWZu_MdUWP9t70pS1TAltBmL";

// Aliases for convenience
export const AIRDROP_WALLET = AIRDROP_WALLET_MAINNET;
export const TREASURY_WALLET = TREASURY_WALLET_MAINNET;
export const TEAM_WALLET = TEAM_WALLET_MAINNET;
export const BURN_RESERVE_WALLET = BURN_RESERVE_WALLET_MAINNET;

// Max Supply: 66B KWT = 66,000,000,000 * 10^9 nano
export const MAX_SUPPLY_NANO = toNano("66000000000"); // 66B KWT

