import { ReactNode } from 'react';
import { createConfig, WagmiProvider as BaseWagmiProvider, http } from 'wagmi';
import { mainnet, arbitrum, base, polygon, optimism, bsc } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const config = createConfig({
  chains: [mainnet, arbitrum, base, polygon, optimism, bsc],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
  },
});

export function WagmiProvider({ children }: { children: ReactNode }) {
  return (
    <BaseWagmiProvider config={config}>
      {children}
    </BaseWagmiProvider>
  );
}
