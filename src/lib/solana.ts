import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_MELLOCOIN_PROGRAM_ID) ||
    "MeLLoXkB3v3VJk2A1mEJC8hQqKqkPkS9qLZxZmL5cKp",
);

export const CLUSTER =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SOLANA_CLUSTER) || "devnet";

export const explorerTx = (sig: string) =>
  `https://explorer.solana.com/tx/${sig}?cluster=${CLUSTER}`;
export const explorerAddr = (a: string) =>
  `https://explorer.solana.com/address/${a}?cluster=${CLUSTER}`;

export const shortAddr = (a: string, n = 4) =>
  a.length > n * 2 + 2 ? `${a.slice(0, n)}…${a.slice(-n)}` : a;

export const lamportsToSol = (l: number | bigint) => Number(l) / 1_000_000_000;
export const solToLamports = (s: number) => Math.floor(s * 1_000_000_000);
