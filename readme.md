# BuildFi

**BuildFi** is a programmable stablecoin escrow protocol for construction financing on Solana.

This MVP is designed for hackathon execution and demonstrates how stablecoins can be used to fund real-world construction projects through milestone-based releases. Instead of representing real estate ownership on-chain, the protocol issues a **proof-of-participation / discount token** that can later be redeemed for special commercial benefits defined by the builder, such as priority access or preferential pricing.

## Vision

Construction financing is often opaque, centralized, and risky for buyers and small investors. BuildFi proposes a simpler model:

- builders create projects with funding goals and milestones
- users deposit USDC into a project escrow
- funds stay locked until milestones are approved
- each deposit mints a participation token
- the participation token does **not** represent legal ownership of the property
- the participation token may grant access to a special commercial discount or priority condition defined off-chain

This hackathon MVP focuses on the **core programmable payment flow**.

---

# Core MVP Flow

## 1. Builder creates a project
A builder creates a construction project with:

- project name
- description
- funding target
- escrow treasury address
- milestone list
- milestone percentages

Example:

- Foundation — 30%
- Structure — 40%
- Finishing — 30%

## 2. User deposits USDC
A user deposits USDC into the project escrow.

In return, the protocol mints a **Participation Token** that acts as:

- proof that the user contributed to the project
- proof of eligibility for a special discount / access condition defined by the builder
- non-equity utility artifact for the MVP

Important:

- the token is **not** a deed
- the token is **not** a real estate share
- the token is **not** a legal claim over the property
- the token is **not** an RWA representation

## 3. Milestone is approved
Once a milestone is approved, the escrow releases part of the USDC to the builder according to the milestone percentage.

## 4. Project progresses
This repeats until all milestones are approved and all funds are released.

---

# Product Scope

This repository is intentionally focused on a **hackathon MVP**.

## Included in MVP

- landing page
- explore projects page
- create project page
- project details page
- deposit USDC flow
- mint participation token
- approve milestone flow
- release escrowed funds
- simple admin / builder controls
- Solana smart contract with Anchor
- backend service in Rust for indexing / API support if needed

## Out of Scope for MVP

- legal property tokenization
- real-world title registration
- full RWA framework
- advanced KYC / AML
- decentralized oracle network
- secondary market
- investor accreditation checks
- fiat on/off-ramp
- production-grade compliance stack

---

# Monorepo Structure

```txt
buildfi/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # Optional Rust backend API/indexer
│
├── programs/
│   └── buildfi/              # Anchor smart contract
│
├── packages/
│   ├── ui/                   # Shared UI components
│   ├── config/               # Shared tsconfig/eslint/prettier/tailwind config
│   ├── sdk/                  # TypeScript SDK for interacting with Anchor program
│   └── types/                # Shared types/interfaces
│
├── scripts/                  # Dev scripts, seed scripts, localnet helpers
├── tests/                    # Integration / e2e tests
├── docs/                     # Product docs, architecture docs, pitch docs
├── .github/                  # CI workflows
├── Anchor.toml
├── Cargo.toml
├── package.json
├── turbo.json
└── README.md