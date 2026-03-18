use anchor_lang::prelude::*;
use anchor_spl::associated_token::get_associated_token_address_with_program_id;
use anchor_spl::token::{mint_to, transfer_checked, MintTo, TransferChecked};

use crate::error::BuildFiError;

pub fn handler(ctx: Context<crate::Deposit>, amount: u64) -> Result<()> {
    require!(amount > 0, BuildFiError::InvalidAmount);
    let expected_usdc_ata = get_associated_token_address_with_program_id(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.usdc_mint.key(),
        &ctx.accounts.token_program.key(),
    );
    require!(
        ctx.accounts.buyer_usdc_ata.key() == expected_usdc_ata,
        BuildFiError::InvalidTokenAccount
    );
    let expected_participation_ata = get_associated_token_address_with_program_id(
        &ctx.accounts.buyer.key(),
        &ctx.accounts.participation_mint.key(),
        &ctx.accounts.token_program.key(),
    );
    require!(
        ctx.accounts.buyer_participation_ata.key() == expected_participation_ata,
        BuildFiError::InvalidTokenAccount
    );
    let project = &ctx.accounts.project;
    let buyer_account = &mut ctx.accounts.buyer_account;
    let project_key = project.key();
    let seeds: &[&[u8]] = &[
        b"project_authority",
        project_key.as_ref(),
        &[project.bump],
    ];
    let signer_seeds = &[seeds];

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.buyer_usdc_ata.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        ),
        amount,
        ctx.accounts.usdc_mint.decimals,
    )?;

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.participation_mint.to_account_info(),
                to: ctx.accounts.buyer_participation_ata.to_account_info(),
                authority: ctx.accounts.project_authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    buyer_account.user = ctx.accounts.buyer.key();
    buyer_account.project = project.key();
    buyer_account.amount = buyer_account.amount.saturating_add(amount);
    Ok(())
}
