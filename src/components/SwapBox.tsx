import { DestTokensByChain, NetworkByName } from '../utils/constants';
import { Token, TokenBalance } from '../types';
import React, { useState, useEffect } from 'react';
import { formatTokenBalance, formatTokenBalanceFromWei, formatUSDValue, getBalanceFromWei, getFullTokenBalanceFromHex, shortAddress } from '../utils/utils';
import { BigNumber } from 'bignumber.js';
import { Widget } from "@kyberswap/widgets";
import { ethers } from 'ethers';


interface SwapBoxProps {
    walletAddress: string;
    token: TokenBalance;
}

const SwapBox: React.FC<SwapBoxProps> = ({ walletAddress, token }) => {
    // const storedDest = localStorage.getItem(`selectedDestToken_${token?.chain}`);
    const [isProviderReady, setIsProviderReady] = useState<boolean>(false);

    const switchNetwork = async (chainId: string) => {
        console.log('Switching to chain:', chainId);
        let provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
            await provider.send('wallet_switchEthereumChain', [{ chainId: ethers.utils.hexValue(parseInt(chainId, 10)) }]);
            await new Promise(resolve => setTimeout(resolve, 500));
            
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
        return (
            <Widget
                key={token.id}
                client="krystal"
                tokenList={[]}
                provider={p}
                defaultTokenIn={token.id}
                defaultAmountIn={getFullTokenBalanceFromHex(token.raw_amount_hex_str)}
                // defaultTokenOut={defaultTokenOut[chainId]}
            />
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