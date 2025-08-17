use chrono::Duration;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub enum Action {
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

impl Action {
    pub fn apply(&self, input: &str) -> String {
        match self {
            Action::Substitute { from, to } => input.replace(from, to),
            Action::Suffix { suffix } => format!("{}{}", input, suffix),
            Action::Prefix { prefix } => format!("{}{}", prefix, input),
            Action::RegexSubstitute { pattern, replacement } => {
                regex::Regex::new(pattern)
                    .map(|re| re.replace_all(input, replacement).to_string())
                    .unwrap_or_else(|_| input.to_string())
            }
            Action::Replace { with } => with.clone(),
            Action::Substring { start, end } => input.get(*start..*end).unwrap_or("").to_string(),
            Action::Remove => String::new(),
        }
    }
}

enum DateTransform {
    AddDays {
        days: i64,
    },
    SubtractDays {
        days: i64,
    },
}

impl DateTransform {
    pub fn apply(&self, date: &chrono::NaiveDate) -> chrono::NaiveDate {
        match self {
            DateTransform::AddDays { days } => date.checked_add_signed(Duration::days(*days)).unwrap_or(*date),
            DateTransform::SubtractDays { days } => date.checked_sub_signed(Duration::days(*days)).unwrap_or(*date),
        }
    }
}