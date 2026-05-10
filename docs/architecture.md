# Mellocoin — Architecture

```text
┌─────────────────────────┐         ┌──────────────────────────┐
│  Next/TanStack Frontend │  RPC →  │   Solana Devnet Cluster  │
│  • Wallet Adapter       │ ◄──────│   • mellocoin_protocol    │
│  • web3.js / spl-token  │  events │   • SPL Token Program     │
│  • shadcn + Framer      │         │   • System / Memo / ATA   │
└──────────┬──────────────┘         └─────────────┬────────────┘
           │                                      │
           ▼                                      ▼
   Browser wallet (Phantom / Solflare)     PDAs (User / Escrow / TipJar / Schedule)
```

## Layers

1. **UI** — TanStack Start + Tailwind v4 + shadcn. Routes are file-based and
   SSR-friendly; wallet-bound widgets are mounted client-side only.
2. **Solana SDK layer** — `@solana/web3.js`, `@solana/spl-token`,
   `@solana/wallet-adapter-react`. Versioned transactions are used wherever
   the instruction count exceeds two.
3. **Anchor program (`mellocoin_protocol`)** — single Rust crate exposing
   modular instruction handlers, custom errors, and events.

## Data flow — escrow release

1. Maker UI submits `create_escrow(escrow_id, amount, memo, category)`
2. Program derives PDAs:
   `escrow = PDA([b"escrow", maker, escrow_id])`
   `vault  = PDA([b"escrow-vault", escrow])`
3. Program CPIs into the System Program to move SOL into the vault
4. UI polls `program.account.escrow.fetch(escrow)` and renders state
5. Maker calls `release_escrow` → vault lamports moved to taker, state →
   `Released`, `EscrowSettled` event emitted
