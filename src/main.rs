use crate::api::routes;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

mod api;
mod db;
mod error;
mod processing;
mod upstream;
mod utils;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let socket_address: SocketAddr = "0.0.0.0:8000".parse().unwrap();
    let listener = tokio::net::TcpListener::bind(socket_address).await?;

    let cors = CorsLayer::new()
        .allow_origin(Any) // allow any origin, or specify your frontend URL
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers(Any); // or list specific headers
    let app = axum::Router::new().merge(routes::router()).layer(cors);

    axum::serve(listener, app.into_make_service()).await

    // let str = get_calendar(Url::parse("https://cloud.timeedit.net/lu/web/lth1/ri6X80g51560Y2QQ95Z59X0Y0Yy5002495967Q564f596Z53X04Y55545761924X5595951539X54444399XQ55X554X676349yZoXy1u6beZnQQ90Z.ics")?).await;
    // match str {
    //     Ok(calendar) => println!("{}", calendar.to_string()),
    //     Err(e) => eprintln!("Error fetching calendar: {}", e),
    // };
    // Ok(())
}
