import { ReactNode, useMemo } from 'react';
import { createConfig, WagmiProvider as BaseWagmiProvider, http } from 'wagmi';
import { mainnet, arbitrum, base, polygon, optimism, bsc } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

function createWagmiConfig() {
  return createConfig({
    chains: [mainnet, arbitrum, base, polygon, optimism, bsc],
    connectors: [
      injected({
        shimDisconnect: true,
      }),
    ],
    transports: {
      [mainnet.id]: http(),
      [arbitrum.id]: http(),
      [base.id]: http(),
      [polygon.id]: http(),
      [optimism.id]: http(),
      [bsc.id]: http(),
    },
    ssr: true,
  });
}

export function WagmiProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => createWagmiConfig(), []);
  
  return (
    <BaseWagmiProvider config={config}>
      {children}
    </BaseWagmiProvider>
  );
}
