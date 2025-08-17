use std::collections::HashMap;
use std::sync::LazyLock;
use tokio::sync::Mutex;

static URL_TO_ID: LazyLock<Mutex<HashMap<String,String>>> = LazyLock::new(|| Mutex::new(HashMap::new()));

pub async fn get_url_from_id(id: &str) -> Option<String> {
    URL_TO_ID.lock().await.get(id).cloned()
}

pub async fn add_url_id_mapping(url: String, id: String) {
    URL_TO_ID.lock().await.insert(id, url);
}