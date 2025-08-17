use std::net::SocketAddr;

mod api;
mod processing;
mod upstream;
mod error;
mod utils;
mod db;

#[tokio::main]
async fn main() -> std::io::Result<()> {
    let socket_address: SocketAddr = "127.0.0.1:3000".parse().unwrap();
    let listener = tokio::net::TcpListener::bind(socket_address).await?;

    let app = axum::Router::new().merge(api::router());

    axum::serve(listener, app.into_make_service())
        .await


    // let str = get_calendar(Url::parse("https://cloud.timeedit.net/lu/web/lth1/ri6X80g51560Y2QQ95Z59X0Y0Yy5002495967Q564f596Z53X04Y55545761924X5595951539X54444399XQ55X554X676349yZoXy1u6beZnQQ90Z.ics")?).await;
    // match str {
    //     Ok(calendar) => println!("{}", calendar.to_string()),
    //     Err(e) => eprintln!("Error fetching calendar: {}", e),
    // };
    // Ok(())
}
