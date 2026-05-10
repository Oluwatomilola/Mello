import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ConfirmedSignatureInfo,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { toast } from "sonner";
import { explorerTx, lamportsToSol, shortAddr, solToLamports } from "@/lib/solana";

type Token = { mint: string; amount: number; decimals: number };

export function useSolBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    if (!publicKey) return setBalance(null);
    let cancelled = false;
    const fetch = async () => {
      const lamports = await connection.getBalance(publicKey, "confirmed");
      if (!cancelled) setBalance(lamportsToSol(lamports));
    };
    fetch();
    const id = connection.onAccountChange(publicKey, (a) => {
      if (!cancelled) setBalance(lamportsToSol(a.lamports));
    });
    return () => {
      cancelled = true;
      connection.removeAccountChangeListener(id);
    };
  }, [connection, publicKey]);
  return balance;
}

export function useSplTokens() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [tokens, setTokens] = useState<Token[]>([]);
  useEffect(() => {
    if (!publicKey) return setTokens([]);
    connection
      .getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })
      .then(({ value }) => {
        setTokens(
          value
            .map((v) => {
              const info = v.account.data.parsed.info;
              return {
                mint: info.mint as string,
                amount: Number(info.tokenAmount.uiAmount ?? 0),
                decimals: info.tokenAmount.decimals as number,
              };
            })
            .filter((t) => t.amount > 0),
        );
      })
      .catch(() => setTokens([]));
  }, [connection, publicKey]);
  return tokens;
}

export function useRecentTxs(limit = 8) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [sigs, setSigs] = useState<ConfirmedSignatureInfo[]>([]);
  useEffect(() => {
    if (!publicKey) return setSigs([]);
    connection.getSignaturesForAddress(publicKey, { limit }).then(setSigs).catch(() => setSigs([]));
  }, [connection, publicKey, limit]);
  return sigs;
}

export function useSendSol() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  return useMemo(
    () => async (to: string, sol: number) => {
      if (!publicKey) throw new Error("Connect wallet first");
      const recipient = new PublicKey(to);
      const tx = new Transaction().add(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipient, lamports: solToLamports(sol) }),
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      toast.success("Sent " + sol + " SOL", {
        description: shortAddr(sig),
        action: { label: "View", onClick: () => window.open(explorerTx(sig)) },
      });
      return sig;
    },
    [connection, publicKey, sendTransaction],
  );
}

export function useSendSpl() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  return useMemo(
    () => async (mint: string, to: string, amount: number, decimals: number) => {
      if (!publicKey) throw new Error("Connect wallet first");
      const mintPk = new PublicKey(mint);
      const recipient = new PublicKey(to);
      const fromAta = getAssociatedTokenAddressSync(mintPk, publicKey);
      const toAta = getAssociatedTokenAddressSync(mintPk, recipient);
      const raw = BigInt(Math.floor(amount * 10 ** decimals));
      const tx = new Transaction().add(
        createTransferInstruction(fromAta, toAta, publicKey, raw),
      );
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      toast.success("Sent tokens", {
        description: shortAddr(sig),
        action: { label: "View", onClick: () => window.open(explorerTx(sig)) },
      });
      return sig;
    },
    [connection, publicKey, sendTransaction],
  );
}

export const LAMPORTS = LAMPORTS_PER_SOL;
