import { DestTokensByChain, NetworkByName } from '../utils/constants';
import { TokenBalance } from '../types';
import React, { useState, useEffect } from 'react';
import { getFullTokenBalanceFromHex, fetchTokenBalanceFromNode, getWorkingRpcEndpoint, withTimeout } from '../utils/utils';
import { Widget } from "@kyberswap/widgets";
import { ethers } from 'ethers';


interface SwapBoxProps {
    walletAddress: string;
    token: TokenBalance;
    onBalanceUpdate?: (newBalance: string) => void;
    onToast?: (message: string, type: 'success' | 'error' | 'info') => void;
    onBalanceUpdating?: (isUpdating: boolean) => void;
}

const SwapBox: React.FC<SwapBoxProps> = ({ walletAddress, token, onBalanceUpdate, onToast, onBalanceUpdating }) => {
    // const storedDest = localStorage.getItem(`selectedDestToken_${token?.chain}`);
    const [isProviderReady, setIsProviderReady] = useState<boolean>(false);
    const [isMonitoringTx, setIsMonitoringTx] = useState<boolean>(false);
    const [currentTxHash, setCurrentTxHash] = useState<string>('');

    const switchNetwork = async (chainId: string) => {
        console.log('Switching to chain:', chainId);
        let provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
            await new Promise(resolve => setTimeout(resolve, 100));
            await provider.send('wallet_switchEthereumChain', [{ chainId: ethers.utils.hexValue(parseInt(chainId, 10)) }]);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            let c = (await provider.getNetwork()).chainId;
            console.log('Switched to chain:', c);

            setIsProviderReady(true);
        } catch (switchError: any) {
            console.log('Failed to switch network:', switchError);
            setIsProviderReady(true);
        }
    };

    useEffect(() => {
        if (token) {
            setIsProviderReady(false);
            switchNetwork(NetworkByName[token.chain].chain_id.toString());
        }
    }, [token]);

    const renderSwap = (token: TokenBalance) => {
        let p = new ethers.providers.Web3Provider(window.ethereum);
        let dest = localStorage.getItem(`selectedDestToken_${token?.chain}`);
        let tokenList = (DestTokensByChain[token.chain] ?? []).map((t) => {
            return {
                address: t.address,
                chainId: NetworkByName[token.chain].chain_id,
                logoURI: t.logo_url ?? '',
                name: t.name,
                symbol: t.symbol,
                decimals: t.decimals,
            };
        });
        
        tokenList.push({
            ...token,
            address: token.id,
            logoURI: token.logo_url ?? '',
            chainId: NetworkByName[token.chain].chain_id,
        });
        // name: string;
        // symbol: string;
        // address: string;
        // decimals: number;
        // logoURI: string;
        // chainId: number;
        // isImport?: boolean;

        const handleTxSubmit = (txHash: string, data: any) => {
            console.log('Transaction submitted:', txHash, data);
            setCurrentTxHash(txHash);
            setIsMonitoringTx(true);
            
            if (onToast) {
                onToast(`Transaction submitted: ${txHash.slice(0, 10)}...`, 'info');
            }
            
            // Start monitoring the transaction
            monitorTransaction(txHash, token.chain);
        };

        const monitorTransaction = async (txHash: string, chainName: string) => {
            const maxAttempts = 60; // 5 minutes with 5-second intervals
            let attempts = 0;
            
            const checkTransaction = async () => {
                try {
                    const network = NetworkByName[chainName];
                    const chainId = network.chain_id;
                    
                    // Get a working RPC endpoint for transaction monitoring
                    const rpcEndpoint = await getWorkingRpcEndpoint(chainId);
                    const provider = new ethers.providers.JsonRpcProvider(rpcEndpoint, {
                        name: `chain-${chainId}`,
                        chainId: chainId
                    });
                    
                    const receipt = await withTimeout(provider.getTransactionReceipt(txHash), 10000);
                    
                    if (receipt && receipt.confirmations > 0) {
                        // Transaction confirmed, reload balance
                        console.log('Transaction confirmed, reloading balance...');
                        setIsMonitoringTx(false);
                        
                        if (onToast) {
                            onToast(`Transaction confirmed! Reloading balance...`, 'success');
                        }
                        
                        // Reload the token balance
                        await reloadTokenBalance();
                        return;
                    }
                    
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkTransaction, 5000); // Check every 5 seconds
                    } else {
                        // Timeout
                        setIsMonitoringTx(false);
                        if (onToast) {
                            onToast(`Transaction monitoring timed out. Please check manually.`, 'error');
                        }
                    }
                } catch (error) {
                    console.error('Error monitoring transaction:', error);
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkTransaction, 5000);
                    } else {
                        setIsMonitoringTx(false);
                        if (onToast) {
                            onToast(`Error monitoring transaction. Please check manually.`, 'error');
                        }
                    }
                }
            };
            
            // Start monitoring
            setTimeout(checkTransaction, 5000);
        };

        const reloadTokenBalance = async () => {
            try {
                // Notify that balance updating is starting
                if (onBalanceUpdating) {
                    onBalanceUpdating(true);
                }
                
                const network = NetworkByName[token.chain];
                const chainId = network.chain_id;
                
                console.log(`Reloading balance for ${token.symbol} on chain ${chainId} (${network.display_name})`);
                
                const { balance, decimals } = await fetchTokenBalanceFromNode(
                    token.id,
                    walletAddress,
                    chainId
                );
                
                if (onBalanceUpdate) {
                    onBalanceUpdate(balance);
                }
                
                if (onToast) {
                    onToast(`Balance updated: ${balance} ${token.symbol}`, 'success');
                }
            } catch (error: any) {
                console.error('Error reloading balance:', error);
                if (onToast) {
                    onToast(`Failed to reload balance: ${error.message}`, 'error');
                }
            } finally {
                // Notify that balance updating is finished
                if (onBalanceUpdating) {
                    onBalanceUpdating(false);
                }
            }
        };

            return (
        <div>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}
            </style>
                <Widget
                    key={token.id}
                    client="krystal"
                    tokenList={tokenList}
                    provider={p}
                    defaultTokenIn={token.id}
                    defaultAmountIn={getFullTokenBalanceFromHex(token.raw_amount_hex_str)}
                    defaultTokenOut={dest ?? DestTokensByChain[token.chain][0].address}
                    onDestinationTokenChange={(dest: any) => {
                        localStorage.setItem(`selectedDestToken_${token?.chain}`, dest.address);
                    }}
                    onTxSubmit={handleTxSubmit}
                />
                {isMonitoringTx && (
                    <div style={{ 
                        marginTop: '10px', 
                        padding: '8px', 
                        backgroundColor: '#e3f2fd', 
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div style={{ 
                            width: '16px', 
                            height: '16px', 
                            border: '2px solid #ccc', 
                            borderTop: '2px solid #007bff', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                        }} />
                        <span>Monitoring transaction: {currentTxHash.slice(0, 10)}...</span>
                        <a 
                            href={`${NetworkByName[token.chain].explorer_url}/tx/${currentTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#007bff', textDecoration: 'none' }}
                        >
                            [View on Explorer]
                        </a>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            <h2>LIQUIDATE</h2>
            <p> Chain: {!!token ? (
                <span style={{fontSize: "20px"}}>
                    <img src={NetworkByName[token.chain].logo} style={{width: "auto", height: "20px"}}/>
                    {NetworkByName[token.chain].display_name}
                </span>
            ) : 'N.A'}</p>
            {isProviderReady && token.id && renderSwap(token)}
        </div>
    );
};

export default SwapBox;