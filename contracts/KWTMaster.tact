// KWT v2 — Jetton Master (root) skeleton
// Tact 1.6.x compatible

import "@stdlib/ownable";

// ---------- Messages specific to KWT master ----------

message Mint {
    amount: Int as coins;
    receiver: Address;
}

// Initial allocation message - mint to a single wallet
// For multiple mints, owner should call this message multiple times
// This is simpler than using Cell serialization
message MintMany {
    amount: Int as coins;
    receiver: Address;
}

// Configuration message - set metadata and wallet addresses after deployment
message Configure {
    content: Cell;
    airdrop_wallet: Address;
    treasury_wallet: Address;
    team_wallet: Address;
    burn_reserve_wallet: Address;
}

// Simple deploy message - just for initial deployment (minimal size)
message(0x00000001) Deploy {}

// ---------- Jetton data structures ----------

struct JettonData {
    totalSupply: Int;
    mintable: Bool;
    owner: Address;
    content: Cell;
    walletCode: Cell;
}

struct JettonWalletData {
    balance: Int;
    owner: Address;
    master: Address;
    walletCode: Cell;
}

struct DebugState {
    configured: Bool;
    mintable: Bool;
    totalSupply: Int;
    owner: Address;
}

struct AllocationWallets {
    airdrop_wallet: Address;
    treasury_wallet: Address;
    team_wallet: Address;
    burn_reserve_wallet: Address;
}

struct SupplyInfo {
    max_supply: Int;
    burn_reserve_total: Int;
}

struct BurnStats {
    total_supply: Int;
    burn_reserve_total: Int;
    burn_reserve_used: Int;
    burn_reserve_remaining: Int;
    daily_volume: Int;
    daily_burn_triggered: Bool;
}

// ---------- Jetton standard messages (TEP-74 style) ----------

message(0xf8a7ea5) TokenTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address?;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x178d4519) TokenTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    response_destination: Address?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

message(0x7362d09c) TokenNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    forward_payload: Slice as remaining;
}

message(0x595f07bc) TokenBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    response_destination: Address?;
}

message(0x7bdd97de) TokenBurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    response_destination: Address?;
}

message(0xd53276db) TokenExcesses {
    queryId: Int as uint64;
}

message TokenUpdateContent {
    content: Cell;
}

// ---------- Jetton master trait (shared logic) ----------

@interface("org.ton.jetton.master")
trait Jetton with Ownable {

    // Core state (we will mirror this in KWTMaster)
    totalSupply: Int;
    mintable: Bool;
    owner: Address;
    content: Cell;

    // Extra control for KWT v2
    max_supply: Int; // not required by TEP-74, but useful

    // --- Internal helpers ---

    receive(msg: TokenUpdateContent) {
        // Only owner can update metadata
        self.requireOwner();
        self.content = msg.content;
    }

    // NOTE: TokenBurnNotification handler is implemented in KWTMaster contract
    // (not in trait) to have access to burn tracking state (burn_reserve_used, etc.)
    // This avoids duplicate receiver conflict

    // Mint helper – core logic to create / top-up wallets
    // IMPORTANT: in KWT v2 we control how this function is called
    // NOTE: This function must be virtual so KWTMaster can override it
    virtual fun mint(to: Address, amount: Int, response_destination: Address?) {
        require(amount > 0, "amount must be positive");
        require(self.totalSupply + amount <= self.max_supply, "max_supply exceeded");

        self.totalSupply = self.totalSupply + amount;

        let winit: StateInit = self.getJettonWalletInit(to);
        let walletAddress: Address = contractAddress(winit);
        
        // Use proper value for wallet initialization (minimum storage fee)
        send(SendParameters{
            to: walletAddress,
            value: ton("0.05"), // Minimum value for wallet initialization
            bounce: false,
            mode: SendRemainingValue,
            body: TokenTransferInternal{
                queryId: 0,
                amount: amount,
                from: myAddress(),
                response_destination: response_destination,
                forward_ton_amount: 0,
                forward_payload: emptySlice()
            }.toCell(),
            code: winit.code,
            data: winit.data
        });
    }

