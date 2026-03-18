use anchor_lang::prelude::*;

use crate::error::BuildFiError;

pub fn handler(ctx: Context<crate::DeleteProject>) -> Result<()> {
    let project = &ctx.accounts.project;
    require!(
        ctx.accounts.vault.amount == 0,
        BuildFiError::VaultMustBeEmpty
    );
    let project_key = project.key();
    let owner = &ctx.accounts.owner;
    let project_authority = &ctx.accounts.project_authority;
    let vault = &ctx.accounts.vault;
    let token_program = &ctx.accounts.token_program;

    let close_vault_ix = anchor_spl::token::spl_token::instruction::close_account(
        &token_program.key(),
        &vault.key(),
        &owner.key(),
        &project_authority.key(),
        &[],
    )?;
    let seeds: &[&[u8]] = &[
        b"project_authority",
        project_key.as_ref(),
        &[project.bump],
    ];
    anchor_lang::solana_program::program::invoke_signed(
        &close_vault_ix,
        &[
            vault.to_account_info(),
            owner.to_account_info(),
            project_authority.to_account_info(),
            token_program.to_account_info(),
        ],
        &[seeds],
    )?;

    // Note: Standard SPL Token does not support closing mint accounts; only token accounts
    // can be closed. The participation mint is left with 0 supply; rent is not reclaimed.

    Ok(())
}
