use axum::{
    extract::{Path, State},
    Json,
};
use crate::error::AppError;
use crate::models::{CreateProjectRequest, Project, UpdateProjectRequest};
use crate::store::Store;

pub async fn list_projects(State(store): State<Store>) -> Result<Json<Vec<Project>>, AppError> {
    let projects = store.list().await?;
    Ok(Json(projects))
}

pub async fn get_project(
    State(store): State<Store>,
    Path(id): Path<String>,
) -> Result<Json<Project>, AppError> {
    let project = store.get(&id).await?.ok_or_else(|| {
        AppError::NotFound(format!("project {}", id))
    })?;
    Ok(Json(project))
}

pub async fn create_project(
    State(store): State<Store>,
    Json(req): Json<CreateProjectRequest>,
) -> Result<(axum::http::StatusCode, Json<Project>), AppError> {
    let project = store.create(req).await?;
    Ok((axum::http::StatusCode::CREATED, Json(project)))
}

pub async fn update_project(
    State(store): State<Store>,
    Path(id): Path<String>,
    Json(req): Json<UpdateProjectRequest>,
) -> Result<Json<Project>, AppError> {
    let project = store.update(&id, req).await?.ok_or_else(|| {
        AppError::NotFound(format!("project {}", id))
    })?;
    Ok(Json(project))
}
