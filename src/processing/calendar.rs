use crate::processing::ical::ICalendar;
use crate::processing::rule::Rule;

use crate::processing::event::Event;
use serde::Serialize;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct Calendar {
    pub ical: ICalendar,
    pub rules: Vec<Rule>,
    pub id: String,
    /// List of manually blocked event IDs.
    pub manually_blocked: Vec<String>,
}

impl Calendar {
    pub fn from_ical(ical: ICalendar) -> Self {
        Calendar {
            ical,
            rules: Vec::new(),
            id: Uuid::new_v4().to_string(),
            manually_blocked: Vec::new(),
        }
    }

    pub fn add_rule(&mut self, rule: Rule) {
        self.rules.push(rule);
    }

    pub fn remove_rule(&mut self, rule_id: String) {
        // self.rules.retain(|r| r.id != rule_id);
        todo!()
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
                for rule in &self.rules {
                    let (event, matched) = rule.apply(event.clone());
                    if matched {
                        return event;
                    }
                }
                Some(event.clone())
            })
            .collect()
    }

    pub fn get_events(&self) -> &Vec<Event> {
        &self.ical.events
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
