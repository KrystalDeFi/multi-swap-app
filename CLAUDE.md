# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

- `yarn start` — Dev server on port 3000
- `yarn build` — Production build
- `yarn test` — Run tests (react-scripts test, no test files currently exist)
- `yarn deploy` — Build and deploy to GitHub Pages

## Architecture

This is a **React 19 + TypeScript DeFi portfolio tool** (Create React App) for viewing token balances across 24+ EVM chains and executing swaps via KyberSwap.

### Data Flow

```
App.tsx (wallet connection via ethers.js Web3Provider)
  → TokenBalances.tsx (fetches balances from Debank API, caches in localStorage)
    → SwapBox.tsx (KyberSwap widget integration, tx monitoring)
```

### Key Components

- **App.tsx** — Wallet connection (MetaMask/Rabby), provider initialization
- **TokenBalances.tsx** (~665 lines) — Main UI: token list table with chain filtering, sorting (by 24h change or USD value), search, small-value filtering, single-token balance refresh via RPC. Uses toast notifications. Communicates with SwapBox via callbacks.
- **SwapBox.tsx** — Embeds KyberSwap widget, handles chain switching, polls tx receipts (5s interval, 5min max), reloads balances on confirmation

### State & Persistence

- All state via `useState` hooks (no Redux/Context)
- `localStorage` for: Debank API key, cached token data, selected destination tokens per chain
- Parent-child communication via callback props

### External APIs

- **Debank API** (`pro-openapi.debank.com/v1/user/all_token_list`) — Token balances. API key from localStorage (has hardcoded default).
- **Blockchain RPCs** — Direct ERC20 `balanceOf`/`decimals` calls via ethers.js for single-token refresh. Fallback system tries multiple endpoints per chain with 5s timeout.

### Key Utilities (`src/utils/`)

- **constants.ts** — Network configs (chain IDs, RPC endpoints, explorers, logos), destination tokens per chain
- **utils.ts** — `withTimeout()`, formatting helpers, `getWorkingRpcEndpoint()` (tests RPCs, returns first working), `fetchTokenBalanceFromNode()` (direct blockchain query)

### Styling

All inline React styles — no CSS files or styling framework.

### TypeScript

Strict mode enabled. Path alias `@/*` maps to `src/*`. Key types in `src/types/index.ts`: `TokenBalance` (24 fields), `Token`, `WalletConnection`, `RpcEndpoint`.
