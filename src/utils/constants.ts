import { Token } from "../types";

export const defaultRpcEndpointsByNetwork: { [chain_id: number]: string[] } = {
    1: [
        'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
        'https://rpc.ankr.com/eth',
        'https://cloudflare-eth.com',
        'https://main-rpc.linkpool.io',
        'https://rpc.flashbots.net',
    ],
    137: [
        'https://polygon-rpc.com',
        'https://rpc-mainnet.maticvigil.com',
        'https://rpc-mainnet.matic.network',
    ],
    56: [
        'https://bsc-dataseed.binance.org',
        'https://bsc-dataseed1.defibit.io',
        'https://bsc-dataseed1.ninicoin.io',
    ],
    42161: [
        'https://arb1.arbitrum.io/rpc',
    ],
    10: [
        'https://mainnet.optimism.io',
    ],
    43114: [
        'https://api.avax.network/ext/bc/C/rpc',
    ],
    250: [
        'https://rpcapi.fantom.network',
    ],
    100: [
        'https://rpc.gnosischain.com',
    ],
    42170: [
        'https://nova.arbitrum.io/rpc',
    ],
    1285: [
        'https://rpc.api.moonriver.moonbeam.network',
    ],
    1284: [
        'https://rpc.api.moonbeam.network',
    ],
    42220: [
        'https://forno.celo.org',
    ],
};

export const NetworkList = [
    {
        chain_id: 1,
        chain_name: 'eth',
        display_name: 'Ethereum',
        logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        explorer_url: 'https://etherscan.io'
    },
    {
        chain_id: 56,
        chain_name: 'bsc',
        display_name: 'Binance Smart Chain',
        logo: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png',
        explorer_url: 'https://bscscan.com'
    },
    {
        chain_id: 137,
        chain_name: 'matic',
        display_name: 'Polygon',
        logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        explorer_url: 'https://polygonscan.com'
    },
    {
        chain_id: 43114,
        chain_name: 'avax',
        display_name: 'Avalanche',
        logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
        explorer_url: 'https://snowtrace.io'
    },
    {
        chain_id: 250,
        chain_name: 'ftm',
        display_name: 'Fantom',
        logo: 'https://cryptologos.cc/logos/fantom-ftm-logo.png',
        explorer_url: 'https://ftmscan.com'
    },
    {
        chain_id: 42161,
        chain_name: 'arb',
        display_name: 'Arbitrum',
        logo: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
        explorer_url: 'https://arbiscan.io'
    },
    {
        chain_id: 10,
        chain_name: 'op',
        display_name: 'Optimism',
        logo: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
        explorer_url: 'https://optimistic.etherscan.io'
    },
    {
        chain_id: 100,
        chain_name: 'xdai',
        display_name: 'xDai',
        logo: 'https://cryptologos.cc/logos/xdai-stake-logo.png',
        explorer_url: 'https://blockscout.com/xdai/mainnet'
    },
    {
        chain_id: 42220,
        chain_name: 'celo',
        display_name: 'Celo',
        logo: 'https://cryptologos.cc/logos/celo-celo-logo.png',
        explorer_url: 'https://explorer.celo.org'
    },
    {
        chain_id: 128,
        chain_name: 'heco',
        display_name: 'Heco',
        logo: 'https://cryptologos.cc/logos/heco-heco-logo.png',
        explorer_url: 'https://hecoinfo.com'
    },
    {
        chain_id: 66,
        chain_name: 'okexchain',
        display_name: 'OKExChain',
        logo: 'https://cryptologos.cc/logos/okexchain-okt-logo.png',
        explorer_url: 'https://www.oklink.com/okexchain'
    },
    {
        chain_id: 25,
        chain_name: 'cro',
        display_name: 'Cronos',
        logo: 'https://cryptologos.cc/logos/cronos-cro-logo.png',
        explorer_url: 'https://cronoscan.com'
    },
    {
        chain_id: 1285,
        chain_name: 'moonriver',
        display_name: 'Moonriver',
        logo: 'https://cryptologos.cc/logos/moonriver-movr-logo.png',
        explorer_url: 'https://moonriver.moonscan.io'
    },
    {
        chain_id: 1284,
        chain_name: 'moonbeam',
        display_name: 'Moonbeam',
        logo: 'https://cryptologos.cc/logos/moonbeam-glmr-logo.png',
        explorer_url: 'https://moonbeam.moonscan.io'
    },
    {
        chain_id: 1313161554,
        chain_name: 'aurora',
        display_name: 'Aurora',
        logo: 'https://cryptologos.cc/logos/aurora-aurora-logo.png',
        explorer_url: 'https://aurorascan.dev'
    },
    {
        chain_id: 42262,
        chain_name: 'oasis',
        display_name: 'Oasis',
        logo: 'https://cryptologos.cc/logos/oasis-network-rose-logo.png',
        explorer_url: 'https://explorer.oasisprotocol.org'
    },
    {
        chain_id: 40,
        chain_name: 'telos',
        display_name: 'Telos',
        logo: 'https://cryptologos.cc/logos/telos-tlos-logo.png',
        explorer_url: 'https://teloscan.io'
    },
    {
        chain_id: 288,
        chain_name: 'boba',
        display_name: 'Boba',
        logo: 'https://cryptologos.cc/logos/boba-network-boba-logo.png',
        explorer_url: 'https://blockexplorer.boba.network'
    },
    {
        chain_id: 1287,
        chain_name: 'moonbase',
        display_name: 'Moonbase',
        logo: 'https://cryptologos.cc/logos/moonbase-alpha-logo.png',
        explorer_url: 'https://moonbase.moonscan.io'
    },
    {
        chain_id: 1666600000,
        chain_name: 'harmony',
        display_name: 'Harmony',
        logo: 'https://cryptologos.cc/logos/harmony-one-logo.png',
        explorer_url: 'https://explorer.harmony.one'
    },
    {
        chain_id: 8453,
        chain_name: 'base',
        display_name: 'Base',
        logo: 'https://basescan.org/assets/base/images/svg/logos/chain-light.svg?v=25.1.3.0',
        explorer_url: 'https://basescan.org'
    },
    {
        chain_id: 11297108109,
        chain_name: 'blast',
        display_name: 'Blast',
        logo: 'https://cryptologos.cc/logos/blast-blast-logo.png',
        explorer_url: 'https://explorer.blast.com'
    },
    {
        chain_id: 8217,
        chain_name: 'klay',
        display_name: 'Klaytn',
        logo: 'https://cryptologos.cc/logos/klaytn-klay-logo.png',
        explorer_url: 'https://scope.klaytn.com'
    }
];

