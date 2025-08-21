use crate::processing::ical::ICalendar;
use crate::processing::rule::Rule;
use std::collections::HashSet;

use crate::processing::event::Event;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct Calendar {
    pub ical: ICalendar,
    /// Hashmap of rules applied to this calendar. The key is the rule ID.
    pub rules: Vec<Rule>,
    pub id: String,
    pub url: String,
    /// List of manually blocked event IDs.
    pub manually_blocked: HashSet<String>,
    /// List of manually allowlisted event IDs (immune from rule blocking).
    pub manually_allowlisted: HashSet<String>,
}

impl Calendar {
    pub fn from_ical(url: String, ical: ICalendar) -> Self {
        Calendar {
            ical,
            rules: Vec::new(),
            id: Uuid::new_v4().to_string(),
            url,
            manually_blocked: HashSet::new(),
            manually_allowlisted: HashSet::new(),
        }
    }

    pub fn add_rule(&mut self, rule: Rule) {
        self.rules.push(rule);
    }

    pub fn get_events_for_proxy(&self) -> Vec<Event> {
        self.ical
            .events
            .iter()
            .filter(|&event| {
                // Check if the event is manually blocked
                !self.manually_blocked.contains(&event.uid)
            })
            .filter_map(|event| {
                let manually_allowlisted = self.manually_allowlisted.contains(&event.uid);
                let mut prev_event = event.clone();
                for rule in &self.rules {
                    let (event, _) = rule.apply(prev_event.clone());
                    if let Some(event) = event {
                        prev_event = event
                    } else {
                        if manually_allowlisted {
                            // Make sure to not return None
                            return Some(prev_event);
                        }
                        return None;
                    }
                }
                Some(prev_event.clone())
            })
            .collect()
    }

    pub fn get_events(self) -> Vec<Event> {
        self.ical.events
    }

    pub fn get_filtered_icalendar(&self) -> ICalendar {
        // To prevent cloning the events
        ICalendar {
            description: self.ical.description.clone(),
            events: self.get_events_for_proxy(),
            name: self.ical.name.clone(),
            version: self.ical.version.clone(),
            method: self.ical.method.clone(),
            prodid: self.ical.prodid.clone(),
            calscale: self.ical.calscale.clone(),
            published_ttl: self.ical.published_ttl.clone(),
        }
    }
}
