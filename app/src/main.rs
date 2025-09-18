use crate::api::routes;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};

mod api;
mod db;
mod error;
mod processing;
mod upstream;
mod utils;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    // Get database path from environment variable or use default
    let db_path = std::env::var("DATABASE_PATH").unwrap_or_else(|_| "calendars.json".to_string());

    // Create shared database instance
    let db_state = db::create_db_instance(db_path).await;

    // Start background task to clean up old calendars
    start_calendar_cleanup_task(Arc::clone(&db_state));

    let socket_address: SocketAddr = "0.0.0.0:8000".parse().unwrap();
    let listener = tokio::net::TcpListener::bind(socket_address).await?;

    let cors = CorsLayer::new()
        .allow_origin(Any) // allow any origin, or specify your frontend URL
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
            axum::http::Method::PUT,
        ])
        .allow_headers(Any); // or list specific headers

    let app = axum::Router::new()
        .merge(routes::router())
        .with_state(db_state)
        .layer(cors);

    println!("Calendar Curator backend starting on {}", socket_address);
    axum::serve(listener, app.into_make_service()).await
}

fn start_calendar_cleanup_task(db_state: Arc<Mutex<db::Db>>) {
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(100 * 60 * 60)).await;

            // Clean up calendars that haven't been accessed in a week
            let mut db = db_state.lock().await;
            let removed_ids = db.cleanup_old_calendars().await;

            if !removed_ids.is_empty() {
                println!(
                    "Cleaned up {} calendars that haven't been accessed in a week",
                    removed_ids.len()
                );
            }
        }
    });
}
