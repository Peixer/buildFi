mod health;

use axum::{routing::get, Router};
use crate::handlers::{create_project, get_project, list_projects, update_project};
use crate::store::Store;

pub fn router(store: Store) -> Router {
    Router::new()
        .route("/health", get(health::health))
        .route("/projects", get(list_projects).post(create_project))
        .route("/projects/:id", get(get_project).patch(update_project))
        .with_state(store)
}
