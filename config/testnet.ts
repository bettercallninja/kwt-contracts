/**
 * Testnet Configuration
 * Single source of truth for testnet deployment
 */

import { toNano } from '@ton/core';

// Contract address - set after deployment
export const MASTER_ADDRESS_TESTNET = 'UQCM8zF41FQoZR-p4WocrILZEp0bMJZtpl94T3AmD-h7zLJa';

// Owner wallet address - the wallet that deployed and owns the contract
export const OWNER_ADDRESS_TESTNET = "EQCk_siNjSBU7senQQ9BG4N8JZNWpXmmDOTCcD0lxR5xBmv8";
export const OWNER = OWNER_ADDRESS_TESTNET; // Alias for convenience

// Metadata URI
export const METADATA_URI = "https://kiwi.eu.com/kwt/metadata.json";

// Testnet wallet addresses for initial allocation
export const AIRDROP_WALLET_TESTNET = "0QCeE6d9CQg50dOTROhNmhkvYnRoPFvDWzwpJKJtupdkquVp";
export const TREASURY_WALLET_TESTNET = "0QA3o9RxGalIgXUt2NFxuq8Ibj6f1BrlkY91MIM53QqnS812";
export const TEAM_WALLET_TESTNET = "0QDlnqKxaV_KnSbjuwGAZF_y-9nBg8ZNQGjbw-rzUxKjLtGF";
export const BURN_RESERVE_WALLET_TESTNET = "0QCBhnS41k_7o_WPujLxewYAgAJVwOjunMPZ0YprFvOd4xFf";

// Aliases for convenience
export const AIRDROP_WALLET = AIRDROP_WALLET_TESTNET;
export const TREASURY_WALLET = TREASURY_WALLET_TESTNET;
export const TEAM_WALLET = TEAM_WALLET_TESTNET;
export const BURN_RESERVE_WALLET = BURN_RESERVE_WALLET_TESTNET;

// ============================================================================
// TOKENOMICS ALLOCATION (66B KWT total supply)
// ============================================================================
// Max Supply: 66,000,000,000 KWT (66B)
// All amounts are in KWT (will be converted to nano with 9 decimals)
// TODO: Fill in the REAL allocation amounts below

// Allocation amounts (in KWT, will be converted to nano)
export const ALLOC_AIRDROP = toNano("0"); // TODO: Set real amount
export const ALLOC_TREASURY = toNano("0"); // TODO: Set real amount
export const ALLOC_TEAM = toNano("0"); // TODO: Set real amount
export const ALLOC_BURN_RESERVE = toNano("0"); // TODO: Set real amount (should be 6.6B = 10% of 66B)
export const ALLOC_LIQUIDITY = toNano("0"); // TODO: Set real amount (if needed)
export const ALLOC_MARKETING = toNano("0"); // TODO: Set real amount (if needed)
export const ALLOC_OWNER_REMAINING = toNano("0"); // TODO: Set real amount (remaining after all allocations)

// Max Supply: 66B KWT = 66,000,000,000 * 10^9 nano
export const MAX_SUPPLY_NANO = toNano("66000000000"); // 66B KWT

// Helper: Calculate total allocation
export function getTotalAllocation(): bigint {
    return ALLOC_AIRDROP + 
           ALLOC_TREASURY + 
           ALLOC_TEAM + 
           ALLOC_BURN_RESERVE + 
           ALLOC_LIQUIDITY + 
           ALLOC_MARKETING + 
           ALLOC_OWNER_REMAINING;
}
