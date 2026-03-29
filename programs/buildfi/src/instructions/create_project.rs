use anchor_lang::prelude::*;
use anchor_spl::associated_token::{get_associated_token_address_with_program_id, Create as AtaCreate};
use anchor_spl::token::{initialize_mint2, InitializeMint2};

use crate::error::BuildFiError;
use crate::state::{
    Milestone, MAX_DESCRIPTION_LEN, MAX_LOCATION_LEN, MAX_MILESTONES, MAX_NAME_LEN,
    MAX_PROJECT_CODE_LEN, MAX_THESIS_LEN, MAX_URL_LEN, MAX_VISION_LEN, MILESTONE_STATUS_MAX,
    PROJECT_STAGE_MAX, RISK_LEVEL_MAX,
};

#[allow(clippy::too_many_arguments)]
pub fn handler(
    ctx: Context<crate::CreateProject>,
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

    require!(funding_target > 0, BuildFiError::FundingTargetMustBePositive);
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
    for m in &milestones {
        require!(
            m.percentage > 0,
            BuildFiError::MilestonePercentageMustBePositive
        );
        require!(
            m.status <= MILESTONE_STATUS_MAX,
            BuildFiError::InvalidMilestoneStatus
        );
    }

    require!(stage <= PROJECT_STAGE_MAX, BuildFiError::InvalidProjectStage);
    require!(risk_level <= RISK_LEVEL_MAX, BuildFiError::InvalidRiskLevel);

    require!(
        project_code.len() <= MAX_PROJECT_CODE_LEN,
        BuildFiError::ProjectCodeTooLong
    );
    require!(image_url.len() <= MAX_URL_LEN, BuildFiError::ImageUrlTooLong);
    require!(
        location_name.len() <= MAX_LOCATION_LEN,
        BuildFiError::LocationNameTooLong
    );
    require!(vision.len() <= MAX_VISION_LEN, BuildFiError::VisionTooLong);
    require!(
        investment_thesis.len() <= MAX_THESIS_LEN,
        BuildFiError::InvestmentThesisTooLong
    );
    require!(
        program_rules_url.len() <= MAX_URL_LEN,
        BuildFiError::UrlTooLong
    );
    require!(
        project_docs_url.len() <= MAX_URL_LEN,
        BuildFiError::UrlTooLong
    );
    require!(
        milestones_docs_url.len() <= MAX_URL_LEN,
        BuildFiError::UrlTooLong
    );

    let owner_key = ctx.accounts.owner.key();
    let builder = &mut ctx.accounts.builder;
    let builder_bump = ctx.bumps.builder;

    if builder.owner == Pubkey::default() {
        require!(
            builder_name.len() <= MAX_NAME_LEN,
            BuildFiError::NameTooLong
        );
        require!(
            builder_description.len() <= MAX_DESCRIPTION_LEN,
            BuildFiError::DescriptionTooLong
        );
        builder.owner = owner_key;
        builder.name = builder_name;
        builder.description = builder_description;
        builder.is_kyb_verified = false;
        builder.bump = builder_bump;
    } else {
        require!(builder.owner == owner_key, BuildFiError::InvalidBuilder);
    }

    let project = &mut ctx.accounts.project;
    project.owner = owner_key;
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
    project.stage = stage;
    project.project_code = project_code;
    project.image_url = image_url;
    project.location_name = location_name;
    project.geo_lat = geo_lat;
    project.geo_lng = geo_lng;
    project.total_capital_raised = 0;
    project.builder = ctx.accounts.builder.key();
    project.vision = vision;
    project.investment_thesis = investment_thesis;
    project.program_rules_url = program_rules_url;
    project.project_docs_url = project_docs_url;
    project.milestones_docs_url = milestones_docs_url;
    project.duration_days = duration_days;
    project.risk_level = risk_level;
    project.target_return_bps = target_return_bps;

    for (i, m) in milestones.iter().enumerate() {
        project.milestones[i] = m.clone();
    }
    for i in milestones.len()..MAX_MILESTONES {
        project.milestones[i] = Milestone::default();
    }
    Ok(())
}
