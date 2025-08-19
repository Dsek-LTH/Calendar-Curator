use crate::processing::event::Event;
use serde::Serialize;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct EventResponse {
    #[serde(flatten)]
    pub event: Event,
    pub blocked: bool,
    /// List of rule IDs that matched this event.
    pub filtered_by: Vec<String>,
}
