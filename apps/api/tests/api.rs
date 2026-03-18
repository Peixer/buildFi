use axum::body::Body;
use axum::http::{Request, StatusCode};
use buildfi_api::{app, MemoryStore, Store};
use http_body_util::BodyExt;
use std::sync::Arc;
use tower::ServiceExt;

async fn request(
    app: axum::Router,
    req: Request<Body>,
) -> (StatusCode, String) {
    let response = app.oneshot(req).await.unwrap();
    let status = response.status();
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8(body.to_vec()).unwrap();
    (status, body_str)
}

#[tokio::test]
async fn health_returns_ok() {
    let store: Store = Arc::new(MemoryStore::new());
    let app = app(store);
    let req = Request::builder()
        .uri("/health")
        .body(Body::empty())
        .unwrap();
    let (status, body) = request(app, req).await;
    assert_eq!(status.as_u16(), 200);
    assert!(body.contains("\"status\":\"ok\""));
}

#[tokio::test]
async fn list_projects_empty() {
    let store: Store = Arc::new(MemoryStore::new());
    let app = app(store);
    let req = Request::builder()
        .uri("/projects")
        .body(Body::empty())
        .unwrap();
    let (status, body) = request(app, req).await;
    assert_eq!(status.as_u16(), 200);
    assert_eq!(body, "[]");
}

#[tokio::test]
async fn create_and_get_project() {
    let store: Store = Arc::new(MemoryStore::new());
    let app = app(store);
    let body = serde_json::json!({
        "name": "Test Project",
        "description": "A test",
        "funding_target": 100_000,
        "escrow_treasury_address": "So11111111111111111111111111111111111111112",
        "milestones": [
            { "name": "Foundation", "percentage": 50 },
            { "name": "Finishing", "percentage": 50 }
        ]
    });
    let create_req = Request::builder()
        .method("POST")
        .uri("/projects")
        .header("Content-Type", "application/json")
        .body(Body::from(body.to_string()))
        .unwrap();
    let (create_status, create_body) = request(app.clone(), create_req).await;
    assert_eq!(create_status.as_u16(), 201);
    let project: serde_json::Value = serde_json::from_str(&create_body).unwrap();
    let id = project["id"].as_str().unwrap();

    let get_req = Request::builder()
        .uri(format!("/projects/{}", id))
        .body(Body::empty())
        .unwrap();
    let (get_status, get_body) = request(app, get_req).await;
    assert_eq!(get_status.as_u16(), 200);
    let got: serde_json::Value = serde_json::from_str(&get_body).unwrap();
    assert_eq!(got["name"], "Test Project");
    assert_eq!(got["id"], id);
}
