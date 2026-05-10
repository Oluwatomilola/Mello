import { createFileRoute } from '@tanstack/react-router';
import { LiFiWidget, WidgetConfig } from '@lifi/widget';
import { NavBar } from '@/components/NavBar';
import { ShoppingCart, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/pay')({
  component: PayComponent,
});

function PayComponent() {
  const [paymentAmount] = useState('50'); // $50 USDC payment
  const merchantAddress = 'MelloXkB3v3VJk2A1mEJC8hQqKqkPkS9qLZxZmL5cKp';

  const widgetConfig: WidgetConfig = {
    integrator: 'Mellocoin',
    toChain: 1151111081099710, // Solana
    toToken: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    toAddress: {
      name: 'Mellocoin Escrow',
      address: merchantAddress,
      chainType: 'SVM',
    },
    buildRoute: {
      toAmount: (parseInt(paymentAmount) * 10**6).toString() // USDC has 6 decimals
    },
    theme: {
      palette: {
        mode: 'dark',
        primary: { main: '#3b82f6' }, // blue-500
        background: {
          paper: 'rgba(15, 23, 42, 0.8)',
          default: 'transparent',
        },
      },
      shape: {
        borderRadius: 24,
        borderRadiusSecondary: 16,
      },
    },
    appearance: 'dark',
    hiddenUI: ['appearance', 'language', 'poweredBy', 'toAddress'],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container mx-auto px-4 pt-16 pb-12 flex flex-col lg:flex-row items-center justify-center gap-12">
        
        {/* Checkout Info */}
        <div className="max-w-md w-full">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium mb-6">
            <ShoppingCart className="h-4 w-4" />
            Cross-Chain Checkout
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Pay from <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Any Chain</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            You are purchasing a Mellocoin Premium Subscription. Complete your payment using any supported EVM chain. Funds will be automatically routed to the Mellocoin Escrow on Solana.
          </p>

          <div className="glow-card p-6 border border-white/10 rounded-2xl bg-slate-900/40">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
              <span className="text-muted-foreground">Order Total</span>
              <span className="text-3xl font-bold">${paymentAmount} USDC</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-mono text-xs">{merchantAddress.slice(0, 8)}...{merchantAddress.slice(-6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  Solana <ShieldCheck className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Widget */}
        <div className="w-full max-w-[480px] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/10 backdrop-blur-xl bg-slate-900/50">
          <LiFiWidget integrator="Mellocoin" config={widgetConfig} />
        </div>

      </main>
    </div>
  );
}
