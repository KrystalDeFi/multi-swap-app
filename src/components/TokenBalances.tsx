import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { NetworkByID, NetworkByName } from '../utils/constants';
import { TokenBalance } from '../types';
import { formatTokenBalance, formatUSDValue, getTimeAgo, shortAddress, fetchTokenBalanceFromNode } from '../utils/utils';
import SwapBox from './SwapBox';
import { ethers } from 'ethers';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface TokenListProps {
    walletAddress: string | null;
}

interface ToastComponentProps {
    toast: Toast;
    index: number;
    onRemove: (id: string) => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({ toast, index, onRemove }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3000); // 3 seconds in milliseconds
    const [isVisible, setIsVisible] = useState(true);
    
    useEffect(() => {
        if (!isVisible) return;
        
        if (isHovered) return; // Pause timer when hovered
        
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 100) { // Close when less than 100ms left
                    setIsVisible(false);
                    onRemove(toast.id);
                    return 0;
                }
                return prev - 100; // Update every 100ms for smooth progress
            });
        }, 100);
        
        return () => clearInterval(interval);
    }, [isHovered, toast.id, onRemove, isVisible]);
    
    // Reset timer when hover state changes
    useEffect(() => {
        if (!isHovered && isVisible) {
            setTimeLeft(3000);
        }
    }, [isHovered, isVisible]);
    
    // Fallback: force close after 5 seconds regardless of hover state
    useEffect(() => {
        const fallbackTimer = setTimeout(() => {
            if (isVisible) {
                setIsVisible(false);
                onRemove(toast.id);
            }
        }, 5000);
        
        return () => clearTimeout(fallbackTimer);
    }, [toast.id, onRemove, isVisible]);
    
    const progressPercentage = (timeLeft / 3000) * 100;
    
    const handleClose = () => {
        setIsVisible(false);
        onRemove(toast.id);
    };
    
    if (!isVisible) return null;
    
    return (
        <div 
            style={{
                position: 'fixed',
                top: `${20 + (index * 70)}px`,
                right: '20px',
                backgroundColor: toast.type === 'success' ? '#4caf50' : toast.type === 'error' ? '#f44336' : '#2196f3',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '6px',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                animation: 'slideIn 0.3s ease-out',
                overflow: 'hidden',
                cursor: 'pointer'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClose} // Allow clicking anywhere on toast to close
        >
            {/* Progress bar */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                backgroundColor: 'rgba(255,255,255,0.3)',
                width: '100%'
            }}>
                <div style={{
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    width: `${progressPercentage}%`,
                    transition: 'width 0.1s linear'
                }} />
            </div>
            
            <span>{toast.message}</span>
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the div's onClick
                    handleClose();
                }}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    marginLeft: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                ×
            </button>
        </div>
    );
};

