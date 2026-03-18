use anchor_lang::prelude::*;
use anchor_spl::associated_token::{get_associated_token_address_with_program_id, Create as AtaCreate};
use anchor_spl::token::{initialize_mint2, InitializeMint2};

use crate::error::BuildFiError;
use crate::state::{Milestone, MAX_DESCRIPTION_LEN, MAX_MILESTONES, MAX_NAME_LEN};

pub fn handler(
    ctx: Context<crate::CreateProject>,
    name: String,
    description: String,
    funding_target: u64,
    milestones: Vec<Milestone>,
) -> Result<()> {
    let (expected_authority, _) = Pubkey::find_program_address(
        &[b"project_authority", ctx.accounts.project.key().as_ref()],
        &crate::ID,
    );
    require!(
        ctx.accounts.project_authority.key() == expected_authority,
        BuildFiError::InvalidProjectAuthority
    );
    let expected_vault = get_associated_token_address_with_program_id(
        &ctx.accounts.project_authority.key(),
        &ctx.accounts.usdc_mint.key(),
        &ctx.accounts.token_program.key(),
    );
    require!(
        ctx.accounts.vault.key() == expected_vault,
        BuildFiError::InvalidVault
    );
    anchor_spl::associated_token::create(CpiContext::new(
        ctx.accounts.associated_token_program.to_account_info(),
        AtaCreate {
            payer: ctx.accounts.owner.to_account_info(),
            associated_token: ctx.accounts.vault.to_account_info(),
            authority: ctx.accounts.project_authority.to_account_info(),
            mint: ctx.accounts.usdc_mint.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            token_program: ctx.accounts.token_program.to_account_info(),
        },
    ))?;

    const MINT_ACCOUNT_LEN: u64 = 82;
    let rent_lamports = ctx.accounts.rent.minimum_balance(MINT_ACCOUNT_LEN as usize);
    let create_account_ix = anchor_lang::solana_program::system_instruction::create_account(
        &ctx.accounts.owner.key(),
        &ctx.accounts.participation_mint.key(),
        rent_lamports,
        MINT_ACCOUNT_LEN,
        &ctx.accounts.token_program.key(),
    );
    anchor_lang::solana_program::program::invoke(
        &create_account_ix,
        &[
            ctx.accounts.owner.to_account_info(),
            ctx.accounts.participation_mint.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    initialize_mint2(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            InitializeMint2 {
                mint: ctx.accounts.participation_mint.to_account_info(),
            },
        ),
        6,
        &ctx.accounts.project_authority.key(),
        None,
    )?;

    require!(name.len() <= MAX_NAME_LEN, BuildFiError::NameTooLong);
    require!(
        description.len() <= MAX_DESCRIPTION_LEN,
        BuildFiError::DescriptionTooLong
    );
    require!(
        milestones.len() <= MAX_MILESTONES,
        BuildFiError::TooManyMilestones
    );
    let total_pct: u16 = milestones.iter().map(|m| m.percentage as u16).sum();
    require!(total_pct == 100, BuildFiError::MilestonePercentagesMustSumTo100);

    let project = &mut ctx.accounts.project;
    project.owner = ctx.accounts.owner.key();
    project.name = name;
    project.description = description;
    project.funding_target = funding_target;
    project.vault = ctx.accounts.vault.key();
    project.participation_mint = ctx.accounts.participation_mint.key();
    let (_, authority_bump) =
        Pubkey::find_program_address(&[b"project_authority", project.key().as_ref()], &crate::ID);
    project.bump = authority_bump;
    project.milestone_count = milestones.len() as u8;
    project.released_milestone_count = 0;

    for (i, m) in milestones.iter().enumerate() {
        project.milestones[i] = m.clone();
    }
    Ok(())
}
