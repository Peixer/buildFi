mod config;
mod error;
mod handlers;
mod models;
mod routes;
mod store;

pub use config::Config;
pub use store::{MemoryStore, PostgresStore, Store};

use axum::Router;

pub fn app(store: Store) -> Router {
    routes::router(store)
}
