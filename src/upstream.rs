use crate::processing::ical::ICalendar;
use reqwest::Client;
use std::error::Error;

pub async fn get_icalendar(url: &str) -> Result<ICalendar, Box<dyn Error>> {
    let client = Client::new();

    let response = client.get(url).send().await?.text().await?;

    ICalendar::from_string(&response)
}
