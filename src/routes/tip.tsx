import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Coffee, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/tip")({
  head: () => ({
    meta: [
      { title: "Tip Jar — Mellocoin" },
      { name: "description", content: "Spin up a public Solana donation page in seconds." },
    ],
  }),
  component: TipBuilder,
});

function TipBuilder() {
  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("Buy me a coffee on Solana");
  const url = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/tip/${slug}` : "";

  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold tracking-tight">Create a Tip Jar</h1>
        <p className="mt-1 text-sm text-muted-foreground">A shareable page that accepts SOL donations directly to your wallet.</p>

        <div className="glow-card mt-6 space-y-4 p-6">
          <div>
            <Label className="text-xs">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase())} placeholder="mellochef" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Headline</Label>
            <Textarea value={headline} onChange={(e) => setHeadline(e.target.value)} className="mt-1" />
          </div>

          {slug && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Preview</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg" style={{ background: "var(--gradient-violet)" }}>
                  <Coffee className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-medium">@{slug}</div>
                  <div className="text-xs text-muted-foreground">{headline}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <code className="rounded bg-black/40 px-2 py-1 font-mono">{url}</code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(url);
                    toast.success("Link copied");
                  }}
                >
                  <Share2 className="mr-1 h-3 w-3" /> Copy
                </Button>
                <Link to="/tip/$slug" params={{ slug }} className="inline-flex items-center gap-1 text-[color:var(--accent)] hover:underline">
                  Open <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
