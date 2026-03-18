use anchor_lang::prelude::*;

pub const MAX_NAME_LEN: usize = 64;
pub const MAX_DESCRIPTION_LEN: usize = 256;
pub const MAX_MILESTONES: usize = 10;

/// Single milestone: name (fixed 32 bytes) and percentage of total funding (0–100).
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Milestone {
    pub name: [u8; 32],
    pub percentage: u8,
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
        + (MAX_MILESTONES * (32 + 1))
        + 1;
}
