# 📋 Complete Guide: Registering KWT Token in Tonkeeper Assets

## 🎯 Goal
Register your KWT token in the `ton-assets` repository so that Tonkeeper and other explorers can display the correct token name, symbol, and logo.

## 📊 Current Status

### ✅ Contract Metadata (On-Chain)
- **Status**: ✅ CORRECT
- **Format**: TEP-64 on-chain (flag=1)
- **Dictionary Size**: 5 fields
- **All Fields Present**: name, symbol, description, image, decimals
- **Verified**: All values are correct

### ❌ Problem
Tonkeeper and many explorers use the `ton-assets` GitHub repository to display token metadata, even when metadata is stored on-chain. You need to register your token there.

---

## 📝 Step-by-Step Registration Process

### Step 1: Prepare Your Information

**Contract Address (Bounceable):**
```
EQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt740sr
```

**Contract Address (Non-bounceable - for filename):**
```
UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu
```

**Token Details:**
- **Name**: KIWI Token
- **Symbol**: KWT
- **Decimals**: 9
- **Description**: KWT is the main utility and governance token of the KIWI ecosystem on the TON blockchain.
- **Image URL**: https://kiwi.eu.com/kwt/kwt-logo.webp
- **Website**: https://kiwi.eu.com
- **Telegram**: https://t.me/kiwitalkshow
- **Twitter**: https://x.com/kiwitalkshow

**Total Supply**: 66,000,000,000 KWT (66 Billion)

---

### Step 2: Fork the Repository

1. Go to: **https://github.com/tonkeeper/ton-assets**
2. Click the **"Fork"** button (top right)
3. This creates your own copy of the repository

---

### Step 3: Explore Repository Structure

**IMPORTANT**: Before adding your file, check the actual structure!

1. In your forked repository, browse the directory structure
2. Look for directories like:
   - `jettons/` (most likely)
   - `tokens/` or `tokens/mainnet/`
3. Check existing token files to understand the format
4. Common structure might be:
   ```
   ton-assets/
   ├── jettons/
   │   ├── UQ...xxx.yaml
   │   └── UQ...yyy.yaml
   ```
   **Note**: Files are in **YAML format**, not JSON!

---

### Step 4: Create Your Token File

**File Location**: 
- Directory: `jettons/` (check the actual repository structure!)
- Filename: `UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.yaml`
- **Important**: 
  - Use the **non-bounceable** contract address as filename
  - File format is **YAML**, not JSON!

