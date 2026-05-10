# 🍃 MelloPay

> Conversational, AI-assisted Solana payments — escrow vaults, tip jars, and scheduled transfers in a single smart wallet.

Mellocoin turns natural-language intent ("send Alex 0.5 SOL on Friday", "lock 2 SOL for the design deliverable") into safe, on-chain actions backed by a custom Anchor program. It is built for hackathon judging: full Rust program + Anchor tests + production-grade frontend on TanStack Start + Tailwind v4 + Wallet Adapter.

---

## ✨ Features

- **Smart Wallet Dashboard** — connect Phantom / Solflare, view SOL & SPL balances, send funds, browse history.
- **Escrow Vaults** — lock SOL or SPL tokens in PDA-owned vaults; release or refund with one signature.
- **Tip Jars** — public donation pages with on-chain memos and creator attribution.
- **Scheduled Payments** — store recurring transfer instructions on-chain as deterministic PDAs.
- **Memo-First UX** — every flow attaches a category and note via the Solana Memo program.
- **Live on Devnet** — versioned transactions, ATA management, CPI into SPL Token.

---

## 🌉 LI.FI Cross-Chain Integration

### Why This Matters
Users should not need to manually bridge before using Solana apps. Mellocoin solves this UX friction by deeply integrating LI.FI, allowing users to start on any EVM chain, bridge seamlessly, and instantly use Solana-native payment and creator experiences.

### Supported Chains
- **Ethereum**
- **Base**
- **Arbitrum**
- **Polygon**
- **Optimism**
- **BSC**
- **Solana**

### Cross-Chain User Flow
`EVM Wallet → LI.FI Route / Swap → Solana → Mellocoin Escrow / Tip Jar`

1. User opens Mellocoin and connects MetaMask (EVM) or Phantom (Solana).
2. User chooses a source chain and token.
3. LI.FI SDK / Widget fetches the best, real-time routes.
4. User executes the bridge/swap transaction natively in the app.
5. Assets arrive as SOL or USDC on Solana.
6. User can instantly utilize Mellocoin features.

### Integrations Used
- **LI.FI SDK (`@lifi/sdk`)**: Used in the AI-Assisted Smart Router (`/routes`) to fetch, evaluate, and recommend the cheapest and fastest cross-chain routes.
- **LI.FI Widget (`@lifi/widget`)**: Embedded with custom branding for the Cross-Chain Onboarding (`/bridge`) and Cross-Chain Checkout (`/pay`) flows to handle real bridging and transaction execution securely.

---

## 🏗 Architecture

```
┌────────────────────────┐         ┌──────────────────────────┐
│  TanStack Start UI     │  RPC →  │  Solana Devnet Cluster   │
│  • Wallet Adapter      │ ◄──────│  • mellocoin_protocol    │
│  • web3.js / spl-token │  events │  • SPL Token / ATA       │
│  • shadcn + Framer     │         │  • Memo Program          │
└──────────┬─────────────┘         └─────────────┬────────────┘
           ▼                                      ▼
   Phantom / Solflare              PDAs: User · Escrow · Vault · TipJar · Schedule
```

Detailed docs: [`docs/architecture.md`](./docs/architecture.md), [`docs/smart-contract-flow.md`](./docs/smart-contract-flow.md), [`docs/pda-structure.md`](./docs/pda-structure.md).

### PDA layout

| Account            | Seeds                                              |
|--------------------|----------------------------------------------------|
| `UserProfile`      | `[b"user", authority]`                             |
| `Escrow`           | `[b"escrow", maker, escrow_id_le_bytes]`           |
| Escrow vault       | `[b"escrow-vault", escrow]`                        |
| `TipJar`           | `[b"tipjar", creator, slug]`                       |
| `PaymentSchedule`  | `[b"schedule", owner, schedule_id_le_bytes]`       |

### Escrow lifecycle

```
   create_escrow            release_escrow
Ø ─────────────► Funded ──────────────────► Released
                   │
                   │ refund_escrow
                   ▼
                Refunded
```

---

## 🧰 Solana Libraries Used

