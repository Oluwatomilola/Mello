import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Repeat, Sparkles, Wallet, Coins, MessageSquare } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mellocoin — Conversational Solana Payments" },
      {
        name: "description",
        content:
          "Mellocoin is a conversational, AI-assisted smart wallet on Solana — escrow, tip jars, and recurring payments in one chat-first interface.",
      },
      { property: "og:title", content: "Mellocoin — Conversational Solana Payments" },
      {
        property: "og:description",
        content: "Smart wallet, escrow vaults, tip jars and scheduled SOL/SPL payments on Solana.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Wallet, title: "Smart Wallet", desc: "SOL + SPL balances, history, and one-click transfers via Wallet Adapter." },
  { icon: Lock, title: "Escrow Vaults", desc: "Lock funds in PDA vaults; release or refund with a single signature." },
  { icon: Coins, title: "Tip Jars", desc: "Public donation pages with on-chain memos for creators and builders." },
  { icon: Repeat, title: "Scheduled Pay", desc: "Define recurring transfer instructions stored on-chain as PDAs." },
  { icon: MessageSquare, title: "Memo-First", desc: "Every flow attaches a category + note via the Solana Memo program." },
  { icon: Sparkles, title: "AI-Assisted", desc: "Chat your intent — Mellocoin composes versioned transactions for you." },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-16">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />
            Live on Solana Devnet
          </span>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Payments, escrow & tips —
            <br className="hidden md:block" />
            <span className="text-gradient-emerald">conversational</span>{" "}
            <span className="text-gradient-violet">on Solana</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            Mellocoin is a smart wallet that turns natural-language intent into safe on-chain
            actions: lock funds in escrow vaults, run a public tip jar, or schedule a recurring
            payment — without leaving the chat.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/dashboard"
              className="btn-hero inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              Open Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-foreground hover:bg-white/10"
            >
              View on GitHub
            </a>
          </div>
        </motion.section>

        <section className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glow-card p-6"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: "var(--gradient-violet)" }}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </section>

        <section className="glass mt-24 grid gap-8 p-8 md:grid-cols-3 md:p-12">
          {[
            ["Anchor 0.30", "Custom Solana program: PDAs, CPI, events, custom errors"],
            ["@solana/web3.js", "Versioned transactions + Wallet Adapter integration"],
            ["SPL Token + ATA", "Token escrows via associated token accounts"],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="text-sm uppercase tracking-widest text-muted-foreground">{k}</div>
              <div className="mt-2 text-lg">{v}</div>
            </div>
          ))}
        </section>
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-sm text-muted-foreground">
        Built for hackathon judging — <span className="text-gradient-emerald">Mellocoin</span> · Solana Devnet
      </footer>
    </div>
  );
}