**File Content** (I've already created this file in your project):
```yaml
name: KIWI Token
symbol: KWT
decimals: 9
description: KWT is the main utility and governance token of the KIWI ecosystem on the TON blockchain.
image: https://kiwi.eu.com/kwt/kwt-logo.webp
address: EQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt740sr
social:
  - website: https://kiwi.eu.com
  - telegram: https://t.me/kiwitalkshow
  - twitter: https://x.com/kiwitalkshow
```

**File Location in Your Project:**
```
ton-assets/UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.yaml
```

**Note**: The repository uses **YAML format**, not JSON!

---

### Step 5: Add File to Your Fork

**Option A: Using GitHub Web Interface**

1. In your forked repository, navigate to the correct directory (e.g., `jettons/`)
2. Click **"Add file"** → **"Create new file"**
3. Filename: `UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.yaml`
4. Copy the YAML content from the file I created
5. Click **"Commit new file"**
6. Write commit message: `Add KIWI Token (KWT) metadata`

**Option B: Using Git Command Line**

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ton-assets.git
cd ton-assets

# Navigate to correct directory (check structure first!)
cd jettons  # or tokens/mainnet - check actual structure!

# Copy the YAML file
# Copy from: ton-assets/UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.yaml
# To: jettons/UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.yaml

# Commit and push
git add jettons/UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.yaml
git commit -m "Add KIWI Token (KWT) metadata"
git push origin main
```

---

### Step 6: Create Pull Request

1. Go to your forked repository on GitHub
2. You should see a banner: **"Compare & pull request"** - click it
3. Or go to the original repository: https://github.com/tonkeeper/ton-assets
4. Click **"Pull requests"** → **"New pull request"**
5. Select: **"compare across forks"**
6. Base: `tonkeeper/ton-assets:main`
7. Head: `YOUR_USERNAME/ton-assets:main`

**PR Title:**
```
Add KIWI Token (KWT) - Mainnet
```

**PR Description Template:**
```markdown
## Token Information

- **Name**: KIWI Token
- **Symbol**: KWT
- **Decimals**: 9
- **Contract Address**: EQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt740sr
- **Network**: Mainnet
- **Total Supply**: 66,000,000,000 KWT

## Links

- Website: https://kiwi.eu.com
- Telegram: https://t.me/kiwitalkshow
- Twitter: https://x.com/kiwitalkshow
- Logo: https://kiwi.eu.com/kwt/kwt-logo.webp

## Description

KWT is the main utility and governance token of the KIWI ecosystem on the TON blockchain.

## Verification

- Contract is deployed and verified on mainnet
- Metadata is stored on-chain (TEP-64 format)
- Total supply: 66B tokens
- All allocations completed
- Minting permanently disabled
```

---

### Step 7: Wait for Review

- Tonkeeper team will review your PR
- Usually takes **1-7 days**
- They may request changes or ask questions
- Monitor your PR for comments

---

### Step 8: After PR is Merged

1. **Wait 24-48 hours** for Tonkeeper to update their database
2. **Update Tonkeeper app** to the latest version
3. **Check token display** - name, symbol, and logo should appear correctly
4. **Explorers** should also update within a few days

---

## 📁 File Reference

The YAML file is already created in your project at:
```
ton-assets/UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.yaml
```

You can copy this file content when creating the PR.

**File Content:**
```yaml
name: KIWI Token
symbol: KWT
decimals: 9
description: KWT is the main utility and governance token of the KIWI ecosystem on the TON blockchain.
image: https://kiwi.eu.com/kwt/kwt-logo.webp
address: EQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt740sr
social:
  - website: https://kiwi.eu.com
  - telegram: https://t.me/kiwitalkshow
  - twitter: https://x.com/kiwitalkshow
```

---

## ⚠️ Important Notes

1. **Filename Format**: Must be the **non-bounceable** contract address with `.yaml` extension
2. **Directory**: Check the actual repository structure first! (likely `jettons/`)
3. **YAML Format**: Must match existing token files in the repository (YAML, not JSON!)
4. **Image Requirements**:
   - Format: PNG, SVG, or WebP
   - Recommended size: 256x256px
   - Must be accessible (CORS headers should allow all origins)
   - URL must be HTTPS

5. **Verification**: Make sure:
   - Contract is deployed on mainnet
   - Token is functional (transfers work)
   - Metadata is accessible

---

## 🔍 Verification Checklist

Before submitting PR, verify:

- [ ] Contract address is correct (non-bounceable format for filename)
- [ ] YAML format matches other tokens in repository
- [ ] File extension is `.yaml` (not `.json`)
- [ ] All required fields are present
- [ ] Image URL is accessible
- [ ] Social links are correct
- [ ] Website URL is correct
- [ ] No typos in name or symbol

---

## 📞 Support

If you need help:

1. **Check existing PRs** in the repository for examples
2. **Read repository README** for guidelines
3. **Contact Tonkeeper support** if PR is not reviewed after 7 days
4. **Join Tonkeeper community** on Telegram

---

## 🎉 Expected Result

After your PR is merged and Tonkeeper updates:

- ✅ Token name: "KIWI Token" (instead of "Unknown Token40sr")
- ✅ Token symbol: "KWT" (instead of "UKWN40sr")
- ✅ Token logo: Your logo image
- ✅ Correct display in Tonkeeper wallet
- ✅ Correct display in explorers (Tonscan, Tonviewer)

---

## 📝 Summary

1. Fork: https://github.com/tonkeeper/ton-assets
2. Check directory structure (likely `jettons/`)
3. Add file: `UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.yaml`
4. Create Pull Request
5. Wait for approval (1-7 days)
6. After merge, wait 24-48 hours
7. Update Tonkeeper app
8. Verify token displays correctly

**Good luck! 🚀**

