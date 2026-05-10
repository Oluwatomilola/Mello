import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SOLANA_RPC_URL) ||
  clusterApiUrl("devnet");

export function SolanaProviders({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => RPC, []);
  // Phantom & Solflare auto-register via Wallet Standard, no adapters needed.
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
