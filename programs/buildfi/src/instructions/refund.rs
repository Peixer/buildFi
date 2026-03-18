use anchor_lang::prelude::*;
use anchor_spl::token::{burn, transfer_checked, Burn, TransferChecked};

use crate::error::BuildFiError;

pub fn handler(ctx: Context<crate::Refund>) -> Result<()> {
    let project = &ctx.accounts.project;
    require!(
        project.released_milestone_count == 0,
        BuildFiError::RefundAfterReleaseNotAllowed
    );
    let buyer_account = &ctx.accounts.buyer_account;
    let amount = buyer_account.amount;
    require!(amount > 0, BuildFiError::InvalidAmount);

    let project_key = project.key();
    let seeds: &[&[u8]] = &[
        b"project_authority",
        project_key.as_ref(),
        &[project.bump],
    ];
    let signer_seeds = &[seeds];

    transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.usdc_mint.to_account_info(),
                to: ctx.accounts.buyer_usdc_ata.to_account_info(),
                authority: ctx.accounts.project_authority.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
        ctx.accounts.usdc_mint.decimals,
    )?;

    let burn_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.participation_mint.to_account_info(),
            from: ctx.accounts.buyer_participation_ata.to_account_info(),
            authority: ctx.accounts.project_authority.to_account_info(),
        },
        signer_seeds,
    );
    burn(burn_ctx, amount)?;

    let buyer_account = &mut ctx.accounts.buyer_account;
    buyer_account.amount = 0;
    Ok(())
}