    fun requireWallet(owner: Address) {
        let ctx: Context = context();
        let winit: StateInit = self.getJettonWalletInit(owner);
        require(contractAddress(winit) == ctx.sender, "invalid wallet sender");
    }

    // Default wallet init (we use JettonDefaultWallet defined below)
    virtual fun getJettonWalletInit(address: Address): StateInit {
        return initOf JettonDefaultWallet(myAddress(), address);
    }

    // ---------- Getters for explorers / wallets ----------

    get fun get_jetton_data(): JettonData {
        // Use owner address to get wallet code template (code doesn't depend on the address parameter)
        // The wallet code is the same for all addresses, only data differs
        // This is the standard way to get wallet code for TEP-74 compatibility
        let code: Cell = self.getJettonWalletInit(self.owner).code;
        return JettonData{
            totalSupply: self.totalSupply,
            mintable: self.mintable,
            owner: self.owner,
            content: self.content,
            walletCode: code
        };
    }

    get fun get_wallet_address(owner: Address): Address {
        let winit: StateInit = self.getJettonWalletInit(owner);
        return contractAddress(winit);
    }
}

// ---------- Default Jetton wallet implementation ----------
// For now we keep this simple version, later if needed we can separate KWTWallet.

@interface("org.ton.jetton.wallet")
contract JettonDefaultWallet {
    const minTonsForStorage: Int = ton("0.01");
    const gasConsumption: Int = ton("0.01");

    balance: Int;
    owner: Address;
    master: Address;

    init(master: Address, owner: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }

    receive(msg: TokenTransfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "invalid sender");

        let fwdFee: Int = ctx.readForwardFee() + ctx.readForwardFee();
        let final: Int = 2 * self.gasConsumption + self.minTonsForStorage + fwdFee;
        require(ctx.value >= min(final, ton("0.01")), "invalid value");

        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "invalid balance");

        let init: StateInit = initOf JettonDefaultWallet(self.master, msg.destination);
        let walletAddress: Address = contractAddress(init);

        send(SendParameters{
            to: walletAddress,
            value: 0,
            mode: SendRemainingValue,
            bounce: false,
            body: TokenTransferInternal{
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner,
                response_destination: msg.response_destination,
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: msg.forward_payload
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    receive(msg: TokenTransferInternal) {
        let ctx: Context = context();

        if (ctx.sender != self.master) {
            let sinit: StateInit = initOf JettonDefaultWallet(self.master, msg.from);
            require(contractAddress(sinit) == ctx.sender, "invalid internal sender");
        }

        self.balance = self.balance + msg.amount;
        require(self.balance >= 0, "invalid balance");

        let msgValue: Int = self.msgValue(ctx.value);
        let fwdFee: Int = ctx.readForwardFee();
        let payloadValue: Int = msg.forward_ton_amount;

        if (payloadValue > 0) {
            send(SendParameters{
                to: self.owner,
                value: payloadValue,
                mode: SendPayGasSeparately + SendIgnoreErrors,
                bounce: false,
                body: TokenNotification{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    from: msg.from,
                    forward_payload: msg.forward_payload
                }.toCell()
            });
        }

        if (msg.response_destination != null) {
            send(SendParameters{
                to: msg.response_destination!!,
                value: msgValue - payloadValue - fwdFee,
                bounce: false,
                body: TokenExcesses{
                    queryId: msg.queryId
                }.toCell(),
                mode: SendIgnoreErrors
            });
        }
    }

    receive(msg: TokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "invalid sender");

        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "invalid balance");

        let fwdFee: Int = ctx.readForwardFee();
        require(ctx.value >= fwdFee + 2 * self.gasConsumption + self.minTonsForStorage, "invalid value for burn");

        send(SendParameters{
            to: self.master,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: TokenBurnNotification{
                queryId: msg.queryId,
                amount: msg.amount,
                owner: self.owner,
                response_destination: self.owner
            }.toCell()
        });
    }

    get fun msgValue(value: Int): Int {
        let mv: Int = value;
        let tonBalanceBeforeMsg: Int = myBalance() - mv;
        let storageFee: Int = self.minTonsForStorage - min(tonBalanceBeforeMsg, self.minTonsForStorage);
        return mv - (storageFee + self.gasConsumption);
    }

    bounced(src: bounced<TokenBurn>) {
        self.balance = self.balance + src.amount;
    }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            walletCode: (initOf JettonDefaultWallet(self.master, self.owner)).code
        };
    }
}

