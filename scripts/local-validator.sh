#!/usr/bin/env bash
set -euo pipefail
solana-test-validator --reset --quiet &
VALIDATOR_PID=$!
trap "kill $VALIDATOR_PID" EXIT
sleep 4
solana config set --url http://127.0.0.1:8899
anchor build
anchor deploy
wait $VALIDATOR_PID
