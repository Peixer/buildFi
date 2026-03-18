// Reserved for future use (e.g. program config, upgrade). Currently a no-op.
use anchor_lang::prelude::*;

pub fn handler(_ctx: Context<crate::Initialize>) -> Result<()> {
    Ok(())
}
