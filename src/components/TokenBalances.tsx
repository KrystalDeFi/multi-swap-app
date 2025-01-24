import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { NetworkByID, NetworkByName } from '../utils/constants';
import { TokenBalance } from '../types';
import { formatTokenBalance, formatUSDValue, getTimeAgo, shortAddress } from '../utils/utils';
import SwapBox from './SwapBox';
import { ethers } from 'ethers';

interface TokenListProps {
    walletAddress: string | null;
}

const TokenBalances: React.FC<TokenListProps> = ({ walletAddress }) => {
    const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('debankApiKey') || '');
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
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(`Failed to fetch token data. Err: ${errorMessage}`);
            setTokens([]);
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
        (!filterSmallValues || (token.price * token.amount) >= threshold)
    );

    const sortedTokens = [...filteredTokens].sort((a, b) => {
        const valueA = sortKey === 'value' ? a.price * a.amount : a.price_24h_change ?? 0;
        const valueB = sortKey === 'value' ? b.price * b.amount : b.price_24h_change ?? 0;
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });

    // const selectedTokenDetails = useMemo(() => {
    //     return sortedTokens.filter(token => selectedTokens.has(getTokenKey(token)));
    // }, [selectedTokens, sortedTokens]);

    return (
        <div style={{ display: 'flex' }}>
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
                                        <img src={token.logo_url ?? undefined} alt={token.name} width="20" height="20" />
                                        {token.name} {!token.is_core && <span style={{ color: 'red' }}>(!?)</span>}
                                    </td>
                                    <td style={{maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis"}}>
                                        {token.symbol} {shortAddress(token.id)}
                                        <a style={{marginLeft: "4px"}} href={`${NetworkByName[token.chain].explorer_url}/token/${token.id}`} target="_blank" rel="noopener noreferrer">
                                            [view]
                                        </a>
                                    </td>
                                    <td>
                                        {formatTokenBalance(token.amount)}
                                        <a style={{marginLeft: "4px"}} href={`${NetworkByName[token.chain].explorer_url}/token/${token.id}?a=${walletAddress}`} target="_blank" rel="noopener noreferrer">
                                            [view]    
                                        </a>
                                    </td>
                                    <td>${token.price.toFixed(2)}</td>
                                    <td style={{ color: (token.price_24h_change ?? 0) >= 0 ? 'green' : 'red' }}>
                                        {token.price_24h_change ? `${(token.price_24h_change * 100).toFixed(2)}%` : '-'}
                                    </td>
                                    <td>{formatUSDValue(token.price * token.amount)}</td>
                                    <td>{token.amount > 0 ? (
                                        <a href="#" onClick={() => {
                                            setSelectedToken(token);
                                        }}>[liquidiate]</a>
                                     ) : ''}</td>
                                </tr>
                            );
                        }) : <tr><td colSpan={8}>{sortedTokens === null ? 'Loading...' : 'No Data'}</td></tr>}
                    </tbody>
                </table>
            </div>
            <div style={{ minWidth: "400px", maxWidth: "100%", marginLeft: '20px' }}>
                {!!selectedToken && !!walletAddress ? <SwapBox walletAddress={walletAddress} token={selectedToken} /> : 'Pls select token to liquidate'}
            </div>
        </div>
    );
};

export default TokenBalances;
