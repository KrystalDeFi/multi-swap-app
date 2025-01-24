import React, { useEffect, useState } from 'react';

// Extend the Window interface to include the ethereum property
declare global {
    interface Window {
        ethereum: any;
    }
}
import { ethers } from 'ethers';
import TokenBalances from './components/TokenBalances';

const App: React.FC = () => {
    const [walletConnected, setWalletConnected] = useState(false);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(web3Provider);

                // Check if wallet is already connected
                web3Provider.listAccounts().then(accounts => {
                    if (accounts.length > 0) {
                        setWalletAddress(accounts[0]);
                        setWalletConnected(true);
                    }
                });
            } catch (error) {
                console.error('Failed to connect wallet:', error);
            }
        } else {
            console.error('No Ethereum provider found. Install a wallet like Rabby.');
        }
    };

    const disconnectWallet = () => {
        setWalletConnected(false);
        setProvider(null);
        setWalletAddress(null);
    };

    useEffect(() => {
        const initializeProvider = () => {
            if (window.ethereum) {
                const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
                setProvider(web3Provider);

                // Check if wallet is already connected
                web3Provider.listAccounts().then(accounts => {
                    if (accounts.length > 0) {
                        setWalletAddress(accounts[0]);
                        setWalletConnected(true);
                    }
                });
            } else {
                console.error('No Ethereum provider found. Install a wallet like Rabby.');
            }
        };

        initializeProvider();
    }, []);

    return (
        <div>
            <h1>Liquidation Tool</h1>
            <p>Have an overview of the portfolio and liquidate anything of your choice</p>
            {!walletConnected ? (
                <button onClick={connectWallet}>Connect Wallet</button>
            ) : (
                <div>
                    <p>Connected Wallet: {walletAddress}</p>
                    <button onClick={() => window.open(`https://debank.com/profile/${walletAddress}`, '_blank')}>Open Debank Profile</button>
                    <button onClick={disconnectWallet}>Disconnect Wallet</button>
                    <TokenBalances walletAddress={walletAddress} />
                </div>
            )}
        </div>
    );
};

export default App;