const TokenBalances: React.FC<TokenListProps> = ({ walletAddress }) => {
    // Have a default key for testing
    const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('debankApiKey') || 'd216e5d73a29372b33b78d3ce2d3077c4e708ba7');
    const [tokens, setTokens] = useState<TokenBalance[]>([]);
    // const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [filterChain, setFilterChain] = useState<string>('');
    const [showUnverified, setShowUnverified] = useState<boolean>(false);
    const [filterSmallValues, setFilterSmallValues] = useState<boolean>(true);
    const [threshold, setThreshold] = useState<number>(10);
    const [sortKey, setSortKey] = useState<string>('price_24h_change');
    const [sortOrder, setSortOrder] = useState<string>('desc');
    const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null);
    const [loadingBalances, setLoadingBalances] = useState<Set<string>>(new Set());
    const [updatingTokens, setUpdatingTokens] = useState<Set<string>>(new Set());
    const [toasts, setToasts] = useState<Toast[]>([]);

    const [searchTerm, setSearchTerm] = useState<string>('');

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now().toString();
        const newToast: Toast = { id, message, type };
        setToasts(prev => [...prev, newToast]);
        
        // Auto remove toast after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const clearAllToasts = () => {
        setToasts([]);
    };

    // Cleanup toasts when component unmounts
    useEffect(() => {
        return () => {
            setToasts([]);
        };
    }, []);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const key = event.target.value;
        setApiKey(key);
        localStorage.setItem('debankApiKey', key);
    };

    const fetchBalances = async () => {
        if (!walletAddress || !apiKey) return;

        try {
            const response = await axios.get(`https://pro-openapi.debank.com/v1/user/all_token_list?id=${walletAddress}`, {
                headers: {
                    'AccessKey': `${apiKey}`
                }
            });
            setTokens(response.data);
            setError(null);
            setLastUpdated(new Date());
            localStorage.setItem(walletAddress.toLowerCase(), JSON.stringify({ tokens: response.data, lastUpdated: new Date() }));
            addToast(`Successfully fetched ${response.data.length} tokens!`, 'success');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(`Failed to fetch token data. Err: ${errorMessage}`);
            setTokens([]);
            addToast(`Failed to fetch token data: ${errorMessage}`, 'error');
        }
    };

    useEffect(() => {
        if (!walletAddress) return;

        const storedData = localStorage.getItem(walletAddress.toLowerCase());
        if (storedData !== null) {
            const { tokens, lastUpdated } = JSON.parse(storedData);
            setTokens(tokens);
            setLastUpdated(new Date(lastUpdated));
        } else {
            fetchBalances();
        }
    }, [walletAddress]);

    const handleRefresh = () => {
        fetchBalances();
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };

    // const handleSelectToken = (tokenKey: string) => {
    //     setSelectedTokens(prevSelectedTokens => {
    //         const newSelectedTokens = new Set(prevSelectedTokens);
    //         if (newSelectedTokens.has(tokenKey)) {
    //             newSelectedTokens.delete(tokenKey);
    //         } else {
    //             newSelectedTokens.add(tokenKey);
    //         }
    //         return newSelectedTokens;
    //     });
    // };

    // const handleSelectSubset = (count: number) => {
    //     const newSelectedTokens = new Set<string>();
    //     sortedTokens.slice(0, count).forEach(token => newSelectedTokens.add(token.id));
    //     setSelectedTokens(newSelectedTokens);
    // };

    const filteredTokens = tokens.filter(token => 
        (!filterChain || token.chain === filterChain) && 
        (showUnverified || token.is_core) &&
        (!filterSmallValues || (token.price * token.amount) >= threshold) &&
        token.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedTokens = [...filteredTokens].sort((a, b) => {
        const valueA = sortKey === 'value' ? a.price * a.amount : a.price_24h_change ?? 0;
        const valueB = sortKey === 'value' ? b.price * b.amount : b.price_24h_change ?? 0;
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    // const selectedTokenDetails = useMemo(() => {
    //     return sortedTokens.filter(token => selectedTokens.has(getTokenKey(token)));
    // }, [selectedTokens, sortedTokens]);

    const handleRefreshSingleToken = async (token: TokenBalance, retryCount: number = 0) => {
        if (!walletAddress) return;
        
        const tokenKey = `${token.chain}-${token.id}`;
        setLoadingBalances(prev => new Set(prev).add(tokenKey));
        
        try {
            const chainId = NetworkByName[token.chain].chain_id;
            const { balance, decimals } = await fetchTokenBalanceFromNode(
                token.id, 
                walletAddress, 
                chainId
            );
            
            // Update the token balance in the list
            setTokens(prevTokens => 
                prevTokens.map(t => 
                    t.id === token.id && t.chain === token.chain
                        ? {
                            ...t,
                            amount: parseFloat(balance),
                            raw_amount: parseFloat(balance),
                            raw_amount_hex_str: ethers.utils.parseUnits(balance, decimals).toHexString()
                        }
                        : t
                )
            );
            
            // Update localStorage
            const storedData = localStorage.getItem(walletAddress.toLowerCase());
            if (storedData) {
                const { tokens: storedTokens, lastUpdated } = JSON.parse(storedData);
                const updatedTokens = storedTokens.map((t: TokenBalance) => 
                    t.id === token.id && t.chain === token.chain
                        ? {
                            ...t,
                            amount: parseFloat(balance),
                            raw_amount: parseFloat(balance),
                            raw_amount_hex_str: ethers.utils.parseUnits(balance, decimals).toHexString()
                        }
                        : t
                );
                localStorage.setItem(walletAddress.toLowerCase(), JSON.stringify({ 
                    tokens: updatedTokens, 
                    lastUpdated: new Date() 
                }));
            }
            
            addToast(`Balance for ${token.symbol} updated successfully!`, 'success');

        } catch (error: any) {
            console.error('Error refreshing token balance:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            
            // Retry once if it's a network error and we haven't retried yet
            if (retryCount === 0 && (errorMessage.includes('could not detect network') || errorMessage.includes('NETWORK_ERROR'))) {
                console.log('Retrying balance fetch due to network error...');
                setLoadingBalances(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(tokenKey);
                    return newSet;
                });
                // Wait a bit before retrying
                setTimeout(() => handleRefreshSingleToken(token, 1), 1000);
                return;
            }
            
            setError(`Failed to refresh balance for ${token.symbol}: ${errorMessage}`);
            addToast(`Failed to refresh balance for ${token.symbol}: ${errorMessage}`, 'error');
        } finally {
            setLoadingBalances(prev => {
                const newSet = new Set(prev);
                newSet.delete(tokenKey);
                return newSet;
            });
        }
    };

    return (
        <div style={{ display: 'flex' }}>
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
            <div style={{}}>
                <h2>Token Balances</h2>
                <div>
                    <label>
                        Debank API Key:
                        <input type="text" value={apiKey} onChange={handleApiKeyChange} />
                    </label>
                </div>
                <div style={{ marginTop: '10px' }}>
                    {lastUpdated && <span>Last updated: {getTimeAgo(lastUpdated)}</span>}
                    <button style={{marginLeft: "10px"}} onClick={handleRefresh}>Force Refresh</button>
                </div>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div>
                    <h3>Total Value: <span style={{fontSize: "24px"}}>{formatUSDValue(sortedTokens.reduce((acc, token) => acc + (token.price * token.amount), 0))}</span></h3>
                    <p>Total Tokens: {sortedTokens.length}</p>

                    <label>
                        Filter by Chain:
                        <select value={filterChain} onChange={(e) => setFilterChain(e.target.value)}>
                            <option value="">All</option>
                            {Object.keys(NetworkByID).map(chainId => (
                                <option key={chainId} value={NetworkByID[+chainId].chain_name}>
                                    {NetworkByID[+chainId].display_name}
                                </option>
                            ))}
                        </select>
                    </label>
                    
                    <label style={{marginLeft: "20px"}}>
                        <input
                            type="checkbox"
                            checked={showUnverified}
                            onChange={(e) => setShowUnverified(e.target.checked)}
                        />
                        Show All Tokens
                    </label>

                    <label style={{marginLeft: "20px"}}>
                        <input
                            type="checkbox"
                            checked={filterSmallValues}
                            onChange={(e) => setFilterSmallValues(e.target.checked)}
                        />
                        Filter Small Values
                    </label>
                    <label>
                        Threshold:
                        <input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                        />
                    </label>

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search by token name"
                        style={{marginLeft: "20px"}}
                    />
                </div>

                {/* {filterChain && (
                    <div style={{marginTop: "10px"}}>
                        <button onClick={() => handleSelectSubset(10)}>Select First 10</button>
                        <button onClick={() => handleSelectSubset(20)}>Select First 20</button>
                        <button onClick={() => handleSelectSubset(50)}>Select First 50</button>
                    </div>
                )} */}

                <table style={{marginTop: "30px"}}>
                    <thead>
                        <tr style={{ fontSize: '1.2em' }}>
                            {filterChain && <th>Select</th>}
                            <th>Chain</th>
                            <th>Token</th>
                            <th>Symbol</th>
                            <th>Balance</th>
                            <th>Price</th>
                            <th onClick={() => handleSort('price_24h_change')}>
                                24h Change {sortKey === 'price_24h_change' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('value')}>
                                Value {sortKey === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTokens.length ? sortedTokens.map((token, index) => {
                            if (!NetworkByName[token.chain]) return (
                                <tr key={`${token.chain}-${token.id}`}>
                                    <td colSpan={8}>Unsupported chain: {token.chain}</td>
                                </tr>
                            );

                            return (
                                <tr key={`${token.chain}-${token.id}`} style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff' }}>
                                    {/* {filterChain && <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedTokens.has(getTokenKey(token))}
                                            onChange={() => handleSelectToken(getTokenKey(token))}
                                        />
                                    </td>} */}
                                    <td>
                                        <img src={NetworkByName[token.chain].logo} alt={token.chain} width="20" height="20" />
                                        {NetworkByName[token.chain].display_name}
                                    </td>
                                    <td style={{maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis"}}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <img src={token.logo_url ?? undefined} alt={token.name} width="20" height="20" />
                                            <span>{token.name} {!token.is_core && <span style={{ color: 'red' }}>(!?)</span>}</span>
                                            {updatingTokens.has(`${token.chain}-${token.id}`) && (
                                                <div style={{ 
                                                    width: '16px', 
                                                    height: '16px', 
                                                    border: '2px solid #ccc', 
                                                    borderTop: '2px solid #007bff', 
                                                    borderRadius: '50%', 
                                                    animation: 'spin 1s linear infinite' 
                                                }} />
                                            )}
                                        </div>
                                    </td>
                                    <td style={{maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis"}}>
                                        {token.symbol} {shortAddress(token.id)}
                                        <a style={{marginLeft: "4px"}} href={`${NetworkByName[token.chain].explorer_url}/token/${token.id}`} target="_blank" rel="noopener noreferrer">
                                            [view]
                                        </a>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{formatTokenBalance(token.amount)}</span>
                                            {updatingTokens.has(`${token.chain}-${token.id}`) && (
                                                <div style={{ 
                                                    width: '14px', 
                                                    height: '14px', 
                                                    border: '2px solid #ccc', 
                                                    borderTop: '2px solid #007bff', 
                                                    borderRadius: '50%', 
                                                    animation: 'spin 1s linear infinite' 
                                                }} />
                                            )}
                                            <a style={{marginLeft: "4px"}} href={`${NetworkByName[token.chain].explorer_url}/token/${token.id}?a=${walletAddress}`} target="_blank" rel="noopener noreferrer">
                                                [view]    
                                            </a>
                                        </div>
                                    </td>
                                    <td>${token.price.toFixed(2)}</td>
                                    <td style={{ color: (token.price_24h_change ?? 0) >= 0 ? 'green' : 'red' }}>
                                        {token.price_24h_change ? `${(token.price_24h_change * 100).toFixed(2)}%` : '-'}
                                    </td>
                                    <td>{formatUSDValue(token.price * token.amount)}</td>
                                    <td>{token.amount > 0 ? (
                                        <a href="#" onClick={() => {
                                            setSelectedToken(token);
                                        }}>[liquidate]</a>
                                     ) : ''}</td>

                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <a 
                                                href={`https://defi.krystal.app/swap?chainId=${NetworkByName[token.chain].chain_id}&srcAddress=${token.id}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                title="Swap via Krystal"
                                            >
                                                <img src="https://icoholder.com/files/img/a65404b5005a820f6227500feadf6a76.jpeg" alt="Krystal" width="20" height="20" />
                                            </a>
                                            <button
                                                onClick={() => handleRefreshSingleToken(token)}
                                                disabled={loadingBalances.has(`${token.chain}-${token.id}`)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '2px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title="Refresh balance from blockchain"
                                            >
                                                {loadingBalances.has(`${token.chain}-${token.id}`) ? (
                                                    <div style={{ width: '16px', height: '16px', border: '2px solid #ccc', borderTop: '2px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                                ) : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : <tr><td colSpan={8}>{sortedTokens === null ? 'Loading...' : 'No Data'}</td></tr>}
                    </tbody>
                </table>
            </div>
            <div style={{ minWidth: "400px", maxWidth: "100%", marginLeft: '20px' }}>
                {!!selectedToken && !!walletAddress ? (
                    <SwapBox 
                        walletAddress={walletAddress} 
                        token={selectedToken} 
                        onToast={addToast}
                        onBalanceUpdating={(isUpdating) => {
                            const tokenKey = `${selectedToken.chain}-${selectedToken.id}`;
                            if (isUpdating) {
                                setUpdatingTokens(prev => new Set(prev).add(tokenKey));
                            } else {
                                setUpdatingTokens(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(tokenKey);
                                    return newSet;
                                });
                            }
                        }}
                        onBalanceUpdate={(newBalance) => {
                            // Update the selected token balance
                            setSelectedToken(prev => prev ? {
                                ...prev,
                                amount: parseFloat(newBalance),
                                raw_amount: parseFloat(newBalance),
                                raw_amount_hex_str: ethers.utils.parseUnits(newBalance, prev.decimals).toHexString()
                            } : null);
                            
                            // Also update the token in the main list
                            setTokens(prevTokens => 
                                prevTokens.map(t => 
                                    t.id === selectedToken.id && t.chain === selectedToken.chain
                                        ? {
                                            ...t,
                                            amount: parseFloat(newBalance),
                                            raw_amount: parseFloat(newBalance),
                                            raw_amount_hex_str: ethers.utils.parseUnits(newBalance, t.decimals).toHexString()
                                        }
                                        : t
                                )
                            );
                            
                            // Update localStorage
                            if (walletAddress) {
                                const storedData = localStorage.getItem(walletAddress.toLowerCase());
                                if (storedData) {
                                    const { tokens: storedTokens, lastUpdated } = JSON.parse(storedData);
                                    const updatedTokens = storedTokens.map((t: TokenBalance) => 
                                        t.id === selectedToken.id && t.chain === selectedToken.chain
                                            ? {
                                                ...t,
                                                amount: parseFloat(newBalance),
                                                raw_amount: parseFloat(newBalance),
                                                raw_amount_hex_str: ethers.utils.parseUnits(newBalance, t.decimals).toHexString()
                                            }
                                            : t
                                    );
                                    localStorage.setItem(walletAddress.toLowerCase(), JSON.stringify({ 
                                        tokens: updatedTokens, 
                                        lastUpdated: new Date() 
                                    }));
                                }
                            }
                            addToast(`Balance for ${selectedToken.symbol} updated successfully!`, 'success');
                        }}
                    />
                ) : 'Pls select token to liquidate'}
            </div>
            {toasts.map((toast, index) => (
                <ToastComponent key={toast.id} toast={toast} index={index} onRemove={removeToast} />
            ))}
        </div>
    );
};

export default TokenBalances;
