# Tonkeeper Assets Registration - Complete Guide

## ✅ Current Status

**Metadata in Contract**: ✅ CORRECT
- Format: On-chain (flag=1)
- Dictionary size: 5
- All fields present: name, symbol, description, image, decimals
- Values are correct

**Problem**: Tonkeeper and many explorers use the `ton-assets` GitHub repository to display token metadata, even if metadata is stored on-chain.

## 📋 Solution: Register in ton-assets

### Step 1: Prepare the File

I've created the file: `ton-assets/UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.json`

This file contains:
- Token name: "KIWI Token"
- Symbol: "KWT"
- Decimals: 9
- Description
- Image URL
- Social links
- Website

### Step 2: Fork and Clone Repository

1. Go to: https://github.com/tonkeeper/ton-assets
2. Click "Fork" to create your own copy
3. Clone your fork to your computer

### Step 3: Find the Correct Directory

The repository structure may be:
- `tokens/mainnet/` or
- `jettons/mainnet/` or
- `assets/tokens/mainnet/`

**Check the actual structure** by browsing the repository first!

### Step 4: Add Your Token File

1. Navigate to the correct directory (e.g., `tokens/mainnet/`)
2. Copy the file: `UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.json`
3. The filename should be the **non-bounceable** contract address

### Step 5: Create Pull Request

1. Commit the file to your fork
2. Push to GitHub
3. Create a Pull Request to the main repository
4. In the PR description, include:
   - Token name and symbol
   - Contract address
   - Brief description
   - Link to your website/social media

### Step 6: Wait for Approval

- Tonkeeper team will review your PR
- Usually takes 1-7 days
- They may request changes

## 📝 File Content

The JSON file I created is located at:
`ton-assets/UQDsOreZxZkTRYmU1RbqU4Gj-vLPH4ou2GEpgIm_tSt74xbu.json`

**Important**: Check the actual repository structure first to ensure you're using the correct format and directory!

## 🔍 Verification

After your PR is merged:
1. Wait 24-48 hours for Tonkeeper to update
2. Users need to update their Tonkeeper app
3. Check if token name, symbol, and logo appear correctly

## ⚠️ Important Notes

- The filename must match the **non-bounceable** contract address
- Make sure the JSON format matches other tokens in the repository
- Image URL must be accessible (CORS headers should allow all origins)
- Logo should be in PNG or SVG format, recommended size: 256x256px

## 📞 Support

If you need help:
- Check existing PRs in the repository for examples
- Contact Tonkeeper support if PR is not reviewed after 7 days
- Join Tonkeeper Telegram community for help

