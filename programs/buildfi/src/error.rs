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
    #[msg("Invalid project authority PDA")]
    InvalidProjectAuthority,
    #[msg("Invalid vault address")]
    InvalidVault,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("No milestone left to release")]
    NoMilestoneToRelease,
    #[msg("Insufficient vault balance for release")]
    InsufficientVaultBalance,
    #[msg("Refund not allowed after a milestone has been released")]
    RefundAfterReleaseNotAllowed,
    #[msg("Vault must be empty to delete project")]
    VaultMustBeEmpty,
}
