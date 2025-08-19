use crate::processing::event::Event;
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
    Exact,
    Contains,
    StartsWith,
    EndsWith,
    Regex,
    BetweenDates, // Matches events between two dates
}

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub struct Matcher {
    id: String,
    field: Field,
    match_type: MatchType,
    value: String,
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
            MatchType::Exact => value == &*self.value,
            MatchType::Contains => value.contains(&*self.value),
            MatchType::StartsWith => value.starts_with(&*self.value),
            MatchType::EndsWith => value.ends_with(&*self.value),
            MatchType::Regex => regex::Regex::new(&*self.value)
                .map(|re| re.is_match(value))
                .unwrap_or(false),
            MatchType::BetweenDates => false,
        }
    }

    fn matches_date(&self, date: &Option<DateFormat>) -> bool {
        // TODO Implement date matching logic
        true
    }
}