// ---------- KWTMaster root contract ----------

contract KWTMaster with Jetton {

    // Core Jetton state (required by trait)
    totalSupply: Int;
    mintable: Bool;
    owner: Address;
    content: Cell;
    max_supply: Int;

    // KWT-specific state: Initial allocation wallets
    airdrop_wallet: Address;
    treasury_wallet: Address;
    team_wallet: Address;
    burn_reserve_wallet: Address;

    // Burn reserve system
    // Current status: These variables are used for Phase 1 burn
    // burn_reserve_total: Maximum amount that can be burned in Phase 1 (6.6B = 10% of 66B)
    burn_reserve_total: Int;      
    // burn_reserve_used: Amount used from reserve (must be incremented each time a real burn occurs)
    burn_reserve_used: Int;       

    // Daily volume tracking
    // Current status: These variables are used for tracking daily transaction volume
    daily_volume: Int;
    last_reset_time: Int;         // Unix timestamp of last 24h reset
    daily_burn_triggered: Bool;   // Flag to prevent multiple burns per 24h


    // Configuration flag - indicates if contract is fully configured after deployment
    configured: Bool;

    init(
        owner: Address,
        max_supply: Int as coins
    ) {
        // Core Jetton initialization
        self.totalSupply = 0;
        self.owner = owner;
        self.mintable = true;
        self.max_supply = max_supply;
        self.configured = false; // Will be set to true after Configure message

        // Set default/neutral values for fields that will be configured later
        self.content = emptyCell();
        self.airdrop_wallet = myAddress(); // Temporary placeholder - will be set by Configure
        self.treasury_wallet = myAddress();
        self.team_wallet = myAddress();
        self.burn_reserve_wallet = myAddress();

        // Burn reserve: 6.6B (10% of 66B)
        self.burn_reserve_total = 6_600_000_000 * 1_000_000_000; // in nano (9 decimals)
        self.burn_reserve_used = 0;

        // Daily volume tracking
        self.daily_volume = 0;
        self.last_reset_time = now();
        self.daily_burn_triggered = false;

    }

    // Override wallet init to use KWTWallet instead of JettonDefaultWallet
    override fun getJettonWalletInit(address: Address): StateInit {
        return initOf KWTWallet(myAddress(), address);
    }

    // Simple deploy message - just accepts and does nothing (minimal size for deploy)
    receive(msg: Deploy) {
        // Do nothing - just accept the deploy message
        // This allows deployment with minimal message size
    }

    // Configuration message - set metadata and wallet addresses after deployment
    // This must be called once by owner before any minting operations
    receive(msg: Configure) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "not owner");
        require(!self.configured, "already configured");

        self.content = msg.content;
        self.airdrop_wallet = msg.airdrop_wallet;
        self.treasury_wallet = msg.treasury_wallet;
        self.team_wallet = msg.team_wallet;
        self.burn_reserve_wallet = msg.burn_reserve_wallet;

        // Mark as configured - this enables minting operations
        self.configured = true;
    }

    // Helper function to mint tokens
    fun do_mint(to: Address, amount: Int) {
        require(amount > 0, "amount must be positive");
        require(self.totalSupply + amount <= self.max_supply, "max_supply exceeded");
        self.mint(to, amount, null);
    }

    // Single mint (backward compatibility)
    receive(msg: Mint) {
        let ctx: Context = context();
        require(self.configured, "not configured");
        require(ctx.sender == self.owner, "not owner");
        require(self.mintable, "minting disabled");
        self.do_mint(msg.receiver, msg.amount);
    }

    // Initial allocation: mint to a wallet
    // Owner can call this multiple times for different wallets during initial allocation
    // After all initial allocations are done, owner MUST call "Owner: MintClose" to permanently disable minting
    receive(msg: MintMany) {
        let ctx: Context = context();
        require(self.configured, "not configured");
        // Security checks: only owner can mint, and only when mintable is true
        require(ctx.sender == self.owner, "not owner");
        require(self.mintable, "minting disabled");
        
        // Mint tokens (do_mint checks amount > 0 and max_supply)
        self.do_mint(msg.receiver, msg.amount);
        
        // Note: mintable remains true after this call
        // Owner must explicitly call "Owner: MintClose" to disable minting permanently
        // This allows owner to do multiple MintMany calls for different wallets
    }

    // Permanently disable minting (one-way operation, cannot be re-enabled)
    // Owner must call this after completing all initial allocations
    receive("Owner: MintClose") {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "not owner");
        // Permanently disable minting - this is a one-way operation
        self.mintable = false;
    }

    // Helper: Get remaining burn reserve
    // Current status: Returns the remaining amount from burn reserve
    // If burn_reserve_used >= burn_reserve_total, Phase 1 is complete and returns 0
    fun getBurnReserveRemaining(): Int {
        if (self.burn_reserve_used >= self.burn_reserve_total) {
            return 0;
        }
        return self.burn_reserve_total - self.burn_reserve_used;
    }

    // Helper: Reset daily volume if 24 hours passed
    // Current status: If 24 hours have passed, resets daily_volume
    fun updateDailyVolume() {
        let currentTime: Int = now();
        if (currentTime - self.last_reset_time >= 86400) {
            self.daily_volume = 0;
            self.last_reset_time = currentTime;
            self.daily_burn_triggered = false;
        }
    }

    // Helper: Update daily volume (only tracking, no automatic burns)
    // This function only tracks transaction volume and does not perform automatic burns
    // Real burns must be performed from the wallet
    fun updateDailyVolumeTracking(amount: Int) {
        self.updateDailyVolume();
        self.daily_volume = self.daily_volume + amount;
    }

    // Override mint function to ensure totalSupply is updated correctly
    // This is critical: the trait's mint function updates totalSupply, but we need to ensure
    // it's properly synchronized with KWTMaster's state
    override fun mint(to: Address, amount: Int, response_destination: Address?) {
        require(amount > 0, "amount must be positive");
        require(self.totalSupply + amount <= self.max_supply, "max_supply exceeded");
        
        // CRITICAL: Update totalSupply BEFORE sending to wallet
        // This ensures the state is updated immediately
        self.totalSupply = self.totalSupply + amount;
        
        let winit: StateInit = self.getJettonWalletInit(to);
        let walletAddress: Address = contractAddress(winit);
        
        // Use proper value for wallet initialization (minimum storage fee)
        send(SendParameters{
            to: walletAddress,
            value: ton("0.05"), // Minimum value for wallet initialization
            bounce: false,
            mode: SendRemainingValue,
            body: TokenTransferInternal{
                queryId: 0,
                amount: amount,
                from: myAddress(),
                response_destination: response_destination,
                forward_ton_amount: 0,
                forward_payload: emptySlice()
            }.toCell(),
            code: winit.code,
            data: winit.data
        });
    }

    // Override TokenBurnNotification from trait to track burn_reserve_used
    // Each time a real burn occurs (from Phase 1 or Phase 2), this function is called
    // Must track burn_reserve_used and update burn statistics
    receive(msg: TokenBurnNotification) {
        self.requireWallet(msg.owner);
        
        // Decrease totalSupply (same as trait)
        self.totalSupply = self.totalSupply - msg.amount;
        require(self.totalSupply >= 0, "invalid total supply after burn");

        // Phase 1 burn tracking: cap at burn_reserve_total
        // Each real burn from any wallet, up to the limit of 6.6B, is counted as "burn reserve" consumption
        if (self.burn_reserve_total > 0) {
            let remaining: Int = self.getBurnReserveRemaining();
            if (remaining > 0) {
                let applied: Int = min(msg.amount, remaining);
                self.burn_reserve_used = self.burn_reserve_used + applied;
            }
        }

        // Send response if response_destination is specified
        if (msg.response_destination != null) {
            send(SendParameters{
                to: msg.response_destination!!,
                value: 0,
                bounce: false,
                mode: SendRemainingValue + SendIgnoreErrors,
                body: TokenExcesses{
                    queryId: msg.queryId
                }.toCell()
            });
        }
    }

    // Hook for transfer notifications
    // Each time a transfer is performed, this function is called
    // Only tracks transaction volume (does not perform automatic burns)
    receive(msg: TokenNotification) {
        self.updateDailyVolumeTracking(msg.amount);
    }

    // Getter function for external queries
    get fun get_burn_reserve_remaining(): Int {
        return self.getBurnReserveRemaining();
    }

    // Debug getter to check contract state
    get fun get_debug_state(): DebugState {
        return DebugState{
            configured: self.configured,
            mintable: self.mintable,
            totalSupply: self.totalSupply,
            owner: self.owner
        };
    }

    // Getter for allocation wallet addresses (for external scripts)
    get fun get_allocation_wallets(): AllocationWallets {
        return AllocationWallets{
            airdrop_wallet: self.airdrop_wallet,
            treasury_wallet: self.treasury_wallet,
            team_wallet: self.team_wallet,
            burn_reserve_wallet: self.burn_reserve_wallet
        };
    }

    // Getter for max supply and burn reserve (for calculating allocations)
    get fun get_supply_info(): SupplyInfo {
        return SupplyInfo{
            max_supply: self.max_supply,
            burn_reserve_total: self.burn_reserve_total
        };
    }

    // Getter for burn statistics
    get fun get_burn_stats(): BurnStats {
        return BurnStats{
            total_supply: self.totalSupply,
            burn_reserve_total: self.burn_reserve_total,
            burn_reserve_used: self.burn_reserve_used,
            burn_reserve_remaining: self.getBurnReserveRemaining(),
            daily_volume: self.daily_volume,
            daily_burn_triggered: self.daily_burn_triggered
        };
    }

    // Getter for daily volume (for tracking purposes)
    get fun get_daily_volume(): Int {
        return self.daily_volume;
    }
}

