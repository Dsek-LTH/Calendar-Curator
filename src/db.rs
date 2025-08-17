use crate::processing::rule::Rule;
use std::collections::{HashMap, HashSet};
use std::sync::LazyLock;
use tokio::sync::Mutex;
use uuid::Uuid;

static URL_TO_ID: LazyLock<Mutex<HashMap<String, String>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));
static RULES: LazyLock<Mutex<HashMap<String, HashMap<String, Rule>>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

static MANUAL_BLOCKS: LazyLock<Mutex<HashMap<String, HashSet<String>>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

pub async fn get_url_from_id(id: &str) -> Option<String> {
    URL_TO_ID.lock().await.get(id).cloned()
}

pub async fn add_url_id_mapping(url: String, id: String) {
    URL_TO_ID.lock().await.insert(id, url);
}

// Rule management

pub async fn add_rule(calendar_id: String, rule: Rule) -> String {
    let id = Uuid::new_v4().to_string();
    let mut rules = RULES.lock().await;
    let entry = rules.entry(calendar_id).or_insert_with(HashMap::new);
    entry.insert(id.clone(), rule);
    id
}

pub async fn list_rules(calendar_id: &str) -> Option<HashMap<String, Rule>> {
    let rules = RULES.lock().await;
    rules.get(calendar_id).cloned()
}

pub async fn get_rule(calendar_id: &str, rule_id: &str) -> Option<Rule> {
    let rules = RULES.lock().await;
    rules
        .get(calendar_id)
        .and_then(|rules| rules.get(rule_id))
        .cloned()
}

pub async fn update_rule(calendar_id: &str, rule_id: &str, rule: Rule) -> bool {
    let mut rules = RULES.lock().await;
    if let Some(map) = rules.get_mut(calendar_id) {
        if let Some(existing_rule) = map.get_mut(&rule_id.to_string()) {
            *existing_rule = rule;
            return true;
        }
    }
    false
}

pub async fn delete_rule(calendar_id: &str, rule_id: &str) -> bool {
    let mut rules = RULES.lock().await;
    rules
        .get_mut(calendar_id)
        .and_then(|map| map.remove(rule_id))
        .is_some()
}

pub async fn add_manual_block(calendar_id: String, block: String) {
    let mut manual_blocks = MANUAL_BLOCKS.lock().await;
    let entry = manual_blocks
        .entry(calendar_id)
        .or_insert_with(HashSet::new);
    entry.insert(block);
}

pub async fn get_manual_blocks(calendar_id: &str) -> Option<HashSet<String>> {
    let manual_blocks = MANUAL_BLOCKS.lock().await;
    manual_blocks.get(calendar_id).cloned()
}

pub async fn remove_manual_block(calendar_id: &str, block: &str) -> bool {
    let mut manual_blocks = MANUAL_BLOCKS.lock().await;
    if let Some(blocks) = manual_blocks.get_mut(calendar_id) {
        blocks.remove(block);
        return true;
    }
    false
}
