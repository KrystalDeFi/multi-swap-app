export interface TokenBalance {
    id: string;
    chain: string;
    name: string;
    symbol: string;
    display_symbol: string | null;
    optimized_symbol: string;
    decimals: number;
    logo_url: string | null;
    protocol_id: string;
    price: number;
    price_24h_change: number | null;
    is_verified: boolean;
    is_core: boolean;
    is_wallet: boolean;
    time_at: number;
    amount: number;
    raw_amount: number;
    raw_amount_hex_str: string;
}

export interface Token {
    chain: string;
    address: string;
    name: string; 
    symbol: string;
    logo_url: string | null;
    decimals: number;
}

export interface WalletConnection {
    isConnected: boolean;
    address: string | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}

export interface RpcEndpoint {
    url: string;
    chain_name: string;
    chain_id: number;
    name: string;
    healthy?: boolean;
}
