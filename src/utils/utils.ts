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
