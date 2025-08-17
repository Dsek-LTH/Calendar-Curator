use crate::processing::Calendar;
use reqwest::{Client, IntoUrl};
use std::error::Error;

pub async fn get_calendar(url: impl IntoUrl) -> Result<Calendar, Box<dyn Error>> {
    let client = Client::new();

    let response = client
        .get(url)
        .send()
        .await?
        .text()
        .await?;

    Calendar::from_string(&response)
}