import { Link, useRouterState } from "@tanstack/react-router";
import { ClientOnly } from "@/components/ClientOnly";
import { WalletButton } from "@/components/solana/WalletButton";
import { Sparkles } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bridge", label: "Bridge" },
  { to: "/pay", label: "Pay" },
  { to: "/routes", label: "Smart Route" },
  { to: "/escrow", label: "Escrow" },
  { to: "/tip", label: "Tip Jar" },
];

export function NavBar() {
  const { location } = useRouterState();
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto mt-4 max-w-6xl px-4">
        <div className="glass flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--gradient-emerald)" }}>
              <Sparkles className="h-4 w-4 text-[color:var(--primary-foreground)]" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Mello<span className="text-gradient-emerald">coin</span>
            </span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {links.map((l) => {
              const active = location.pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <ClientOnly fallback={<div className="h-9 w-32 rounded-lg bg-white/5" />}>
            <WalletButton />
          </ClientOnly>
        </div>
      </div>
    </header>
  );
}
