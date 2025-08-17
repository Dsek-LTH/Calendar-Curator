use crate::processing::processing::Event;
use crate::utils::DateFormat;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub enum Field {
    Summary,
    Description,
    Location,
    StartDate,
    EndDate,
}

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub enum MatchType {
    Exact(String),
    Contains(String),
    StartsWith(String),
    EndsWith(String),
    Regex(String),
}

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub struct Matcher {
    field: Field,
    match_type: MatchType,
    negated: bool,
}

impl Matcher {
    pub fn matches(&self, event: &Event) -> bool {
        let bool = match self.field {
            Field::Summary => self.matches_string(&event.summary),
            Field::Description => self.matches_string(&event.description),
            Field::Location => self.matches_string(&event.location),
            Field::StartDate => self.matches_date(&event.start),
            Field::EndDate => self.matches_date(&event.end),
        };

        self.negated ^ bool
    }

    fn matches_string(&self, value: &str) -> bool {
        match &self.match_type {
            MatchType::Exact(s) => value == s,
            MatchType::Contains(s) => value.contains(s),
            MatchType::StartsWith(s) => value.starts_with(s),
            MatchType::EndsWith(s) => value.ends_with(s),
            MatchType::Regex(pattern) => regex::Regex::new(pattern)
                .map(|re| re.is_match(value))
                .unwrap_or(false),
        }
    }

    fn matches_date(&self, date: &Option<DateFormat>) -> bool {
        // TODO Implement date matching logic
        true
    }
}

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub struct Filter {
    /// Each inner vector represents a logical AND condition,
    /// while the outer vector represents a logical OR condition.
    matchers: Vec<Vec<Matcher>>,
}

impl Filter {
    pub fn matches(&self, event: &Event) -> bool {
        for matchers in &self.matchers {
            if matchers.iter().all(|matcher| matcher.matches(event)) {
                return true; // At least one set of matchers matched
            }
        }
        false // No match found
    }
}
