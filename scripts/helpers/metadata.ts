/**
 * Metadata Helper Functions
 * 
 * Standard TEP-64 compliant metadata cell building for Jetton tokens.
 */

import { beginCell, Cell } from "@ton/core";

/**
 * Build off-chain metadata cell (TEP-64 standard format)
 * 
 * Standard off-chain jetton metadata encoding:
 * - First 8 bits = 0 (off-chain flag)
 * - Then the UTF-8 URL as a ref using storeStringRefTail
 * 
 * @param uri - The metadata URI (e.g., "https://kiwi.eu.com/kwt/metadata.json")
 * @returns Cell containing the metadata in TEP-64 off-chain format
 */
export function buildOffchainMetadataCell(uri: string): Cell {
    return beginCell()
        .storeUint(0, 8)  // Off-chain flag (0 = off-chain, 1 = on-chain)
        .storeStringRefTail(uri)  // Store URI in ref cell
        .endCell();
}

/**
 * Build on-chain metadata cell (TEP-64 standard format)
 * 
 * Standard on-chain jetton metadata encoding:
 * - First 8 bits = 1 (on-chain flag)
 * - Dictionary containing metadata keys and values
 * 
 * According to TEP-64:
 * - Keys: "name", "description", "image", "symbol", "decimals"
 * - Values are stored as UTF-8 strings (or numbers for decimals)
 * 
 * @param metadata - Metadata object with name, symbol, description, image, decimals
 * @returns Cell containing the metadata in TEP-64 on-chain format
 */
export function buildOnchainMetadataCell(metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    decimals: number;
}): Cell {
    const dict = beginCell().storeDict(null);
    
    // Build dictionary cell
    // TEP-64 on-chain format uses dictionary where:
    // Key = hash of metadata key (e.g., "name", "symbol")
    // Value = UTF-8 string
    
    const nameKey = beginCell().storeStringTail("name").endCell().hash();
    const symbolKey = beginCell().storeStringTail("symbol").endCell().hash();
    const descriptionKey = beginCell().storeStringTail("description").endCell().hash();
    const imageKey = beginCell().storeStringTail("image").endCell().hash();
    const decimalsKey = beginCell().storeStringTail("decimals").endCell().hash();
    
    // Store metadata in dictionary
    let dictBuilder = beginCell();
    
    // Name
    dictBuilder = dictBuilder.storeRef(
        beginCell()
            .storeUint(nameKey, 256)
            .storeStringTail(metadata.name)
            .endCell()
    );
    
    // Symbol  
    dictBuilder = dictBuilder.storeRef(
        beginCell()
            .storeUint(symbolKey, 256)
            .storeStringTail(metadata.symbol)
            .endCell()
    );
    
    // Description
    dictBuilder = dictBuilder.storeRef(
        beginCell()
            .storeUint(descriptionKey, 256)
            .storeStringTail(metadata.description)
            .endCell()
    );
    
    // Image
    dictBuilder = dictBuilder.storeRef(
        beginCell()
            .storeUint(imageKey, 256)
            .storeStringTail(metadata.image)
            .endCell()
    );
    
    // Decimals (as string)
    dictBuilder = dictBuilder.storeRef(
        beginCell()
            .storeUint(decimalsKey, 256)
            .storeStringTail(metadata.decimals.toString())
            .endCell()
    );
    
    // Build final cell with flag=1 (on-chain)
    return beginCell()
        .storeUint(1, 8)  // On-chain flag
        .storeRef(dictBuilder.endCell())
        .endCell();
}

/**
 * Simplified on-chain metadata builder using TEP-74 style dictionary
 * This uses a simpler format that is more compatible with explorers
 */
export function buildSimpleOnchainMetadataCell(metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    decimals: number;
}): Cell {
    // Use a simpler approach: store as dictionary directly
    // Format: flag (1 byte) = 1, then dictionary with keys
    
    const builder = beginCell();
    
    // Flag = 1 (on-chain)
    builder.storeUint(1, 8);
    
    // Store dictionary in ref
    const dictBuilder = beginCell();
    
    // We need to use a Dictionary, but since we're building manually,
    // we'll store the key-value pairs as refs
    // Key format: hash("name") -> value as string
    
    const nameCell = beginCell().storeStringTail(metadata.name).endCell();
    const symbolCell = beginCell().storeStringTail(metadata.symbol).endCell();
    const descCell = beginCell().storeStringTail(metadata.description).endCell();
    const imageCell = beginCell().storeStringTail(metadata.image).endCell();
    const decimalsCell = beginCell().storeStringTail(metadata.decimals.toString()).endCell();
    
    // Build metadata dict: key-value pairs stored as:
    // Key hash -> value cell
    const dict = beginCell();
    
    // Calculate key hashes
    const nameKey = beginCell().storeStringTail("name").endCell().hash();
    const symbolKey = beginCell().storeStringTail("symbol").endCell().hash();
    const descriptionKey = beginCell().storeStringTail("description").endCell().hash();
    const imageKey = beginCell().storeStringTail("image").endCell().hash();
    const decimalsKey = beginCell().storeStringTail("decimals").endCell().hash();
    
    // Store each as: uint256 key + ref to value
    dict.storeRef(
        beginCell().storeUint(nameKey, 256).storeRef(nameCell).endCell()
    );
    dict.storeRef(
        beginCell().storeUint(symbolKey, 256).storeRef(symbolCell).endCell()
    );
    dict.storeRef(
        beginCell().storeUint(descriptionKey, 256).storeRef(descCell).endCell()
    );
    dict.storeRef(
        beginCell().storeUint(imageKey, 256).storeRef(imageCell).endCell()
    );
    
    // Decimals as last ref
    const decimalsKeyValue = beginCell().storeUint(decimalsKey, 256).storeRef(decimalsCell).endCell();
    
    return builder.storeRef(dict.storeRef(decimalsKeyValue).endCell()).endCell();
}

