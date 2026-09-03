import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { TokenBalance, SendResult, SendStatus } from '../types';
import { LIQUIDATION_BOT_ADDRESS, NetworkByName } from '../utils/constants';
import { formatTokenBalance, formatUSDValue, shortAddress } from '../utils/utils';

interface LiquidationBotPanelProps {
    walletAddress: string | null;
    selectedTokens: TokenBalance[];
    onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    onClearSelection: () => void;
    onUnselectToken: (tokenKey: string) => void;
    onTokenSent: (token: TokenBalance) => void;
}

const ERC20_TRANSFER_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address,uint256) returns (bool)',
];

// Rebasing, reflection and fee-on-transfer tokens derive balanceOf from a global rate
// that moves whenever anyone else trades the token. Sending the exact figure we read
// then reverts with "transfer amount exceeds balance" once the tx lands a block or two
// later, so shave a hair off the amount to absorb that drift. 0.01% is far more headroom
// than observed drift needs and is worth a fraction of a cent on any realistic balance.
const DEFAULT_SEND_MARGIN_PERCENT = 0;

const applySendMargin = (balance: ethers.BigNumber, marginPercent: number): ethers.BigNumber => {
    if (!(marginPercent > 0)) return balance;
    // 1% == 10,000 ppm; keep the maths in integers so BigNumber stays exact.
    const ppm = Math.round(Math.min(marginPercent, 5) * 10000);
    const margin = balance.mul(ppm).div(1_000_000);
    // On dust balances the margin rounds to zero — send the whole thing.
    return margin.isZero() ? balance : balance.sub(margin);
};

export const getTokenKey = (token: TokenBalance): string => `${token.chain}-${token.id}`;

const STATUS_STYLES: { [key in SendStatus]: { label: string; color: string } } = {
    pending: { label: 'Queued', color: '#888' },
    switching: { label: 'Switching chain…', color: '#b8860b' },
    'awaiting-signature': { label: 'Waiting for signature…', color: '#b8860b' },
    submitted: { label: 'Submitted…', color: '#007bff' },
    confirmed: { label: 'Sent ✓', color: 'green' },
    rejected: { label: 'Rejected', color: '#ff8c00' },
    failed: { label: 'Failed', color: 'red' },
    skipped: { label: 'Skipped', color: '#888' },
};

const isUserRejection = (error: any): boolean => {
    const code = error?.code ?? error?.error?.code;
    if (code === 4001 || code === 'ACTION_REJECTED') return true;
    const message = `${error?.message || ''} ${error?.reason || ''}`.toLowerCase();
    return message.includes('user rejected') || message.includes('user denied') || message.includes('rejected by user');
};

// Asks the chain whether this exact transfer would succeed. Returns true, or the revert
// reason, so a doomed transfer is never put in front of the wallet. Uses a raw eth_call
// rather than callStatic because tokens that return no value from transfer (USDT-style)
// fail ABI decoding even when the transfer itself is fine.
const dryRunTransfer = async (
    provider: ethers.providers.Web3Provider,
    erc20: ethers.Contract,
    from: string,
    tokenAddress: string,
    amount: ethers.BigNumber
): Promise<true | string> => {
    try {
        await provider.call({
            from,
            to: tokenAddress,
            data: erc20.interface.encodeFunctionData('transfer', [LIQUIDATION_BOT_ADDRESS, amount]),
        });
        return true;
    } catch (error: any) {
        return error?.reason || error?.data?.message || error?.message || 'transfer reverted';
    }
};

