# Escrow

## Purpose
The escrow or structured funding module ensures capital is released in stages rather than transferred blindly upfront. This is a critical trust mechanism in BuilderOS.

## Why It Matters
Construction risk is execution risk. If funds are released all at once:
- investors lose visibility and control
- builders face less accountability
- trust depends on manual coordination

Milestone-based payments solve this by connecting capital release to actual delivery progress.

## Capital States
- Committed
- Locked
- Released
- Completed
- Refunded or Disputed

## Release Structure
Capital is released in stages tied to construction milestones such as:
- Foundation
- Structure
- Finishing

Each stage has:
- a release amount
- a completion condition
- a status
- a timestamped history

## Core Responsibilities
- Record investor commitments
- Hold capital in protected state
- Associate funds with milestones
- Release capital in stages
- Log every release event transparently

## MVP Scope
- Investor can commit capital
- Platform shows capital as locked
- Project has milestone-based release schedule
- One milestone can be approved in the demo
- Release updates dashboard and project state

## Approval Models
### Manual Approval
Release occurs after investor or admin validation.

### Rule-Based Approval
Release occurs automatically once conditions are satisfied.

## Blockchain Leverage
This is one of the strongest blockchain insertion points:
- programmable release logic
- transparent payment history
- reduced reliance on intermediaries
- auditable payout state

## Trust Questions This Module Must Answer
- How much money is committed?
- How much is still locked?
- What unlocks the next release?
- How much has already been paid?
- What happens if delivery fails?

## Demo Narrative
Investor funds project → funds appear as locked → builder completes milestone → release happens → dashboard shows new capital state.
