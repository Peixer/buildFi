use anchor_lang::prelude::*;

#[account]
pub struct Buyer {
    pub user: Pubkey,
    pub project: Pubkey,
    pub amount: u64,
}

impl Buyer {
    pub const LEN: usize = 8 + 32 + 32 + 8;
}
