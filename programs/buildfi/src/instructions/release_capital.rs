// Release amount = current vault balance * milestone_pct / 100 (percentage of current balance at release time).
// On the final milestone, any remaining vault balance (rounding dust) is swept to the owner.
use anchor_lang::prelude::*;
use anchor_spl::associated_token::get_associated_token_address_with_program_id;
use anchor_spl::token::{transfer_checked, TransferChecked};

use crate::error::BuildFiError;

pub fn handler(ctx: Context<crate::ReleaseCapital>) -> Result<()> {
    let expected_owner_usdc_ata = get_associated_token_address_with_program_id(
        &ctx.accounts.owner.key(),
        &ctx.accounts.usdc_mint.key(),
        &ctx.accounts.token_program.key(),
    );
    require!(
        ctx.accounts.owner_usdc_ata.key() == expected_owner_usdc_ata,
        BuildFiError::InvalidTokenAccount
    );
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

    // On final milestone, sweep any remaining vault balance (rounding dust) to owner.
    // Use pre-transfer balance minus release_amount; ctx.accounts.vault.amount is not refreshed after CPI.
    let is_final_milestone = project.released_milestone_count == project.milestone_count;
    if is_final_milestone {
        let remaining = vault_balance.saturating_sub(release_amount);
        if remaining > 0 {
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
                remaining,
                ctx.accounts.usdc_mint.decimals,
            )?;
        }
    }
    Ok(())
}
