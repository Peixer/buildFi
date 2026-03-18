# BuildFi Program

Anchor program for BuildFi: programmable stablecoin escrow for construction financing on Solana.

## Program layout

- **`src/state/`** — Account types and constants: `project.rs` (Project, Milestone, MAX_*), `buyer.rs` (Buyer).
- **`src/error.rs`** — Custom errors (`BuildFiError`).
- **`src/instructions/`** — One file per instruction with handler logic only: `initialize`, `create_project`, `deposit`, `release_capital`, `refund`, `delete_project`.
- **`src/lib.rs`** — Program ID, module wiring, `#[derive(Accounts)]` structs for all instructions, and `#[program]` that delegates to the instruction handlers.

## Instructions

- **`create_project`** — Create a new project (keypair), vault (ATA of project_authority PDA), and participation token mint. Caller is the owner. Milestones must sum to 100%.
- **`deposit`** — Buyer deposits USDC into the project vault and receives 1:1 participation tokens. Uses `init_if_needed` for the Buyer PDA.
- **`release_capital`** — Project owner releases the next milestone’s share of the vault to their USDC ATA. Amount = (vault balance × milestone percentage) / 100.
- **`refund`** — Buyer withdraws their full deposit and burns participation tokens. Allowed only when `released_milestone_count == 0`.
- **`delete_project`** — Owner closes the project. Allowed only when vault balance is 0 (refund or release all funds first). Closes vault, participation mint, and project account; rent goes to owner.

## Account shapes

- **Project** — Owner, name, description, funding_target, vault, participation_mint, bump (project_authority), milestone_count, milestones[], released_milestone_count.
- **Buyer** — user, project, amount (PDA: `["buyer", project, user]`).

## Listing projects

There is no on-chain “list all” instruction. Clients should use **`getProgramAccounts`** with a memcmp filter on the Program account discriminator for `Project` (first 8 bytes). Optionally filter by `owner` with a second memcmp on the owner offset.

Example (pseudo):

- Filter by account type: `memcmp: { offset: 0, bytes: <Project discriminator> }`
- Filter by owner: `memcmp: { offset: 8, bytes: <owner pubkey base58> }`

IDL is produced by `anchor build` and can be used by the TypeScript SDK for account decoding.

## Delete rules

- **delete_project** is allowed only when the vault’s USDC balance is 0.
- Empty the vault either by:
  - Releasing all capital to the owner (approve all milestones), or
  - Having all buyers refund before any milestone is released.

## Build and test

```bash
anchor build
anchor test
```

Program ID is in `Anchor.toml` and `declare_id!` in `lib.rs`.
