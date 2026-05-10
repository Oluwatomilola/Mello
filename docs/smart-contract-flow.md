# Smart Contract Flow

## Instructions

| Instruction          | Signer  | Purpose                                          |
|----------------------|---------|--------------------------------------------------|
| `initialize_user`    | user    | Creates a `UserProfile` PDA                      |
| `create_escrow`      | maker   | Locks SOL into a vault PDA for a recipient       |
| `release_escrow`     | maker   | Releases vault funds → taker                     |
| `refund_escrow`      | taker   | Refunds vault funds → maker                      |
| `create_tipjar`      | creator | Creates a public donation jar                    |
| `tip_creator`        | tipper  | Sends SOL tip + memo to a tip jar's creator      |
| `create_schedule`    | owner   | Stores a recurring transfer instruction on-chain |
| `create_token_escrow`| maker   | Locks SPL tokens via CPI into program-owned ATA  |

## Escrow state machine

```text
        create_escrow                     release_escrow
   Ø ─────────────────► Funded ──────────────────────► Released
                          │
                          │ refund_escrow
                          ▼
                       Refunded
```

## Events emitted

- `UserInitialized`
- `EscrowCreated`
- `EscrowSettled { released: bool }`
- `TipSent`

## Custom errors

`UsernameTooLong`, `UsernameEmpty`, `MemoTooLong`, `CategoryTooLong`,
`InvalidAmount`, `InvalidInterval`, `InvalidEscrowState`, `Unauthorized`,
`InsufficientFunds`, `MathOverflow`.