export const NetworkByID = NetworkList.reduce((acc, network) => {
    acc[network.chain_id] = network;
    return acc;
}, {} as { [key: number]: typeof NetworkList[0] });

export const NetworkByName = NetworkList.reduce((acc, network) => {
    acc[network.chain_name] = network;
    return acc;
}, {} as { [key: string]: typeof NetworkList[0] });

export const tokenListSources = [
    { name: 'Uniswap', url: 'https://tokens.uniswap.org' },
    { name: '1inch', url: 'https://tokens.1inch.io' },
    { name: 'Sushiswap', url: 'https://token-list.sushi.com' },
    { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/coins/list' },
    { name: 'Ethereum Token Lists', url: 'https://raw.githubusercontent.com/ethereum-lists/tokens/master/tokens/eth/tokens-eth.json' },
];

export const DestTokensByChain: { [chain_name: string]: Token[] } = {
    eth: [
        { chain: 'eth', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', name: 'Wrapped Ether', symbol: 'WETH', logo_url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', decimals: 18 },
        { chain: 'eth', address: '0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin', symbol: 'USDC', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', decimals: 6 },
        { chain: 'eth', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', name: 'Tether', symbol: 'USDT', logo_url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', decimals: 6 },
        { chain: 'eth', address: '0x6b175474e89094c44da98b954eedeac495271d0f', name: 'Dai', symbol: 'DAI', logo_url: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', decimals: 18 },
    ],
    matic: [
        { chain: 'matic', address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', name: 'Wrapped Matic', symbol: 'WMATIC', logo_url: 'https://cryptologos.cc/logos/polygon-matic-logo.png', decimals: 18 },
        { chain: 'matic', address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', name: 'USD Coin', symbol: 'USDC', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', decimals: 6 },
        { chain: 'matic', address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803', name: 'Tether', symbol: 'USDT', logo_url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', decimals: 6 },
        { chain: 'matic', address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', name: 'Dai', symbol: 'DAI', logo_url: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', decimals: 18 },
    ],
    bsc: [
        { chain: 'bsc', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', name: 'Wrapped BNB', symbol: 'WBNB', logo_url: 'https://cryptologos.cc/logos/binance-coin-bnb-logo.png', decimals: 18 },
        { chain: 'bsc', address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', name: 'USD Coin', symbol: 'USDC', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', decimals: 18 },
        { chain: 'bsc', address: '0x55d398326f99059ff775485246999027b3197955', name: 'Tether', symbol: 'USDT', logo_url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', decimals: 18 },
        { chain: 'bsc', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', name: 'Dai', symbol: 'DAI', logo_url: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', decimals: 18 },
    ],
    avax: [
        { chain: 'avax', address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', name: 'Wrapped AVAX', symbol: 'WAVAX', logo_url: 'https://cryptologos.cc/logos/avalanche-avax-logo.png', decimals: 18 },
        { chain: 'avax', address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', name: 'USD Coin', symbol: 'USDC', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', decimals: 6 },
        { chain: 'avax', address: '0xc7198437980c041c805A1EDcbA50c1Ce5db95118', name: 'Tether', symbol: 'USDT', logo_url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', decimals: 6 },
        { chain: 'avax', address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70', name: 'Dai', symbol: 'DAI', logo_url: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', decimals: 18 },
    ],
    ftm: [
        { chain: 'ftm', address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83', name: 'Wrapped Fantom', symbol: 'WFTM', logo_url: 'https://cryptologos.cc/logos/fantom-ftm-logo.png', decimals: 18 },
        { chain: 'ftm', address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', name: 'USD Coin', symbol: 'USDC', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', decimals: 6 },
        { chain: 'ftm', address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', name: 'Tether', symbol: 'USDT', logo_url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', decimals: 6 },
        { chain: 'ftm', address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', name: 'Dai', symbol: 'DAI', logo_url: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', decimals: 18 },
    ],
    base: [
        { chain: 'base', address: '0x4200000000000000000000000000000000000006', name: 'Wrapped ETH', symbol: 'WETH', logo_url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', decimals: 18 },
        { chain: 'base', address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', name: 'USD Coin', symbol: 'USDC', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', decimals: 6 },
    ],
    arb: [
        { chain: 'arb', address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1', name: 'Wrapped ETH', symbol: 'WETH', logo_url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', decimals: 18 },
        { chain: 'arb', address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', name: 'USD Coin', symbol: 'USDC', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', decimals: 6 },
        { chain: 'arb', address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9', name: 'Tether', symbol: 'USDT', logo_url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', decimals: 6 },
        { chain: 'arb', address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', name: 'Dai', symbol: 'DAI', logo_url: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', decimals: 18 },
    ],
    op: [
        { chain: 'op', address: '0x4200000000000000000000000000000000000006', name: 'Wrapped ETH', symbol: 'WETH', logo_url: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', decimals: 18 },
        { chain: 'op', address: '0x7f5c764cbc14f9669b88837ca1490cca17c31607', name: 'USD Coin', symbol: 'USDC', logo_url: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', decimals: 6 },
        { chain: 'op', address: '0x4200000000000000000000000000000000000042', name: 'Tether', symbol: 'USDT', logo_url: 'https://cryptologos.cc/logos/tether-usdt-logo.png', decimals: 6 },
        { chain: 'op', address: '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1', name: 'Dai', symbol: 'DAI', logo_url: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', decimals: 18 },
    ],
};
