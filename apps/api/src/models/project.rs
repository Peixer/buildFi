use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Milestone {
    pub name: String,
    /// Percentage of total funding (0–100)
    pub percentage: u8,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    /// Funding target in USDC (or smallest unit)
    pub funding_target: u64,
    /// Escrow treasury address (placeholder until chain exists)
    pub escrow_treasury_address: String,
    pub milestones: Vec<Milestone>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: String,
    pub funding_target: u64,
    pub escrow_treasury_address: String,
    pub milestones: Vec<Milestone>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct UpdateProjectRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub funding_target: Option<u64>,
    pub escrow_treasury_address: Option<String>,
    pub milestones: Option<Vec<Milestone>>,
}

impl Project {
    pub fn from_create(id: String, req: CreateProjectRequest) -> Self {
        Self {
            id,
            name: req.name,
            description: req.description,
            funding_target: req.funding_target,
            escrow_treasury_address: req.escrow_treasury_address,
            milestones: req.milestones,
        }
    }
}
