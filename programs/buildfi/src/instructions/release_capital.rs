use anchor_lang::prelude::*;
use anchor_spl::token::{transfer_checked, TransferChecked};

use crate::error::BuildFiError;

pub fn handler(ctx: Context<crate::ReleaseCapital>) -> Result<()> {
    let project = &mut ctx.accounts.project;
    require!(
        project.released_milestone_count < project.milestone_count,
        BuildFiError::NoMilestoneToRelease
    );
    let idx = project.released_milestone_count as usize;
    let pct = project.milestones[idx].percentage as u64;
    let vault_balance = ctx.accounts.vault.amount;
    let release_amount = (vault_balance * pct) / 100;
    require!(release_amount > 0, BuildFiError::InsufficientVaultBalance);

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
                to: ctx.accounts.owner_usdc_ata.to_account_info(),
                authority: ctx.accounts.project_authority.to_account_info(),
            },
            signer_seeds,
        ),
        release_amount,
        ctx.accounts.usdc_mint.decimals,
    )?;
    project.released_milestone_count += 1;
    Ok(())
}
