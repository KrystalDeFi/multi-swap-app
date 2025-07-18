import { ethers } from 'ethers';
import { formatUnits } from 'ethers/lib/utils';


export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
    );
    return Promise.race([promise, timeout]);
};


export const shortAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const formatTokenBalance = (balance: number): string => {
    return balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const formatUSDValue = (value: number): string => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
};


export const formatTokenBalanceFromWei = (amount: string, decimals: number): string => {
    const balance = formatUnits(BigInt(amount), decimals);
    return parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const getBalanceFromWei = (amount: string, decimals: number): number => {
    return parseFloat(formatUnits(BigInt(amount), decimals));
};

export const getFullTokenBalanceFromHex = (hexBalance: string): string => {
    const balance = ethers.BigNumber.from(hexBalance);
    return formatUnits(balance);
};

// ERC20 ABI for balanceOf function
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    }
];

export const getWorkingRpcEndpoint = async (chainId: number): Promise<string> => {
    const { defaultRpcEndpointsByNetwork, NetworkByChainId } = await import('./constants');
    const endpoints = defaultRpcEndpointsByNetwork[chainId] || [];
    const network = NetworkByChainId[chainId];
    
    if (endpoints.length === 0) {
        const networkName = network ? network.display_name : `chain ${chainId}`;
        throw new Error(`No RPC endpoints found for ${networkName} (chain ID: ${chainId})`);
    }
    
    console.log(`Testing ${endpoints.length} RPC endpoints for ${network?.display_name || `chain ${chainId}`}`);
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing RPC endpoint: ${endpoint}`);
            
            const provider = new ethers.providers.JsonRpcProvider(endpoint, {
                name: `chain-${chainId}`,
                chainId: chainId
            });
            
            // Test the connection by getting the latest block number
            await withTimeout(provider.getBlockNumber(), 5000); // 5 second timeout
            
            console.log(`RPC endpoint working: ${endpoint}`);
            return endpoint;
        } catch (error) {
            console.error(`RPC endpoint failed: ${endpoint}`, error);
            continue;
        }
    }
    
    const networkName = network ? network.display_name : `chain ${chainId}`;
    throw new Error(`All RPC endpoints failed for ${networkName} (chain ID: ${chainId})`);
};

export const fetchTokenBalanceFromNode = async (
    tokenAddress: string, 
    walletAddress: string, 
    chainId: number,
    rpcUrl?: string
): Promise<{ balance: string; decimals: number }> => {
    try {
        // Get a working RPC endpoint
        const endpoint = rpcUrl || await getWorkingRpcEndpoint(chainId);
        
        console.log(`Using RPC endpoint: ${endpoint}`);
        
        // Create provider with explicit network configuration
        const provider = new ethers.providers.JsonRpcProvider(endpoint, {
            name: `chain-${chainId}`,
            chainId: chainId
        });
        
        // Create contract instance
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        
        // Fetch balance and decimals with timeout
        const [balance, decimals] = await Promise.all([
            withTimeout(contract.balanceOf(walletAddress), 10000) as Promise<ethers.BigNumber>, // 10 second timeout
            withTimeout(contract.decimals(), 10000) as Promise<number>
        ]);
        
        console.log(`Successfully fetched balance from ${endpoint}`);
        
        return {
            balance: formatUnits(balance, decimals),
            decimals
        };
    } catch (error: any) {
        console.error('Error fetching token balance from node:', error);
        throw error;
    }
};


