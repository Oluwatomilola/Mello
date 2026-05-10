import { createFileRoute } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { Cpu, Globe, Wallet as WalletIcon } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { CLUSTER, PROGRAM_ID, shortAddr } from "@/lib/solana";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Mellocoin" },
      { name: "description", content: "Network, program, and wallet info for Mellocoin." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { publicKey } = useWallet();
  const rows = [
    { icon: Globe, label: "Cluster", value: CLUSTER },
    { icon: Cpu, label: "Program ID", value: PROGRAM_ID.toBase58() },
    { icon: WalletIcon, label: "Wallet", value: publicKey ? publicKey.toBase58() : "Not connected" },
  ];
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Read-only configuration for this Mellocoin instance.</p>

        <div className="glow-card mt-6 divide-y divide-white/10">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
                  <r.icon className="h-4 w-4 text-[color:var(--primary)]" />
                </div>
                <div>
                  <div className="text-sm font-medium">{r.label}</div>
                  <div className="font-mono text-xs text-muted-foreground">{r.value.length > 24 ? shortAddr(r.value, 6) : r.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
