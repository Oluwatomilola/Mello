//! Mellocoin Protocol
//! ------------------
//! A conversational Solana payments protocol providing:
//!   * User profile registration (PDA based)
//!   * Escrow vaults for SOL & SPL tokens
//!   * Recurring/scheduled payment instructions
//!   * Public tip jars for creators
//!   * Memo/metadata pinned to every flow
//!
//! All accounts are PDAs derived from deterministic seeds, all instruction
//! handlers emit events for off-chain indexing, and SPL escrow flows use
//! CPI into the Token Program through anchor-spl.

use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer as SolTransfer};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("MeLLoXkB3v3VJk2A1mEJC8hQqKqkPkS9qLZxZmL5cKp");

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
pub const USER_SEED: &[u8] = b"user";
pub const ESCROW_SEED: &[u8] = b"escrow";
pub const ESCROW_VAULT_SEED: &[u8] = b"escrow-vault";
pub const TIPJAR_SEED: &[u8] = b"tipjar";
pub const SCHEDULE_SEED: &[u8] = b"schedule";
pub const MAX_MEMO_LEN: usize = 180;
pub const MAX_USERNAME_LEN: usize = 32;
pub const MAX_CATEGORY_LEN: usize = 24;

#[program]
pub mod mellocoin_protocol {
    use super::*;

    // ---------------------------------------------------------------------
    // User Profile
    // ---------------------------------------------------------------------
    pub fn initialize_user(ctx: Context<InitializeUser>, username: String) -> Result<()> {
        require!(username.len() <= MAX_USERNAME_LEN, MelloError::UsernameTooLong);
        require!(!username.is_empty(), MelloError::UsernameEmpty);

        let user = &mut ctx.accounts.user_profile;
        user.authority = ctx.accounts.authority.key();
        user.username = username.clone();
        user.created_at = Clock::get()?.unix_timestamp;
        user.escrow_count = 0;
        user.tipjar_count = 0;
        user.bump = ctx.bumps.user_profile;

        emit!(UserInitialized {
            authority: user.authority,
            username,
            timestamp: user.created_at,
        });
        Ok(())
    }

