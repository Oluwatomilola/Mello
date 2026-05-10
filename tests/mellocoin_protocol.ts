import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { MellocoinProtocol } from "../target/types/mellocoin_protocol";

const USER_SEED = Buffer.from("user");
const ESCROW_SEED = Buffer.from("escrow");
const VAULT_SEED = Buffer.from("escrow-vault");
const TIPJAR_SEED = Buffer.from("tipjar");

describe("mellocoin_protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MellocoinProtocol as Program<MellocoinProtocol>;

  const maker = (provider.wallet as anchor.Wallet).payer;
  const taker = Keypair.generate();

  before(async () => {
    const sig = await provider.connection.requestAirdrop(taker.publicKey, LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");
  });

  it("initializes a user profile", async () => {
    const [userPda] = PublicKey.findProgramAddressSync(
      [USER_SEED, maker.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .initializeUser("alice")
      .accounts({ authority: maker.publicKey, userProfile: userPda, systemProgram: SystemProgram.programId })
      .rpc();
    const acc = await program.account.userProfile.fetch(userPda);
    assert.equal(acc.username, "alice");
  });

  it("creates and releases an escrow", async () => {
    const escrowId = new BN(Date.now());
    const [escrow] = PublicKey.findProgramAddressSync(
      [ESCROW_SEED, maker.publicKey.toBuffer(), escrowId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vault] = PublicKey.findProgramAddressSync(
      [VAULT_SEED, escrow.toBuffer()],
      program.programId
    );
    const amount = new BN(0.1 * LAMPORTS_PER_SOL);

    await program.methods
      .createEscrow(escrowId, amount, "invoice 42", "freelance")
      .accounts({
        maker: maker.publicKey,
        taker: taker.publicKey,
        escrow,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const balanceBefore = await provider.connection.getBalance(taker.publicKey);
    await program.methods
      .releaseEscrow()
      .accounts({ signer: maker.publicKey, escrow, vault, taker: taker.publicKey })
      .rpc();
    const balanceAfter = await provider.connection.getBalance(taker.publicKey);
    assert.isAbove(balanceAfter, balanceBefore);
  });

  it("rejects unauthorized release", async () => {
    const escrowId = new BN(Date.now() + 1);
    const [escrow] = PublicKey.findProgramAddressSync(
      [ESCROW_SEED, maker.publicKey.toBuffer(), escrowId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vault] = PublicKey.findProgramAddressSync([VAULT_SEED, escrow.toBuffer()], program.programId);

    await program.methods
      .createEscrow(escrowId, new BN(0.05 * LAMPORTS_PER_SOL), "x", "x")
      .accounts({ maker: maker.publicKey, taker: taker.publicKey, escrow, vault, systemProgram: SystemProgram.programId })
      .rpc();

    try {
      await program.methods
        .releaseEscrow()
        .accounts({ signer: taker.publicKey, escrow, vault, taker: taker.publicKey })
        .signers([taker])
        .rpc();
      assert.fail("expected unauthorized");
    } catch (e) {
      assert.match((e as Error).message, /Unauthorized|6007/);
    }
  });

  it("creates a tip jar and accepts a tip", async () => {
    const slug = "mello";
    const [tipjar] = PublicKey.findProgramAddressSync(
      [TIPJAR_SEED, maker.publicKey.toBuffer(), Buffer.from(slug)],
      program.programId
    );
    await program.methods
      .createTipjar(slug, "Buy me a coffee")
      .accounts({ creator: maker.publicKey, tipjar, systemProgram: SystemProgram.programId })
      .rpc();

    await program.methods
      .tipCreator(new BN(0.01 * LAMPORTS_PER_SOL), "thanks!")
      .accounts({
        tipper: taker.publicKey,
        creator: maker.publicKey,
        tipjar,
        systemProgram: SystemProgram.programId,
      })
      .signers([taker])
      .rpc();

    const acc = await program.account.tipJar.fetch(tipjar);
    assert.equal(acc.tipCount.toNumber(), 1);
  });
});
