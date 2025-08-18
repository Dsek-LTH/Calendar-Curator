pub(crate) use crate::processing::calendar::Calendar;
use crate::processing::ical::ICalendar;
use crate::processing::rule::Rule;
use crate::upstream;
use std::collections::{HashMap, HashSet};
use std::sync::LazyLock;
use tokio::sync::Mutex;
use uuid::Uuid;

static CALENDARS: LazyLock<Mutex<HashMap<String, Calendar>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub async fn add_calendar(mut calendar: Calendar) -> String {
    let id = calendar.id.clone();
    // We don't want to store all events in the DB, just the calendar metadata
    calendar.ical = ICalendar::default();
    CALENDARS.lock().await.insert(id.clone(), calendar);
    id
}

pub async fn get_calendar(id: &str) -> Option<Calendar> {
    let calendars = CALENDARS.lock().await;
    // Populate the calendar with the iCal
    let Some(mut calendar) = calendars.get(id).cloned() else {
        return None;
    };
    if let Ok(fresh_ical) = upstream::get_icalendar(&calendar.url).await {
        calendar.ical = fresh_ical;
    }
    Some(calendar)
}
pub async fn get_url_from_id(id: &str) -> Option<String> {
    let calendars = CALENDARS.lock().await;
    calendars.get(id).map(|cal| cal.url.clone())
}

// Rule management

pub async fn add_rule(calendar_id: String, mut rule: Rule) -> Option<String> {
    rule.id = Uuid::new_v4().to_string();
    let mut calendars = CALENDARS.lock().await;
    let calendar = calendars.get_mut(&calendar_id)?;

    let id = rule.id.clone();
    calendar.add_rule(rule);
    Some(id)
}

pub async fn list_rules(calendar_id: &str) -> Option<Vec<Rule>> {
    CALENDARS
        .lock()
        .await
        .get(calendar_id)
        .map(|cal| cal.rules.clone())
}

pub async fn get_rule(calendar_id: &str, rule_id: &str) -> Option<Rule> {
    let calendars = CALENDARS.lock().await;
    calendars.get(calendar_id).and_then(|calendar| {
        calendar
            .rules
            .iter()
            .find(|rule| rule.id == rule_id)
            .cloned()
    })
}

pub async fn update_rule(calendar_id: &str, rule_id: &str, rule: Rule) -> bool {
    let mut calendars = CALENDARS.lock().await;
    if let Some(calendar) = calendars.get_mut(calendar_id) {
        if let Some(existing_rule) = calendar.rules.iter_mut().find(|rule| rule.id == rule_id) {
            *existing_rule = rule;
            return true;
        }
    }
    false
}

pub async fn delete_rule(calendar_id: &str, rule_id: &str) {
    let mut calendars = CALENDARS.lock().await;
    if let Some(calendar) = calendars.get_mut(calendar_id) {
        calendar.rules.retain(|rule| rule.id != rule_id);
    }
}

pub async fn reorder_rules(calendar_id: &str, rule_ids: Vec<String>) -> bool {
    let mut calendars = CALENDARS.lock().await;
    if let Some(calendar) = calendars.get_mut(calendar_id) {
        // Create a map of rule_id to rule for quick lookup
        let rule_map: HashMap<String, Rule> = calendar
            .rules
            .iter()
            .map(|rule| (rule.id.clone(), rule.clone()))
            .collect();

        // Rebuild the rules vector in the new order
        let mut new_rules = Vec::new();
        for rule_id in rule_ids {
            if let Some(rule) = rule_map.get(&rule_id) {
                new_rules.push(rule.clone());
            }
        }

        // Only update if we have the same number of rules (no rules lost)
        if new_rules.len() == calendar.rules.len() {
            calendar.rules = new_rules;
            return true;
        }
    }
    false
}

pub async fn add_manual_block(calendar_id: String, block: String) {
    let mut calendars = CALENDARS.lock().await;
    if let Some(calendar) = calendars.get_mut(&calendar_id) {
        calendar.manually_blocked.insert(block);
    }
}

pub async fn get_manual_blocks(calendar_id: &str) -> Option<HashSet<String>> {
    let calendars = CALENDARS.lock().await;
    Some(calendars.get(calendar_id)?.manually_blocked.clone())
}

pub async fn remove_manual_block(calendar_id: &str, block: &str) -> bool {
    let mut calendars = CALENDARS.lock().await;
    if let Some(calendar) = calendars.get_mut(calendar_id) {
        calendar.manually_blocked.remove(block);
        return true;
    }
    false
}