// ---------- KWT Custom Wallet with Phase 2 Burn ----------

@interface("org.ton.jetton.wallet")
contract KWTWallet {
    const minTonsForStorage: Int = ton("0.01");
    const gasConsumption: Int = ton("0.01");
    // Phase 2 burn constants
    // Current status: If transfer >= 1M tokens, 50 tokens are burned
    const phase2BurnThreshold: Int = 1_000_000 * 1_000_000_000; // 1M tokens (with 9 decimals)
    const phase2BurnAmount: Int = 50 * 1_000_000_000; // 50 tokens (with 9 decimals)

    balance: Int;
    owner: Address;
    master: Address;

    init(master: Address, owner: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }

    // Helper: Check if Phase 2 burn should happen
    // Phase 2: If transfer >= 1M tokens, 50 tokens are burned
    // Returns amount to burn (0 if no burn needed)
    fun shouldBurnPhase2(transferAmount: Int): Int {
        if (transferAmount >= self.phase2BurnThreshold) {
            return self.phase2BurnAmount;
        }
        return 0;
    }

    // Standard TokenTransfer with Phase 2 burn
    // Simplified logic: If transfer >= 1M tokens, burns 50 tokens
    // Master contract in TokenBurnNotification determines if this burn is from Phase 1 or Phase 2
    receive(msg: TokenTransfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "invalid sender");

        let fwdFee: Int = ctx.readForwardFee() + ctx.readForwardFee();
        let final: Int = 2 * self.gasConsumption + self.minTonsForStorage + fwdFee;
        require(ctx.value >= min(final, ton("0.05")), "invalid value");
        
        // Phase 2 burn: If transfer >= 1M tokens, burns 50 tokens
        let phase2BurnAmount: Int = self.shouldBurnPhase2(msg.amount);
        let totalDeduct: Int = msg.amount + phase2BurnAmount;

        self.balance = self.balance - totalDeduct;
        require(self.balance >= 0, "invalid balance");

        // Perform Phase 2 burn (if needed)
        if (phase2BurnAmount > 0) {
            send(SendParameters{
                to: self.master,
                value: 0,
                mode: SendRemainingValue,
                bounce: true,
                body: TokenBurnNotification{
                    queryId: msg.queryId,
                    amount: phase2BurnAmount,
                    owner: self.owner,
                    response_destination: null
                }.toCell()
            });
        }

        // Send transfer
        let init: StateInit = initOf KWTWallet(self.master, msg.destination);
        let walletAddress: Address = contractAddress(init);

        // Use proper value for wallet initialization
        send(SendParameters{
            to: walletAddress,
            value: ton("0.05"), // Minimum value for wallet initialization
            mode: SendRemainingValue,
            bounce: false,
            body: TokenTransferInternal{
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner,
                response_destination: msg.response_destination,
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: msg.forward_payload
            }.toCell(),
            code: init.code,
            data: init.data
        });

        // Notify master for volume tracking
        send(SendParameters{
            to: self.master,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            bounce: false,
            body: TokenNotification{
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner,
                forward_payload: emptySlice()
            }.toCell()
        });
    }

    // Receive internal transfer from another wallet
    // Current status: Adds received tokens to balance
    receive(msg: TokenTransferInternal) {
        let ctx: Context = context();

        if (ctx.sender != self.master) {
            let sinit: StateInit = initOf KWTWallet(self.master, msg.from);
            require(contractAddress(sinit) == ctx.sender, "invalid internal sender");
        }

        self.balance = self.balance + msg.amount;
        require(self.balance >= 0, "invalid balance");

        let msgValue: Int = self.msgValue(ctx.value);
        let fwdFee: Int = ctx.readForwardFee();
        let payloadValue: Int = msg.forward_ton_amount;

        if (payloadValue > 0) {
            send(SendParameters{
                to: self.owner,
                value: payloadValue,
                mode: SendPayGasSeparately + SendIgnoreErrors,
                bounce: false,
                body: TokenNotification{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    from: msg.from,
                    forward_payload: msg.forward_payload
                }.toCell()
            });
        }

        if (msg.response_destination != null) {
            send(SendParameters{
                to: msg.response_destination!!,
                value: msgValue - payloadValue - fwdFee,
                bounce: false,
                body: TokenExcesses{
                    queryId: msg.queryId
                }.toCell(),
                mode: SendIgnoreErrors
            });
        }
    }

    receive(msg: TokenBurn) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "invalid sender");

        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "invalid balance");

        let fwdFee: Int = ctx.readForwardFee();
        require(ctx.value >= fwdFee + 2 * self.gasConsumption + self.minTonsForStorage, "invalid value for burn");

        send(SendParameters{
            to: self.master,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: TokenBurnNotification{
                queryId: msg.queryId,
                amount: msg.amount,
                owner: self.owner,
                response_destination: self.owner
            }.toCell()
        });
    }


    get fun msgValue(value: Int): Int {
        let mv: Int = value;
        let tonBalanceBeforeMsg: Int = myBalance() - mv;
        let storageFee: Int = self.minTonsForStorage - min(tonBalanceBeforeMsg, self.minTonsForStorage);
        return mv - (storageFee + self.gasConsumption);
    }

    bounced(src: bounced<TokenBurn>) {
        self.balance = self.balance + src.amount;
    }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            walletCode: (initOf KWTWallet(self.master, self.owner)).code
        };
    }
}
