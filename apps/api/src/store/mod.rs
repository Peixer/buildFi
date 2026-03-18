mod memory;
mod postgres;

pub use memory::MemoryStore;
pub use postgres::PostgresStore;

use crate::error::AppError;
use crate::models::{CreateProjectRequest, Project, UpdateProjectRequest};
use async_trait::async_trait;
use std::sync::Arc;

#[async_trait]
pub trait ProjectStore: Send + Sync {
    async fn list(&self) -> Result<Vec<Project>, AppError>;
    async fn get(&self, id: &str) -> Result<Option<Project>, AppError>;
    async fn create(&self, req: CreateProjectRequest) -> Result<Project, AppError>;
    async fn update(&self, id: &str, req: UpdateProjectRequest) -> Result<Option<Project>, AppError>;
}

pub type Store = Arc<dyn ProjectStore>;