    // ---------------------------------------------------------------------
    // Escrow — SOL
    // ---------------------------------------------------------------------
    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        escrow_id: u64,
        amount: u64,
        memo: String,
        category: String,
    ) -> Result<()> {
        require!(amount > 0, MelloError::InvalidAmount);
        require!(memo.len() <= MAX_MEMO_LEN, MelloError::MemoTooLong);
        require!(category.len() <= MAX_CATEGORY_LEN, MelloError::CategoryTooLong);

        let escrow = &mut ctx.accounts.escrow;
        escrow.escrow_id = escrow_id;
        escrow.maker = ctx.accounts.maker.key();
        escrow.taker = ctx.accounts.taker.key();
        escrow.mint = Pubkey::default(); // native SOL
        escrow.amount = amount;
        escrow.memo = memo.clone();
        escrow.category = category;
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.state = EscrowState::Funded;
        escrow.bump = ctx.bumps.escrow;
        escrow.vault_bump = ctx.bumps.vault;

        // Move SOL from maker into the vault PDA via system program CPI.
        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            SolTransfer {
                from: ctx.accounts.maker.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        system_program::transfer(cpi, amount)?;

        emit!(EscrowCreated {
            escrow: escrow.key(),
            maker: escrow.maker,
            taker: escrow.taker,
            amount,
        });
        Ok(())
    }

    pub fn release_escrow(ctx: Context<SettleEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Funded, MelloError::InvalidEscrowState);
        require_keys_eq!(ctx.accounts.signer.key(), escrow.maker, MelloError::Unauthorized);

        let amount = escrow.amount;
        transfer_from_vault(
            &ctx.accounts.vault.to_account_info(),
            &ctx.accounts.taker.to_account_info(),
            amount,
        )?;

        escrow.state = EscrowState::Released;
        emit!(EscrowSettled {
            escrow: escrow.key(),
            released: true,
            amount,
        });
        Ok(())
    }

    pub fn refund_escrow(ctx: Context<SettleEscrow>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.state == EscrowState::Funded, MelloError::InvalidEscrowState);
        require_keys_eq!(ctx.accounts.signer.key(), escrow.taker, MelloError::Unauthorized);
        require_keys_eq!(
            ctx.accounts.taker.key(),
            escrow.maker,
            MelloError::Unauthorized
        );

        let amount = escrow.amount;
        transfer_from_vault(
            &ctx.accounts.vault.to_account_info(),
            &ctx.accounts.taker.to_account_info(),
            amount,
        )?;

        escrow.state = EscrowState::Refunded;
        emit!(EscrowSettled {
            escrow: escrow.key(),
            released: false,
            amount,
        });
        Ok(())
    }

    // ---------------------------------------------------------------------
    // Tip Jar
    // ---------------------------------------------------------------------
    pub fn create_tipjar(ctx: Context<CreateTipjar>, slug: String, headline: String) -> Result<()> {
        require!(slug.len() <= MAX_USERNAME_LEN, MelloError::UsernameTooLong);
        require!(headline.len() <= MAX_MEMO_LEN, MelloError::MemoTooLong);

        let jar = &mut ctx.accounts.tipjar;
        jar.creator = ctx.accounts.creator.key();
        jar.slug = slug;
        jar.headline = headline;
        jar.total_tips = 0;
        jar.tip_count = 0;
        jar.bump = ctx.bumps.tipjar;
        Ok(())
    }

    pub fn tip_creator(ctx: Context<TipCreator>, amount: u64, memo: String) -> Result<()> {
        require!(amount > 0, MelloError::InvalidAmount);
        require!(memo.len() <= MAX_MEMO_LEN, MelloError::MemoTooLong);

        let cpi = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            SolTransfer {
                from: ctx.accounts.tipper.to_account_info(),
                to: ctx.accounts.creator.to_account_info(),
            },
        );
        system_program::transfer(cpi, amount)?;

        let jar = &mut ctx.accounts.tipjar;
        jar.total_tips = jar.total_tips.saturating_add(amount);
        jar.tip_count = jar.tip_count.saturating_add(1);

        emit!(TipSent {
            tipjar: jar.key(),
            tipper: ctx.accounts.tipper.key(),
            amount,
            memo,
        });
        Ok(())
    }

    // ---------------------------------------------------------------------
    // Scheduled / recurring payments
    // ---------------------------------------------------------------------
    pub fn create_schedule(
        ctx: Context<CreateSchedule>,
        schedule_id: u64,
        recipient: Pubkey,
        amount: u64,
        interval_secs: i64,
        runs: u32,
        memo: String,
    ) -> Result<()> {
        require!(amount > 0, MelloError::InvalidAmount);
        require!(interval_secs > 0, MelloError::InvalidInterval);
        require!(memo.len() <= MAX_MEMO_LEN, MelloError::MemoTooLong);

        let schedule = &mut ctx.accounts.schedule;
        schedule.owner = ctx.accounts.owner.key();
        schedule.recipient = recipient;
        schedule.amount = amount;
        schedule.interval_secs = interval_secs;
        schedule.runs_remaining = runs;
        schedule.next_run = Clock::get()?.unix_timestamp;
        schedule.memo = memo;
        schedule.schedule_id = schedule_id;
        schedule.bump = ctx.bumps.schedule;
        Ok(())
    }

    // ---------------------------------------------------------------------
    // SPL Token escrow (CPI to anchor-spl)
    // ---------------------------------------------------------------------
    pub fn create_token_escrow(
        ctx: Context<CreateTokenEscrow>,
        escrow_id: u64,
        amount: u64,
        memo: String,
    ) -> Result<()> {
        require!(amount > 0, MelloError::InvalidAmount);
        require!(memo.len() <= MAX_MEMO_LEN, MelloError::MemoTooLong);

        let escrow = &mut ctx.accounts.escrow;
        escrow.escrow_id = escrow_id;
        escrow.maker = ctx.accounts.maker.key();
        escrow.taker = ctx.accounts.taker.key();
        escrow.mint = ctx.accounts.mint.key();
        escrow.amount = amount;
        escrow.memo = memo;
        escrow.category = "token".to_string();
        escrow.created_at = Clock::get()?.unix_timestamp;
        escrow.state = EscrowState::Funded;
        escrow.bump = ctx.bumps.escrow;
        escrow.vault_bump = 0;

        let cpi = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            SplTransfer {
                from: ctx.accounts.maker_ata.to_account_info(),
                to: ctx.accounts.vault_ata.to_account_info(),
                authority: ctx.accounts.maker.to_account_info(),
            },
        );
        token::transfer(cpi, amount)?;
        Ok(())
    }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
fn transfer_from_vault<'info>(
    vault: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    **vault.try_borrow_mut_lamports()? = vault
        .lamports()
        .checked_sub(amount)
        .ok_or(MelloError::InsufficientFunds)?;
    **to.try_borrow_mut_lamports()? = to
        .lamports()
        .checked_add(amount)
        .ok_or(MelloError::MathOverflow)?;
    Ok(())
}

// -----------------------------------------------------------------------------
// Account Contexts
// -----------------------------------------------------------------------------
#[derive(Accounts)]
#[instruction(username: String)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = UserProfile::SIZE,
        seeds = [USER_SEED, authority.key().as_ref()],
        bump
    )]
    pub user_profile: Account<'info, UserProfile>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct CreateEscrow<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    /// CHECK: recipient is just a pubkey reference; funds settle to its system account.
    pub taker: UncheckedAccount<'info>,

    #[account(
        init,
        payer = maker,
        space = Escrow::SIZE,
        seeds = [ESCROW_SEED, maker.key().as_ref(), &escrow_id.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: vault PDA holds raw lamports; no data, just balance.
    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED, escrow.key().as_ref()],
        bump
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleEscrow<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [ESCROW_SEED, escrow.maker.as_ref(), &escrow.escrow_id.to_le_bytes()],
        bump = escrow.bump,
    )]
    pub escrow: Account<'info, Escrow>,

    /// CHECK: lamport-only PDA controlled by program seeds.
    #[account(
        mut,
        seeds = [ESCROW_VAULT_SEED, escrow.key().as_ref()],
        bump = escrow.vault_bump,
    )]
    pub vault: UncheckedAccount<'info>,

    /// CHECK: original taker (release) or maker (refund). Validated in handler.
    #[account(mut)]
    pub taker: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(slug: String)]
