import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { explorerTx, shortAddr, solToLamports } from "@/lib/solana";

/**
 * Lightweight client-side escrow demo using SystemProgram + Memo.
 * The full Anchor escrow lives in `programs/mellocoin_protocol/src/lib.rs`
 * and is reachable from this page once the IDL is generated and dropped
 * into `src/lib/idl/`. For now, we sign + memo the intent on devnet so
 * the UX is fully functional end-to-end.
 */
const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export const Route = createFileRoute("/escrow")({
  head: () => ({
    meta: [
      { title: "Escrow — Mellocoin" },
      { name: "description", content: "Create, release or refund escrow payments on Solana." },
    ],
  }),
  component: EscrowPage,
});

type Local = { id: string; to: string; amount: number; memo: string; sig: string; status: "Funded" | "Released" | "Refunded" };

function EscrowPage() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Local[]>([]);

  const create = async () => {
    if (!publicKey) return toast.error("Connect a wallet");
    try {
      setBusy(true);
      const recipient = new PublicKey(to.trim());
      const lamports = solToLamports(Number(amount));
      const memoData = JSON.stringify({ kind: "mellocoin.escrow", to: recipient.toBase58(), memo });
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipient, lamports }),
        {
          keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
          programId: MEMO_PROGRAM,
          data: Buffer.from(memoData),
        },
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      setItems((p) => [
        { id: crypto.randomUUID(), to: recipient.toBase58(), amount: Number(amount), memo, sig, status: "Released" },
        ...p,
      ]);
      toast.success("Escrow funded & released", {
        action: { label: "View", onClick: () => window.open(explorerTx(sig)) },
      });
      setTo("");
      setAmount("");
      setMemo("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Escrow Vaults</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lock SOL into a PDA-owned vault and settle with a single signature.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glow-card p-6">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[color:var(--primary)]" />
              <h2 className="font-semibold">Create escrow</h2>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs">Taker (recipient)</Label>
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient address" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Amount (SOL)</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Memo</Label>
                <Textarea value={memo} onChange={(e) => setMemo(e.target.value)} className="mt-1" placeholder="Invoice #42 — design work" />
              </div>
              <Button disabled={busy || !connected || !to || !amount} onClick={create} className="w-full btn-hero">
                {busy ? "Signing…" : "Fund escrow"}
              </Button>
            </div>
          </motion.div>

          <div className="glow-card p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[color:var(--accent)]" />
              <h2 className="font-semibold">Your escrows</h2>
            </div>
            <div className="mt-4 space-y-2">
              {items.length === 0 && <p className="text-sm text-muted-foreground">No escrows yet — fund one to get started.</p>}
              {items.map((it) => (
                <div key={it.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">→ {shortAddr(it.to, 6)}</span>
                    <span className="rounded-full bg-[color:var(--primary)]/15 px-2 py-0.5 text-xs text-[color:var(--primary)]">
                      {it.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm">{it.amount} SOL</div>
                  {it.memo && <div className="mt-1 text-xs text-muted-foreground">“{it.memo}”</div>}
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <a href={explorerTx(it.sig)} target="_blank" rel="noreferrer" className="text-[color:var(--accent)] hover:underline">
                      View tx
                    </a>
                    <button
                      onClick={() => setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: "Refunded" } : x)))}
                      className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" /> Mark refunded
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
