import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Copy, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { explorerTx, shortAddr } from "@/lib/solana";
import { useRecentTxs, useSendSol, useSolBalance, useSplTokens } from "@/lib/wallet-hooks";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Mellocoin" },
      { name: "description", content: "View balances, history, and send SOL or SPL tokens with Mellocoin." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { publicKey, connected } = useWallet();
  const sol = useSolBalance();
  const tokens = useSplTokens();
  const sigs = useRecentTxs(10);
  const sendSol = useSendSol();
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const onSend = async () => {
    try {
      setBusy(true);
      await sendSol(to.trim(), Number(amount));
      setTo("");
      setAmount("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!connected || !publicKey) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="mx-auto mt-32 max-w-md px-4 text-center">
          <div className="glow-card p-10">
            <WalletIcon className="mx-auto h-10 w-10 text-[color:var(--primary)]" />
            <h2 className="mt-4 text-2xl font-semibold">Connect a wallet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use Phantom or Solflare to access the Mellocoin dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 lg:grid-cols-3">
          <div className="glow-card p-6 lg:col-span-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Wallet</div>
            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="font-mono">{shortAddr(publicKey.toBase58(), 6)}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicKey.toBase58());
                  toast.success("Address copied");
                }}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-6 flex items-baseline gap-3">
              {sol === null ? (
                <Skeleton className="h-12 w-40" />
              ) : (
                <span className="text-5xl font-semibold tracking-tight text-gradient-emerald">
                  {sol.toFixed(4)}
                </span>
              )}
              <span className="text-lg text-muted-foreground">SOL</span>
            </div>
          </div>

          <div className="glow-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Send SOL</div>
            <div className="mt-3 space-y-3">
              <div>
                <Label className="text-xs">Recipient</Label>
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient address" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Amount</Label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  type="number"
                  className="mt-1"
                />
              </div>
              <Button onClick={onSend} disabled={busy || !to || !amount} className="w-full btn-hero">
                {busy ? "Sending…" : "Send"}
              </Button>
            </div>
          </div>
        </motion.div>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="glow-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">SPL Tokens</h3>
            <div className="mt-4 space-y-2">
              {tokens.length === 0 && <p className="text-sm text-muted-foreground">No SPL token balances.</p>}
              {tokens.map((t) => (
                <div
                  key={t.mint}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="font-mono text-xs">{shortAddr(t.mint, 6)}</div>
                  <div className="text-sm">
                    {t.amount.toLocaleString(undefined, { maximumFractionDigits: t.decimals })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glow-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Recent activity</h3>
            <div className="mt-4 space-y-2">
              {sigs.length === 0 && <p className="text-sm text-muted-foreground">No recent transactions.</p>}
              {sigs.map((s) => (
                <a
                  key={s.signature}
                  href={explorerTx(s.signature)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    {s.err ? (
                      <ArrowDownRight className="h-4 w-4 text-[color:var(--destructive)]" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-[color:var(--primary)]" />
                    )}
                    <span className="font-mono text-xs">{shortAddr(s.signature, 6)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {s.blockTime ? new Date(s.blockTime * 1000).toLocaleString() : "—"}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
