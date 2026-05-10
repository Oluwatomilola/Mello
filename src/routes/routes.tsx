import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { createConfig, getRoutes, Route as LifiRoute } from '@lifi/sdk';
import { NavBar } from '@/components/NavBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, Clock, Fuel, ShieldCheck } from 'lucide-react';

export const Route = createFileRoute('/routes')({
  component: SmartRoutesComponent,
});

createConfig({
  integrator: 'Mellocoin',
});

// Hardcoded for demo purposes
const chains = [
  { id: 1, name: 'Ethereum', token: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18 },
  { id: 42161, name: 'Arbitrum', token: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18 },
  { id: 8453, name: 'Base', token: '0x0000000000000000000000000000000000000000', symbol: 'ETH', decimals: 18 },
  { id: 137, name: 'Polygon', token: '0x0000000000000000000000000000000000000000', symbol: 'MATIC', decimals: 18 },
];

const solanaTokens = [
  { address: '11111111111111111111111111111111', symbol: 'SOL', decimals: 9 },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', decimals: 6 },
];

function SmartRoutesComponent() {
  const [fromChain, setFromChain] = useState<string>('8453'); // Default Base
  const [toToken, setToToken] = useState<string>('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // Default USDC
  const [amount, setAmount] = useState('0.1');
  const [loading, setLoading] = useState(false);
  const [bestRoute, setBestRoute] = useState<LifiRoute | null>(null);
  const [insight, setInsight] = useState('');

  const handleFindRoute = async () => {
    setLoading(true);
    setBestRoute(null);
    setInsight('');

    try {
      const selectedChain = chains.find(c => c.id.toString() === fromChain)!;
      const parsedAmount = (parseFloat(amount) * 10 ** selectedChain.decimals).toString();

      const result = await getRoutes({
        fromChainId: selectedChain.id,
        toChainId: 1151111081099710, // Solana
        fromTokenAddress: selectedChain.token,
        toTokenAddress: toToken,
        fromAmount: parsedAmount,
        options: {
          slippage: 0.03, // 3%
        }
      });

      if (result.routes.length > 0) {
        // AI heuristic: pick the first route (LI.FI already sorts by best value)
        const route = result.routes[0];
        setBestRoute(route);
        
        const estTime = Math.ceil(route.steps.reduce((acc, step) => acc + step.estimate.executionDuration, 0) / 60);
        const gasCostUsd = parseFloat(route.gasCostUSD || "0").toFixed(2);
        
        setInsight(`Best route from ${selectedChain.name} ${selectedChain.symbol} to Solana ${solanaTokens.find(t => t.address === toToken)?.symbol} takes ~${estTime} mins with lowest fees ($${gasCostUsd}).`);
      } else {
        setInsight('No valid routes found for this pair. Try a different amount or chain.');
      }
    } catch (err) {
      console.error(err);
      setInsight('Failed to fetch routes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4 flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-emerald-400" />
            AI Smart Router
          </h1>
          <p className="text-lg text-muted-foreground">
            Let our engine find the cheapest and fastest way to move your assets to Solana.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Input Panel */}
          <div className="glow-card p-6 border border-white/10 rounded-2xl bg-slate-900/40 backdrop-blur-md">
            <h2 className="text-xl font-semibold mb-6">Route Parameters</h2>
            
            <div className="space-y-5">
              <div>
                <Label>Source Chain</Label>
                <Select value={fromChain} onValueChange={setFromChain}>
                  <SelectTrigger className="mt-1 bg-background/50">
                    <SelectValue placeholder="Select Source Chain" />
                  </SelectTrigger>
                  <SelectContent>
                    {chains.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Amount ({chains.find(c => c.id.toString() === fromChain)?.symbol})</Label>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  className="mt-1 bg-background/50" 
                  placeholder="0.0" 
                />
              </div>

              <div className="flex justify-center py-2">
                <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 md:rotate-0" />
              </div>

              <div>
                <Label>Destination Token (Solana)</Label>
                <Select value={toToken} onValueChange={setToToken}>
                  <SelectTrigger className="mt-1 bg-background/50">
                    <SelectValue placeholder="Select Destination Token" />
                  </SelectTrigger>
                  <SelectContent>
                    {solanaTokens.map(t => (
                      <SelectItem key={t.address} value={t.address}>{t.symbol}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleFindRoute} 
                disabled={loading || !amount} 
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {loading ? "Analyzing Routes..." : "Find Best Route"}
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="flex flex-col gap-4">
            {insight && (
              <div className="glow-card p-5 border border-emerald-500/30 bg-emerald-500/5 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5" />
                  <p className="text-sm font-medium leading-relaxed">{insight}</p>
                </div>
              </div>
            )}

            {bestRoute && (
              <div className="glow-card p-6 border border-white/10 rounded-2xl bg-slate-900/40 backdrop-blur-md flex-1">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-400" />
                  Recommended Route
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-muted-foreground text-sm">Estimated Output</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {parseFloat(bestRoute.toAmount) / (10 ** solanaTokens.find(t => t.address === toToken)!.decimals)} {solanaTokens.find(t => t.address === toToken)?.symbol}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/40 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Clock className="h-3 w-3" /> Time
                      </div>
                      <div className="font-semibold">~{Math.ceil(bestRoute.steps.reduce((acc, step) => acc + step.estimate.executionDuration, 0) / 60)} mins</div>
                    </div>
                    
                    <div className="bg-background/40 p-4 rounded-xl">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Fuel className="h-3 w-3" /> Gas Fee
                      </div>
                      <div className="font-semibold">${parseFloat(bestRoute.gasCostUSD || "0").toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-500"
                      onClick={() => window.location.href = '/bridge'}
                    >
                      Execute in Bridge
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {!insight && !loading && (
              <div className="h-full flex items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl text-muted-foreground text-sm text-center">
                Configure your route parameters and click find to see AI-optimized results.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
