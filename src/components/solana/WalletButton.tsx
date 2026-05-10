import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function WalletButton() {
  return (
    <div className="mello-wallet">
      <WalletMultiButton />
      <style>{`
        .mello-wallet .wallet-adapter-button {
          background: var(--gradient-emerald) !important;
          color: var(--primary-foreground) !important;
          border-radius: 0.75rem !important;
          height: 38px !important;
          font-weight: 600 !important;
          padding: 0 14px !important;
          font-family: inherit !important;
        }
        .mello-wallet .wallet-adapter-button:not([disabled]):hover {
          filter: brightness(1.08);
        }
      `}</style>
    </div>
  );
}
