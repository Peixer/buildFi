use anchor_lang::prelude::*;

pub const MAX_NAME_LEN: usize = 64;
pub const MAX_DESCRIPTION_LEN: usize = 256;
pub const MAX_MILESTONES: usize = 10;
pub const MAX_URL_LEN: usize = 200;
pub const MAX_PROJECT_CODE_LEN: usize = 32;
pub const MAX_LOCATION_LEN: usize = 128;
pub const MAX_VISION_LEN: usize = 512;
pub const MAX_THESIS_LEN: usize = 256;

/// Milestone lifecycle: `0 = Pending`, `1 = Active`, `2 = Completed`.
pub const MILESTONE_STATUS_MAX: u8 = 2;
/// Project stage upper bound (inclusive); larger values rejected at creation.
pub const PROJECT_STAGE_MAX: u8 = 10;
/// Risk level `0` (lowest) ..= `5` (highest).
pub const RISK_LEVEL_MAX: u8 = 5;

/// Single milestone: fixed name, funding percentage, status, estimated completion (Unix secs, `0` = unset).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Milestone {
    pub name: [u8; 32],
    pub percentage: u8,
    pub status: u8,
    pub estimated_completion: i64,
}

#[account]
pub struct Project {
    pub owner: Pubkey,
    /// Max length MAX_NAME_LEN
    pub name: String,
    /// Max length MAX_DESCRIPTION_LEN
    pub description: String,
    pub funding_target: u64,
    /// Project's USDC vault (ATA, authority = project PDA)
    pub vault: Pubkey,
    /// Participation token mint for this project
    pub participation_mint: Pubkey,
    pub bump: u8,
    /// Number of milestones (0..=MAX_MILESTONES)
    pub milestone_count: u8,
    /// Fixed-capacity milestones; only first `milestone_count` are valid
    pub milestones: [Milestone; MAX_MILESTONES],
    /// How many milestones have had capital released
    pub released_milestone_count: u8,
    pub stage: u8,
    /// Max length MAX_PROJECT_CODE_LEN
    pub project_code: String,
    /// Max length MAX_URL_LEN
    pub image_url: String,
    /// Max length MAX_LOCATION_LEN
    pub location_name: String,
    /// Latitude in microdegrees (degrees × 1_000_000)
    pub geo_lat: i64,
    /// Longitude in microdegrees (degrees × 1_000_000)
    pub geo_lng: i64,
    pub total_capital_raised: u64,
    /// Builder PDA for the project owner
    pub builder: Pubkey,
    /// Max length MAX_VISION_LEN
    pub vision: String,
    /// Max length MAX_THESIS_LEN
    pub investment_thesis: String,
    /// Max length MAX_URL_LEN
    pub program_rules_url: String,
    /// Max length MAX_URL_LEN
    pub project_docs_url: String,
    /// Max length MAX_URL_LEN
    pub milestones_docs_url: String,
    pub duration_days: u64,
    pub risk_level: u8,
    /// Target return in basis points (100 = 1%)
    pub target_return_bps: u16,
}

impl Project {
    pub const LEN: usize = 8
        + 32
        + (4 + MAX_NAME_LEN)
        + (4 + MAX_DESCRIPTION_LEN)
        + 8
        + 32
        + 32
        + 1
        + 1
        + (MAX_MILESTONES * (32 + 1 + 1 + 8))
        + 1
        + 1
        + (4 + MAX_PROJECT_CODE_LEN)
        + (4 + MAX_URL_LEN)
        + (4 + MAX_LOCATION_LEN)
        + 8
        + 8
        + 8
        + 32
        + (4 + MAX_VISION_LEN)
        + (4 + MAX_THESIS_LEN)
        + (4 + MAX_URL_LEN)
        + (4 + MAX_URL_LEN)
        + (4 + MAX_URL_LEN)
        + 8
        + 1
        + 2;
}
