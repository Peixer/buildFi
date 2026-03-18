use super::ProjectStore;
use crate::error::AppError;
use crate::models::{CreateProjectRequest, Milestone, Project, UpdateProjectRequest};
use async_trait::async_trait;
use sqlx::postgres::PgQueryResult;
use sqlx::types::Json;
use sqlx::{FromRow, PgPool, Pool, Postgres};
use uuid::Uuid;

pub struct PostgresStore {
    pool: PgPool,
}

#[derive(FromRow)]
struct ProjectRow {
    id: String,
    name: String,
    description: String,
    funding_target: i64,
    escrow_treasury_address: String,
    milestones: Json<Vec<Milestone>>,
}

impl PostgresStore {
    pub async fn connect(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = Pool::<Postgres>::connect(database_url).await?;
        match sqlx::migrate!().run(&pool).await {
            Ok(_) => {
                tracing::info!("Database migrations completed successfully");
            }
            Err(e) => {
                tracing::error!("Database migrations failed: {}", e);
                return Err(e.into());
            }
        }
        Ok(PostgresStore { pool })
    }

    fn row_to_project(row: ProjectRow) -> Result<Project, AppError> {
        let funding_target = u64::try_from(row.funding_target)
            .map_err(|_| AppError::Internal("invalid funding_target in database".into()))?;
        Ok(Project {
            id: row.id,
            name: row.name,
            description: row.description,
            funding_target,
            escrow_treasury_address: row.escrow_treasury_address,
            milestones: row.milestones.0,
        })
    }
}

#[async_trait]
impl ProjectStore for PostgresStore {
    async fn list(&self) -> Result<Vec<Project>, AppError> {
        let rows = sqlx::query_as::<_, ProjectRow>(
            "SELECT id, name, description, funding_target, escrow_treasury_address, milestones FROM projects",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
        rows.into_iter().map(Self::row_to_project).collect()
    }

    async fn get(&self, id: &str) -> Result<Option<Project>, AppError> {
        let row = sqlx::query_as::<_, ProjectRow>(
            "SELECT id, name, description, funding_target, escrow_treasury_address, milestones FROM projects WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
        row.map(Self::row_to_project).transpose()
    }

    async fn create(&self, req: CreateProjectRequest) -> Result<Project, AppError> {
        let id = Uuid::new_v4().to_string();
        let funding_target = req.funding_target as i64;
        let milestones = Json(req.milestones.clone());
        sqlx::query(
            "INSERT INTO projects (id, name, description, funding_target, escrow_treasury_address, milestones) VALUES ($1, $2, $3, $4, $5, $6)",
        )
        .bind(&id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(funding_target)
        .bind(&req.escrow_treasury_address)
        .bind(&milestones)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
        Ok(Project::from_create(id, req))
    }

    async fn update(&self, id: &str, req: UpdateProjectRequest) -> Result<Option<Project>, AppError> {
        let project = match self.get(id).await? {
            Some(p) => p,
            None => return Ok(None),
        };
        let name = req.name.unwrap_or(project.name);
        let description = req.description.unwrap_or(project.description);
        let funding_target = req.funding_target.unwrap_or(project.funding_target) as i64;
        let escrow_treasury_address = req
            .escrow_treasury_address
            .unwrap_or(project.escrow_treasury_address);
        let milestones = Json(req.milestones.unwrap_or(project.milestones));
        let result: PgQueryResult = sqlx::query(
            "UPDATE projects SET name = $2, description = $3, funding_target = $4, escrow_treasury_address = $5, milestones = $6 WHERE id = $1",
        )
        .bind(id)
        .bind(&name)
        .bind(&description)
        .bind(funding_target)
        .bind(&escrow_treasury_address)
        .bind(&milestones)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?;
        if result.rows_affected() == 0 {
            return Ok(None);
        }
        let row = sqlx::query_as::<_, ProjectRow>(
            "SELECT id, name, description, funding_target, escrow_treasury_address, milestones FROM projects WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Internal(e.to_string()))?
        .ok_or_else(|| AppError::Internal("project not found after update".into()))?;
        Self::row_to_project(row).map(Some)
    }
}
