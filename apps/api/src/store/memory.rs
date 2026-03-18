use super::ProjectStore;
use crate::error::AppError;
use crate::models::{CreateProjectRequest, Project, UpdateProjectRequest};
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::RwLock;
use uuid::Uuid;

pub struct MemoryStore {
    projects: RwLock<HashMap<String, Project>>,
}

impl MemoryStore {
    pub fn new() -> Self {
        Self {
            projects: RwLock::new(HashMap::new()),
        }
    }
}

impl Default for MemoryStore {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ProjectStore for MemoryStore {
    async fn list(&self) -> Result<Vec<Project>, AppError> {
        let guard = self.projects.read().map_err(|e| {
            AppError::Internal(format!("store lock poisoned: {}", e))
        })?;
        Ok(guard.values().cloned().collect())
    }

    async fn get(&self, id: &str) -> Result<Option<Project>, AppError> {
        let guard = self.projects.read().map_err(|e| {
            AppError::Internal(format!("store lock poisoned: {}", e))
        })?;
        Ok(guard.get(id).cloned())
    }

    async fn create(&self, req: CreateProjectRequest) -> Result<Project, AppError> {
        let id = Uuid::new_v4().to_string();
        let project = Project::from_create(id.clone(), req);
        let mut guard = self.projects.write().map_err(|e| {
            AppError::Internal(format!("store lock poisoned: {}", e))
        })?;
        guard.insert(id, project.clone());
        Ok(project)
    }

    async fn update(&self, id: &str, req: UpdateProjectRequest) -> Result<Option<Project>, AppError> {
        let mut guard = self.projects.write().map_err(|e| {
            AppError::Internal(format!("store lock poisoned: {}", e))
        })?;
        let Some(project) = guard.get_mut(id) else {
            return Ok(None);
        };
        if let Some(name) = req.name {
            project.name = name;
        }
        if let Some(description) = req.description {
            project.description = description;
        }
        if let Some(funding_target) = req.funding_target {
            project.funding_target = funding_target;
        }
        if let Some(escrow_treasury_address) = req.escrow_treasury_address {
            project.escrow_treasury_address = escrow_treasury_address;
        }
        if let Some(milestones) = req.milestones {
            project.milestones = milestones;
        }
        Ok(Some(project.clone()))
    }
}
