import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Coffee, Heart } from "lucide-react";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { explorerTx, solToLamports } from "@/lib/solana";

const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
// Hackathon demo recipient — replace with on-chain TipJar PDA lookup once IDL ships.
const DEMO_RECIPIENT = "GdnSyH3YtwcxFvQrVVJMm1JhTNwgjkmbq1dz8u8mQp4S";

export const Route = createFileRoute("/tip/$slug")({
  component: PublicTipPage,
});

function PublicTipPage() {
  const { slug } = useParams({ from: "/tip/$slug" });
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const [amount, setAmount] = useState("0.05");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const tip = async () => {
    if (!publicKey) return toast.error("Connect a wallet");
    try {
      setBusy(true);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(DEMO_RECIPIENT),
          lamports: solToLamports(Number(amount)),
        }),
        {
          keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
          programId: MEMO_PROGRAM,
          data: Buffer.from(JSON.stringify({ kind: "mellocoin.tip", slug, note })),
        },
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      toast.success("Thanks for the tip! 💚", {
        action: { label: "View", onClick: () => window.open(explorerTx(sig)) },
      });
      setNote("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="glow-card p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "var(--gradient-violet)" }}>
            <Coffee className="h-6 w-6 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">@{slug}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Support this creator with a SOL tip on Mellocoin.</p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {["0.05", "0.1", "0.5"].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                  amount === v ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {v} SOL
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3 text-left">
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Leave a note (optional)" />
            <Button onClick={tip} disabled={busy || !connected} className="w-full btn-hero">
              <Heart className="mr-2 h-4 w-4" /> {busy ? "Sending…" : `Tip ${amount} SOL`}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
