use anchor_lang::prelude::*;

use super::{MAX_DESCRIPTION_LEN, MAX_NAME_LEN};

#[account]
pub struct Builder {
    pub owner: Pubkey,
    /// Max length MAX_NAME_LEN
    pub name: String,
    /// Max length MAX_DESCRIPTION_LEN
    pub description: String,
    pub is_kyb_verified: bool,
    pub bump: u8,
}

impl Builder {
    pub const LEN: usize = 8
        + 32
        + (4 + MAX_NAME_LEN)
        + (4 + MAX_DESCRIPTION_LEN)
        + 1
        + 1;
}
