use crate::processing::calendar::Calendar;
use crate::processing::ical::ICalendar;
use reqwest::{Client, IntoUrl};
use std::error::Error;

pub async fn get_calendar(url: impl IntoUrl) -> Result<Calendar, Box<dyn Error>> {
    let client = Client::new();

    let response = client.get(url).send().await?.text().await?;

    Ok(Calendar::from_ical(ICalendar::from_string(&response)?))
}
