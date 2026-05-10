import { createFileRoute } from '@tanstack/react-router';
import { LiFiWidget, WidgetConfig } from '@lifi/widget';
import { useWallet } from '@solana/wallet-adapter-react';
import { NavBar } from '@/components/NavBar';

export const Route = createFileRoute('/bridge')({
  component: BridgeComponent,
});

function BridgeComponent() {
  const { wallet } = useWallet();

  const widgetConfig: WidgetConfig = {
    integrator: 'Mellocoin',
    toChain: 1151111081099710, // Solana
    theme: {
      palette: {
        mode: 'dark',
        primary: { main: '#10b981' }, // emerald-500 matching Mellocoin theme
        background: {
          paper: 'rgba(15, 23, 42, 0.8)', // slate-900 with opacity
          default: 'transparent',
        },
      },
      shape: {
        borderRadius: 24,
        borderRadiusSecondary: 16,
      },
    },
    appearance: 'dark',
    hiddenUI: ['appearance', 'language', 'poweredBy'],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container mx-auto px-4 pt-24 pb-12 flex flex-col items-center">
        <div className="max-w-2xl text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            Cross-Chain Onboarding
          </h1>
          <p className="text-lg text-muted-foreground">
            Fund your Solana wallet from any chain. Connect your MetaMask or other EVM wallet, select your source asset, and bridge directly into Solana.
          </p>
        </div>

        <div className="w-full max-w-[480px] rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/10 backdrop-blur-xl bg-slate-900/50 relative z-10">
          <LiFiWidget integrator="Mellocoin" config={widgetConfig} />
        </div>
      </main>
    </div>
  );
}
