use crate::error::SyntaxError;
use chrono::{DateTime, NaiveDate, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::openapi::{RefOr, Schema, Type};
use utoipa::{PartialSchema, ToSchema};

#[derive(Debug, Clone, PartialEq)]
pub enum DateFormat {
    DateTime(DateTime<Utc>),
    Date(NaiveDate),
}

impl DateFormat {
    pub fn to_ical_str(&self) -> String {
        match self {
            DateFormat::DateTime(dt) => format!(":{}", dt.format("%Y%m%dT%H%M%SZ")),
            DateFormat::Date(date) => format!(";VALUE=DATE:{}", date.format("%Y%m%d")),
        }
    }

    pub fn to_formatted_string(&self) -> String {
        match self {
            DateFormat::DateTime(dt) => dt.to_rfc3339(),
            DateFormat::Date(date) => date.to_string(),
        }
    }
}

impl Serialize for DateFormat {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let date_str = self.to_formatted_string();
        serializer.serialize_str(&date_str)
    }
}

impl<'de> Deserialize<'de> for DateFormat {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        let date_str = String::deserialize(deserializer)?;
        parse_datetime(&date_str).map_err(serde::de::Error::custom)
    }
}

impl PartialSchema for DateFormat {
    fn schema() -> RefOr<Schema> {
        utoipa::openapi::schema::ObjectBuilder::new()
            .schema_type(Type::String)
            .build()
            .into()
    }
}

impl ToSchema for DateFormat {}

pub fn parse_datetime(date_str: &str) -> Result<DateFormat, SyntaxError> {
    if date_str.starts_with(":") {
        NaiveDateTime::parse_from_str(&date_str[1..], "%Y%m%dT%H%M%S%Z")
            .map(|dt| DateFormat::DateTime(DateTime::from_naive_utc_and_offset(dt, Utc)))
            .map_err(|e| SyntaxError::new(format!("Invalid date format: {}", e), None))
    } else if date_str.starts_with(";VALUE=DATE:") {
        NaiveDate::parse_from_str(&date_str[12..], "%Y%m%d")
            .map(|dt| DateFormat::Date(dt))
            .map_err(|e| SyntaxError::new(format!("Invalid date format: {}", e), None))
    } else {
        Err(SyntaxError::new(
            format!("Invalid date format: {}", date_str),
            None,
        ))
    }
}
