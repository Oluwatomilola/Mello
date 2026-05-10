#!/usr/bin/env bash
set -euo pipefail
# Deploy Mellocoin Protocol to Solana Devnet.
# Requires: solana-cli, anchor (>=0.30), a funded ~/.config/solana/id.json on devnet.

solana config set --url https://api.devnet.solana.com
solana airdrop 2 || true

anchor build
anchor deploy --provider.cluster devnet

PROGRAM_ID=$(solana address -k target/deploy/mellocoin_protocol-keypair.json)
echo "Deployed mellocoin_protocol → $PROGRAM_ID"
echo "Update Anchor.toml + declare_id! macro + frontend env (VITE_MELLOCOIN_PROGRAM_ID) with this value."
