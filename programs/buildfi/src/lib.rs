use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

declare_id!("BcZabTwE6GoE4YVZ4fyrxhhmCw3FNrLYvhyCAmcXckDj");

mod error;
mod instructions;
mod state;

pub use error::*;
pub use state::*;

// --- Accounts structs (must live in lib.rs for Anchor #[program] macro) ---

/// Reserved for future program config or upgrade use. Currently a no-op.
#[derive(Accounts)]
pub struct Initialize {}

#[derive(Accounts)]
pub struct CreateProject<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = Project::LEN,
    )]
    pub project: Box<Account<'info, Project>>,

    /// PDA used to sign vault and participation mint operations. Validated in instruction.
    /// CHECK: validated in create_project instruction
    #[account(mut)]
    pub project_authority: UncheckedAccount<'info>,

    /// Vault is the ATA of project_authority for USDC. Created in instruction via CPI.
    /// CHECK: validated in create_project (must be ATA of project_authority + usdc_mint)
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,

    /// Participation token mint. Keypair must sign (required for create_account CPI).
    /// Created in instruction via create_account + initialize_mint2.
    #[account(mut)]
    pub participation_mint: Signer<'info>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    #[account(
        init_if_needed,
        payer = owner,
        space = Builder::LEN,
        seeds = [b"builder", owner.key().as_ref()],
        bump
    )]
    pub builder: Box<Account<'info, Builder>>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        seeds = [b"buyer", project.key().as_ref(), buyer.key().as_ref()],
        bump,
        init_if_needed,
        payer = buyer,
        space = Buyer::LEN,
    )]
    pub buyer_account: Account<'info, Buyer>,

    #[account(mut, has_one = vault, has_one = participation_mint)]
    pub project: Box<Account<'info, Project>>,

    /// CHECK: validated by project.vault
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,

    /// Must be buyer's USDC ATA (validated in instruction to avoid stack overflow).
    #[account(mut)]
    pub buyer_usdc_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Must be buyer's participation ATA (validated in instruction to avoid stack overflow).
    #[account(mut)]
    pub buyer_participation_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut)]
    pub participation_mint: Box<InterfaceAccount<'info, Mint>>,
    pub usdc_mint: Box<InterfaceAccount<'info, Mint>>,

    /// CHECK: project_authority PDA, validated in instruction
    #[account(mut, seeds = [b"project_authority", project.key().as_ref()], bump = project.bump)]
    pub project_authority: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseCapital<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, has_one = owner, has_one = vault)]
    pub project: Box<Account<'info, Project>>,

    /// CHECK: project_authority PDA
    #[account(mut, seeds = [b"project_authority", project.key().as_ref()], bump = project.bump)]
    pub project_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// Must be owner's USDC ATA (validated in instruction to avoid stack overflow).
    #[account(mut)]
    pub owner_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    pub usdc_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut, has_one = project, constraint = buyer_account.user == buyer.key())]
    pub buyer_account: Account<'info, Buyer>,

    #[account(has_one = vault, has_one = participation_mint)]
    pub project: Box<Account<'info, Project>>,

    /// CHECK: project_authority PDA
    #[account(mut, seeds = [b"project_authority", project.key().as_ref()], bump = project.bump)]
    pub project_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    /// Must be buyer's USDC ATA (validated in instruction to avoid stack overflow).
    #[account(mut)]
    pub buyer_usdc_ata: InterfaceAccount<'info, TokenAccount>,

    /// Must be buyer's participation ATA (validated in instruction to avoid stack overflow).
    #[account(mut)]
    pub buyer_participation_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub participation_mint: InterfaceAccount<'info, Mint>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct DeleteProject<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        has_one = owner,
        has_one = vault,
        has_one = participation_mint,
        close = owner,
    )]
    pub project: Box<Account<'info, Project>>,

    /// CHECK: project_authority PDA
    #[account(mut, seeds = [b"project_authority", project.key().as_ref()], bump = project.bump)]
    pub project_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    pub participation_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[program]
pub mod buildfi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Create a new project: project account (keypair), vault PDA, participation mint.
    /// Project authority PDA signs for vault and mint.
    #[allow(clippy::too_many_arguments)]
    pub fn create_project(
        ctx: Context<CreateProject>,
        name: String,
        description: String,
        funding_target: u64,
        milestones: Vec<Milestone>,
        builder_name: String,
        builder_description: String,
        stage: u8,
        project_code: String,
        image_url: String,
        location_name: String,
        geo_lat: i64,
        geo_lng: i64,
        vision: String,
        investment_thesis: String,
        program_rules_url: String,
        project_docs_url: String,
        milestones_docs_url: String,
        duration_days: u64,
        risk_level: u8,
        target_return_bps: u16,
    ) -> Result<()> {
        instructions::create_project::handler(
            ctx,
            name,
            description,
            funding_target,
            milestones,
            builder_name,
            builder_description,
            stage,
            project_code,
            image_url,
            location_name,
            geo_lat,
            geo_lng,
            vision,
            investment_thesis,
            program_rules_url,
            project_docs_url,
            milestones_docs_url,
            duration_days,
            risk_level,
            target_return_bps,
        )
    }

    /// Deposit USDC into project vault and mint 1:1 participation tokens to buyer.
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        instructions::deposit::handler(ctx, amount)
    }

    /// Release capital to project owner for the next milestone.
    /// Amount = current vault balance * milestone_pct / 100 (percentage of current balance, not of funding target).
    /// On the final milestone, any remaining vault balance (rounding dust) is swept to the owner.
    pub fn release_capital(ctx: Context<ReleaseCapital>) -> Result<()> {
        instructions::release_capital::handler(ctx)
    }

    /// Refund buyer's full deposit (only when no milestone has been released). Burns participation tokens.
    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        instructions::refund::handler(ctx)
    }

    /// Close project (only when vault balance is zero). Refund or release all funds first.
    /// Note: Buyer PDAs and the participation mint are not closed (SPL mints cannot be closed; Buyer accounts remain as historical data).
    pub fn delete_project(ctx: Context<DeleteProject>) -> Result<()> {
        instructions::delete_project::handler(ctx)
    }
}