- **Anchor 0.30** — program framework (PDAs, CPI, events, custom errors, `init_if_needed`)
- **anchor-spl** — SPL Token + Associated Token Account CPI
- **@solana/web3.js** — versioned transactions, signature subscriptions
- **@solana/wallet-adapter-react / -react-ui** — Phantom / Solflare via Wallet Standard
- **@solana/spl-token** — ATA derivation + SPL transfers
- **Solana Memo Program** — on-chain transaction metadata
- **Solana Explorer** — deep-link UX

---

## 🚀 Devnet Deployment

```
Program ID:    TO_BE_FILLED_AFTER_DEPLOY
Frontend URL:  TO_BE_FILLED_AFTER_DEPLOY
Cluster:       solana devnet
```

After running `scripts/deploy-devnet.sh`, paste the printed program ID into:

1. `programs/mellocoin_protocol/src/lib.rs` (`declare_id!`)
2. `Anchor.toml` (`[programs.devnet]`)
3. `.env` (`VITE_MELLOCOIN_PROGRAM_ID`)

---

## 🛠 Local setup

### Prerequisites

- Rust + `solana-cli` (≥ 1.18)
- `anchor-cli` 0.30
- Node 20+ and **Bun** (or pnpm/yarn)

### Steps

```bash
# 1. Install JS deps
bun install

# 2. Configure env
cp .env.example .env

# 3. Build & test the Anchor program
anchor build
anchor test

# 4. Deploy to devnet
solana airdrop 2
bash scripts/deploy-devnet.sh

# 5. Run the frontend
bun run dev
```

### Environment variables

| Var                          | Default                                  |
|------------------------------|------------------------------------------|
| `VITE_SOLANA_CLUSTER`        | `devnet`                                 |
| `VITE_SOLANA_RPC_URL`        | `https://api.devnet.solana.com`          |
| `VITE_MELLOCOIN_PROGRAM_ID`  | `MeLLoXkB3v3VJk2A1mEJC8hQqKqkPkS9qLZxZmL5cKp` |

---

## 📂 Project structure

```
mellocoin/
├── programs/
│   └── mellocoin_protocol/      # Anchor Rust program
│       ├── Cargo.toml
│       └── src/lib.rs
├── tests/                       # mocha + chai integration tests
├── scripts/                     # deploy-devnet.sh, local-validator.sh
├── docs/                        # architecture, contract flow, PDA structure
├── src/                         # TanStack Start frontend
│   ├── routes/                  # /, /dashboard, /escrow, /tip, /tip/$slug, /settings
│   ├── components/              # NavBar, wallet glue, shadcn UI
│   └── lib/                     # solana.ts, wallet-hooks.ts
├── Anchor.toml
├── README.md
└── package.json
```

---

## 🧪 Testing

```bash
anchor test
```

Covers:

- ✅ User profile initialization
- ✅ Escrow create + release happy path
- ✅ Unauthorized release rejection
- ✅ Tip jar creation + tipping flow

---

## 📸 Screenshots

| | |
|---|---|
| Landing | Hero with glassmorphism + emerald/violet gradients |
| Cross-Chain Bridge | LI.FI Widget embedded for any-to-Solana onboarding |
| Smart Route | AI-assisted route evaluation via `@lifi/sdk` |
| Pay Checkout | Cross-chain payment flow to a specific Solana escrow |
| Dashboard | Balance, SPL list, recent tx feed |
| Escrow | Fund + memo + status timeline |
| Tip Jar | Public `/tip/:slug` donation page |

(Screenshots live in `/docs/screens/` — populate after deploy.)

---

## 🔭 Future Improvements

- AI intent parser → server function that crafts versioned transactions from natural language
- Jupiter quote integration for cross-token tips
- Metaplex Token Metadata reads to enrich SPL views
- Address Lookup Tables for batched payroll runs
- pg_cron → cron worker that executes `crank_schedule` instructions

---

## 💚 Why Mellopay is Unique

Most Solana payment apps are form-driven. Mellocoin treats payments as **conversation primitives** — every action carries a memo, every PDA is addressable, every escrow has a story. It pairs that UX with a serious Solana program: PDAs, CPIs, events, custom errors, and SPL escrows via associated token accounts. It's built to feel like an early-stage fintech, not a tutorial fork.

---

## 📄 License

[MIT](./LICENSE) — see also [CONTRIBUTING.md](./CONTRIBUTING.md).
