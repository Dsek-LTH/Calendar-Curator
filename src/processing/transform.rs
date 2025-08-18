use crate::utils::DateFormat;
use chrono::Duration;
use serde::{Deserialize, Serialize};
use std::fmt::Debug;
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum Transform {
    StringTransform(StringTransform),
    DateTransform(DateTransform),
}

impl Transform {
    pub fn apply(&self, input: &str) -> String {
        match self {
            Transform::StringTransform(transform) => transform.apply(input),
            Transform::DateTransform(_) => input.to_string(), // DateTransform is not applicable to string input
        }
    }

    pub fn apply_date(&self, date: &DateFormat) -> DateFormat {
        match self {
            Transform::StringTransform(_) => date.clone(), // StringTransform is not applicable to DateFormat
            Transform::DateTransform(transform) => transform.apply(date),
        }
    }
}

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub enum StringTransform {
    Substitute {
        from: String,
        to: String,
    },
    Suffix {
        suffix: String,
    },
    Prefix {
        prefix: String,
    },
    RegexSubstitute {
        pattern: String,
        replacement: String,
    },
    Replace {
        with: String,
    },
    Substring {
        start: usize,
        end: usize,
    },
    Remove,
}

impl StringTransform {
    fn apply(&self, input: &str) -> String {
        match self {
            StringTransform::Substitute { from, to } => input.replace(from, to),
            StringTransform::Suffix { suffix } => format!("{}{}", input, suffix),
            StringTransform::Prefix { prefix } => format!("{}{}", prefix, input),
            StringTransform::RegexSubstitute {
                pattern,
                replacement,
            } => regex::Regex::new(pattern)
                .map(|re| re.replace_all(input, replacement).to_string())
                .unwrap_or_else(|_| input.to_string()),
            StringTransform::Replace { with } => with.clone(),
            StringTransform::Substring { start, end } => {
                input.get(*start..*end).unwrap_or("").to_string()
            }
            StringTransform::Remove => String::new(),
        }
    }
}

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub enum DateTransform {
    AddDays { days: i64 },
    SubtractDays { days: i64 },
}

impl DateTransform {
    fn apply(&self, date: &DateFormat) -> DateFormat {
        match date {
            DateFormat::DateTime(dt) => {
                let new_dt = match self {
                    DateTransform::AddDays { days } => *dt + Duration::days(*days),
                    DateTransform::SubtractDays { days } => *dt - Duration::days(*days),
                };
                DateFormat::DateTime(new_dt)
            }
            DateFormat::Date(date) => {
                let new_date = match self {
                    DateTransform::AddDays { days } => *date + Duration::days(*days),
                    DateTransform::SubtractDays { days } => *date - Duration::days(*days),
                };
                DateFormat::Date(new_date)
            }
        }
    }
}
