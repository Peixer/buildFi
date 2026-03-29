use anchor_lang::prelude::*;

#[error_code]
pub enum BuildFiError {
    #[msg("Name exceeds max length")]
    NameTooLong,
    #[msg("Description exceeds max length")]
    DescriptionTooLong,
    #[msg("Too many milestones")]
    TooManyMilestones,
    #[msg("Milestone percentages must sum to 100")]
    MilestonePercentagesMustSumTo100,
    #[msg("Each milestone percentage must be greater than 0")]
    MilestonePercentageMustBePositive,
    #[msg("Funding target must be greater than 0")]
    FundingTargetMustBePositive,
    #[msg("Invalid project authority PDA")]
    InvalidProjectAuthority,
    #[msg("Invalid vault address")]
    InvalidVault,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid token account: must be owned by the expected user and mint")]
    InvalidTokenAccount,
    #[msg("No milestone left to release")]
    NoMilestoneToRelease,
    #[msg("Insufficient vault balance for release")]
    InsufficientVaultBalance,
    #[msg("Refund not allowed after a milestone has been released")]
    RefundAfterReleaseNotAllowed,
    #[msg("Vault must be empty to delete project")]
    VaultMustBeEmpty,
    #[msg("Project code exceeds max length")]
    ProjectCodeTooLong,
    #[msg("Image URL exceeds max length")]
    ImageUrlTooLong,
    #[msg("Location name exceeds max length")]
    LocationNameTooLong,
    #[msg("Vision exceeds max length")]
    VisionTooLong,
    #[msg("Investment thesis exceeds max length")]
    InvestmentThesisTooLong,
    #[msg("URL exceeds max length")]
    UrlTooLong,
    #[msg("Invalid builder account for this owner")]
    InvalidBuilder,
    #[msg("Invalid project stage")]
    InvalidProjectStage,
    #[msg("Invalid risk level")]
    InvalidRiskLevel,
    #[msg("Invalid milestone status")]
    InvalidMilestoneStatus,
}
