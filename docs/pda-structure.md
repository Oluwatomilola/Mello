# PDA Structure

All program-derived addresses use deterministic seeds and store their bump
on-chain so derivations stay cheap on the client.

| Account            | Seeds                                                  |
|--------------------|--------------------------------------------------------|
| `UserProfile`      | `[b"user", authority]`                                 |
| `Escrow`           | `[b"escrow", maker, escrow_id_le_bytes]`               |
| `Escrow vault`     | `[b"escrow-vault", escrow]`                            |
| `TipJar`           | `[b"tipjar", creator, slug_bytes]`                     |
| `PaymentSchedule`  | `[b"schedule", owner, schedule_id_le_bytes]`           |
| `SPL escrow vault` | Associated Token Account owned by the escrow PDA       |

## Account sizes

Sizes are precomputed in Rust constants (`UserProfile::SIZE`, etc.) so rent
exemption is paid up-front and reallocation is unnecessary.

## Client-side derivation example

```ts
const [escrow] = PublicKey.findProgramAddressSync(
  [Buffer.from("escrow"), maker.toBuffer(), escrowId.toArrayLike(Buffer, "le", 8)],
  PROGRAM_ID,
);
```