pub struct CreateTipjar<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = TipJar::SIZE,
        seeds = [TIPJAR_SEED, creator.key().as_ref(), slug.as_bytes()],
        bump
    )]
    pub tipjar: Account<'info, TipJar>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TipCreator<'info> {
    #[account(mut)]
    pub tipper: Signer<'info>,

    /// CHECK: receives lamports directly.
    #[account(mut, address = tipjar.creator)]
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [TIPJAR_SEED, tipjar.creator.as_ref(), tipjar.slug.as_bytes()],
        bump = tipjar.bump,
    )]
    pub tipjar: Account<'info, TipJar>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(schedule_id: u64)]
pub struct CreateSchedule<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = PaymentSchedule::SIZE,
        seeds = [SCHEDULE_SEED, owner.key().as_ref(), &schedule_id.to_le_bytes()],
        bump
    )]
    pub schedule: Account<'info, PaymentSchedule>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(escrow_id: u64)]
pub struct CreateTokenEscrow<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,

    /// CHECK: recipient pubkey.
    pub taker: UncheckedAccount<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = maker,
        space = Escrow::SIZE,
        seeds = [ESCROW_SEED, maker.key().as_ref(), &escrow_id.to_le_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut, associated_token::mint = mint, associated_token::authority = maker)]
    pub maker_ata: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = maker,
        associated_token::mint = mint,
        associated_token::authority = escrow,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------
#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub username: String,
    pub created_at: i64,
    pub escrow_count: u64,
    pub tipjar_count: u64,
    pub bump: u8,
}
impl UserProfile {
    pub const SIZE: usize = 8 + 32 + (4 + MAX_USERNAME_LEN) + 8 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowState {
    Funded,
    Released,
    Refunded,
}

#[account]
pub struct Escrow {
    pub escrow_id: u64,
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub memo: String,
    pub category: String,
    pub created_at: i64,
    pub state: EscrowState,
    pub bump: u8,
    pub vault_bump: u8,
}
impl Escrow {
    pub const SIZE: usize = 8
        + 8 + 32 + 32 + 32 + 8
        + (4 + MAX_MEMO_LEN)
        + (4 + MAX_CATEGORY_LEN)
        + 8 + 1 + 1 + 1;
}

#[account]
pub struct TipJar {
    pub creator: Pubkey,
    pub slug: String,
    pub headline: String,
    pub total_tips: u64,
    pub tip_count: u64,
    pub bump: u8,
}
impl TipJar {
    pub const SIZE: usize = 8
        + 32
        + (4 + MAX_USERNAME_LEN)
        + (4 + MAX_MEMO_LEN)
        + 8 + 8 + 1;
}

#[account]
pub struct PaymentSchedule {
    pub schedule_id: u64,
    pub owner: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub interval_secs: i64,
    pub runs_remaining: u32,
    pub next_run: i64,
    pub memo: String,
    pub bump: u8,
}
impl PaymentSchedule {
    pub const SIZE: usize = 8 + 8 + 32 + 32 + 8 + 8 + 4 + 8 + (4 + MAX_MEMO_LEN) + 1;
}

// -----------------------------------------------------------------------------
// Events & Errors
// -----------------------------------------------------------------------------
#[event]
pub struct UserInitialized {
    pub authority: Pubkey,
    pub username: String,
    pub timestamp: i64,
}

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub maker: Pubkey,
    pub taker: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EscrowSettled {
    pub escrow: Pubkey,
    pub released: bool,
    pub amount: u64,
}

#[event]
pub struct TipSent {
    pub tipjar: Pubkey,
    pub tipper: Pubkey,
    pub amount: u64,
    pub memo: String,
}

#[error_code]
pub enum MelloError {
    #[msg("Username exceeds maximum length")]
    UsernameTooLong,
    #[msg("Username cannot be empty")]
    UsernameEmpty,
    #[msg("Memo exceeds maximum length")]
    MemoTooLong,
    #[msg("Category exceeds maximum length")]
    CategoryTooLong,
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Schedule interval must be positive")]
    InvalidInterval,
    #[msg("Escrow is not in a settleable state")]
    InvalidEscrowState,
    #[msg("Signer is not authorized for this action")]
    Unauthorized,
    #[msg("Vault has insufficient funds")]
    InsufficientFunds,
    #[msg("Math overflow")]
    MathOverflow,
}