const LiquidationBotPanel: React.FC<LiquidationBotPanelProps> = ({
    walletAddress,
    selectedTokens,
    onToast,
    onClearSelection,
    onUnselectToken,
    onTokenSent,
}) => {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<{ [tokenKey: string]: SendResult }>({});
    const [currentKey, setCurrentKey] = useState<string | null>(null);
    const [marginPercent, setMarginPercent] = useState<number>(DEFAULT_SEND_MARGIN_PERCENT);
    const stopRef = useRef(false);

    // Group by chain so the wallet only has to switch networks once per chain.
    const orderedTokens = useMemo(() => {
        return [...selectedTokens].sort((a, b) => {
            if (a.chain !== b.chain) return a.chain.localeCompare(b.chain);
            return b.price * b.amount - a.price * a.amount;
        });
    }, [selectedTokens]);

    const totalValue = orderedTokens.reduce((acc, token) => acc + token.price * token.amount, 0);

    // Drop results for tokens that left the queue, so re-adding one later starts clean
    // instead of showing the outcome of a previous run.
    useEffect(() => {
        if (running) return;
        const selectedKeys = new Set(selectedTokens.map(getTokenKey));
        setResults(prev => {
            const next: { [tokenKey: string]: SendResult } = {};
            let changed = false;
            Object.keys(prev).forEach(key => {
                if (selectedKeys.has(key)) {
                    next[key] = prev[key];
                } else {
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [selectedTokens, running]);

    const setResult = (tokenKey: string, result: SendResult) => {
        setResults(prev => ({ ...prev, [tokenKey]: result }));
    };

    const sendOneToken = async (
        token: TokenBalance,
        currentChainId: number | null
    ): Promise<{ chainId: number | null; sent: boolean }> => {
        const tokenKey = getTokenKey(token);
        const network = NetworkByName[token.chain];
        if (!network) {
            setResult(tokenKey, { status: 'failed', message: `Unsupported chain: ${token.chain}` });
            return { chainId: currentChainId, sent: false };
        }

        const chainId = network.chain_id;
        const isNative = !ethers.utils.isAddress(token.id);

        if (chainId !== currentChainId) {
            setResult(tokenKey, { status: 'switching' });
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: ethers.utils.hexValue(chainId) }],
            });
            // Give the injected provider a moment to settle on the new chain.
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Re-create the provider after a network switch so ethers picks up the new chain.
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        // Always read the balance for the account that will sign. getSigner() follows the
        // wallet's active account, which drifts from the address captured at page load as
        // soon as the user switches accounts — reading the wrong one sends an amount the
        // signer does not own and reverts as "transfer amount exceeds balance".
        const from = await signer.getAddress();

        setResult(tokenKey, { status: 'awaiting-signature' });

        let tx: ethers.providers.TransactionResponse;

        if (isNative) {
            const balance = await provider.getBalance(from);
            const gasPrice = await provider.getGasPrice();
            // The bot may be a contract with a payable receive(), which costs more than a
            // plain 21k EOA transfer. Probe with 1 wei to find the real cost.
            let gasLimit = ethers.BigNumber.from(21000);
            try {
                const estimated = await provider.estimateGas({
                    from,
                    to: LIQUIDATION_BOT_ADDRESS,
                    value: 1,
                });
                if (estimated.gt(gasLimit)) {
                    gasLimit = estimated.mul(120).div(100);
                }
            } catch {
                // Estimation is best-effort; fall back to the plain-transfer default.
            }
            // 2x buffer: L2s charge an L1 data fee on top of the execution cost.
            const gasCost = gasPrice.mul(gasLimit).mul(2);
            const value = balance.sub(gasCost);
            if (value.lte(0)) {
                setResult(tokenKey, { status: 'skipped', message: 'Balance too low to cover gas' });
                return { chainId, sent: false };
            }
            tx = await signer.sendTransaction({
                to: LIQUIDATION_BOT_ADDRESS,
                value,
                gasLimit,
                gasPrice,
            });
        } else {
            const erc20 = new ethers.Contract(token.id, ERC20_TRANSFER_ABI, signer);
            const balance = await erc20.balanceOf(from);
            if (balance.lte(0)) {
                setResult(tokenKey, { status: 'skipped', message: 'No on-chain balance' });
                return { chainId, sent: false };
            }

            // Check the transfer against the chain before prompting the wallet, so a
            // transfer that cannot land is skipped instead of shown as a failed simulation.
            const amount = applySendMargin(balance, marginPercent);
            if (amount.lte(0)) {
                setResult(tokenKey, { status: 'skipped', message: 'No on-chain balance' });
                return { chainId, sent: false };
            }

            const dryRun = await dryRunTransfer(provider, erc20, from, token.id, amount);
            if (dryRun !== true) {
                setResult(tokenKey, { status: 'skipped', message: `Would revert: ${dryRun}` });
                return { chainId, sent: false };
            }

            // Exact integers, for comparing against the wallet's "View Raw" calldata when a
            // simulation disagrees with what we read.
            console.log(
                `[liquidation] ${token.symbol} on ${token.chain} @ ${token.id}: ` +
                `balanceOf=${balance.toString()} sending=${amount.toString()} ` +
                `(short by ${balance.sub(amount).toString()})`
            );

            tx = await erc20.transfer(LIQUIDATION_BOT_ADDRESS, amount);
        }

        setResult(tokenKey, { status: 'submitted', txHash: tx.hash });
        await tx.wait();
        setResult(tokenKey, { status: 'confirmed', txHash: tx.hash });
        onTokenSent(token);
        return { chainId, sent: true };
    };

    const handleStart = async () => {
        if (!walletAddress) {
            onToast('Connect a wallet first', 'error');
            return;
        }
        if (!window.ethereum) {
            onToast('No wallet detected', 'error');
            return;
        }
        if (orderedTokens.length === 0) {
            onToast('No tokens selected', 'error');
            return;
        }

        stopRef.current = false;
        setRunning(true);
        setResults(Object.fromEntries(orderedTokens.map(t => [getTokenKey(t), { status: 'pending' as SendStatus }])));

        let currentChainId: number | null = null;
        try {
            currentChainId = (await new ethers.providers.Web3Provider(window.ethereum).getNetwork()).chainId;
        } catch {
            currentChainId = null;
        }

        let sent = 0;
        let stoppedAt = -1;

        for (let i = 0; i < orderedTokens.length; i++) {
            if (stopRef.current) {
                stoppedAt = i;
                break;
            }

            const token = orderedTokens[i];
            const tokenKey = getTokenKey(token);
            setCurrentKey(tokenKey);

            try {
                const outcome = await sendOneToken(token, currentChainId);
                currentChainId = outcome.chainId;
                if (outcome.sent) sent++;
            } catch (error: any) {
                if (isUserRejection(error)) {
                    setResult(tokenKey, { status: 'rejected', message: 'Rejected in wallet' });
                    onToast(`Skipped ${token.symbol} — rejected in wallet`, 'info');
                } else {
                    const message = error?.reason || error?.data?.message || error?.message || 'Unknown error';
                    setResult(tokenKey, { status: 'failed', message });
                    onToast(`Failed to send ${token.symbol}: ${message}`, 'error');
                }
                // A failed switch leaves the wallet chain unknown; re-detect on the next token.
                if (!stopRef.current) {
                    try {
                        currentChainId = (await new ethers.providers.Web3Provider(window.ethereum).getNetwork()).chainId;
                    } catch {
                        currentChainId = null;
                    }
                }
            }
        }

        if (stoppedAt >= 0) {
            setResults(prev => {
                const next = { ...prev };
                orderedTokens.slice(stoppedAt).forEach(t => {
                    const key = getTokenKey(t);
                    if (!next[key] || next[key].status === 'pending') {
                        next[key] = { status: 'skipped', message: 'Stopped by user' };
                    }
                });
                return next;
            });
            onToast(`Stopped. ${sent} of ${orderedTokens.length} tokens sent.`, 'info');
        } else {
            onToast(`Done. ${sent} of ${orderedTokens.length} tokens sent to the liquidation bot.`, sent > 0 ? 'success' : 'info');
        }

        setCurrentKey(null);
        setRunning(false);
        stopRef.current = false;
    };

    const handleStop = () => {
        stopRef.current = true;
        onToast('Stopping after the current token…', 'info');
    };

    const doneCount = orderedTokens.filter(t => results[getTokenKey(t)]?.status === 'confirmed').length;

    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 6px 0' }}>Send to Liquidation Bot</h3>
            <div style={{ fontSize: '11px', color: '#777', marginBottom: '10px', wordBreak: 'break-all' }}>
                Bot: <code>{LIQUIDATION_BOT_ADDRESS}</code>
            </div>

            <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <strong>{orderedTokens.length}</strong> token{orderedTokens.length === 1 ? '' : 's'} ·{' '}
                <strong>{formatUSDValue(totalValue)}</strong>
                {running && (
                    <span style={{ marginLeft: '8px', color: '#007bff' }}>
                        {doneCount}/{orderedTokens.length} sent
                    </span>
                )}
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button onClick={handleStart} disabled={running || orderedTokens.length === 0} style={{ flex: 1 }}>
                    {running ? 'Sending…' : 'Send 100% of all'}
                </button>
                <button onClick={handleStop} disabled={!running} style={{ color: running ? 'red' : undefined }}>
                    Stop
                </button>
                <button onClick={onClearSelection} disabled={running || orderedTokens.length === 0}>
                    Clear
                </button>
            </div>

            <div style={{ maxHeight: '45vh', overflowY: 'auto', borderTop: '1px solid #eee' }}>
                {orderedTokens.map(token => {
                    const tokenKey = getTokenKey(token);
                    const result = results[tokenKey];
                    const style = STATUS_STYLES[result?.status ?? 'pending'];
                    const network = NetworkByName[token.chain];
                    const isCurrent = currentKey === tokenKey;

                    return (
                        <div
                            key={tokenKey}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                                padding: '8px 4px',
                                borderBottom: '1px solid #eee',
                                backgroundColor: isCurrent ? '#fff8dc' : undefined,
                                fontSize: '13px'
                            }}
                        >
                            {network && (
                                <img
                                    src={network.logo}
                                    alt={token.chain}
                                    width="18"
                                    height="18"
                                    title={network.display_name}
                                    style={{ marginTop: '2px', flexShrink: 0 }}
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                    <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {token.symbol}
                                    </strong>
                                    <span style={{ flexShrink: 0 }}>{formatUSDValue(token.price * token.amount)}</span>
                                </div>
                                <div style={{ color: '#999', fontSize: '11px' }}>
                                    {formatTokenBalance(token.amount)} · {shortAddress(token.id)}
                                </div>
                                <div style={{ color: style.color, fontSize: '12px' }}>
                                    {result ? style.label : 'Not started'}
                                    {result?.txHash && network && (
                                        <a
                                            style={{ marginLeft: '4px' }}
                                            href={`${network.explorer_url}/tx/${result.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            [tx]
                                        </a>
                                    )}
                                    {result?.message && (
                                        <div style={{ fontSize: '11px', color: '#888' }}>{result.message}</div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => onUnselectToken(tokenKey)}
                                disabled={running}
                                title="Remove from queue"
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: running ? 'not-allowed' : 'pointer',
                                    color: '#999',
                                    flexShrink: 0
                                }}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>

            <div style={{ fontSize: '11px', color: '#777', marginTop: '8px' }}>
                <label>
                    Safety margin:{' '}
                    <input
                        type="number"
                        value={marginPercent}
                        min={0}
                        max={5}
                        step={0.01}
                        disabled={running}
                        onChange={(e) => setMarginPercent(Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
                        style={{ width: '60px' }}
                    />{' '}
                    %
                </label>
                <div style={{ marginTop: '4px' }}>
                    Sends {(100 - marginPercent).toFixed(2)}% of each ERC20 balance. Leave at 0 for the full
                    balance; raise it only for rebasing or fee-on-transfer tokens whose balance moves between
                    the read and the transfer. Every transfer is checked against the chain first, and skipped
                    rather than signed if it would revert.
                </div>
                <div style={{ marginTop: '4px' }}>
                    One wallet prompt per token. Rejecting a prompt skips that token and moves on.
                </div>
            </div>
        </div>
    );
};

export default LiquidationBotPanel;
