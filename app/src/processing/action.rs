use crate::processing::event::Event;
use crate::processing::matcher::Field;
use crate::processing::transform::Transform;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub enum Action {
    FieldTransform(FieldTransform),
    Block,
    Allow,
}

#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct FieldTransform {
    pub field: Field,
    pub transform: Transform,
}

impl FieldTransform {
    pub fn apply(&self, mut event: Event) -> Event {
        match self.field {
            Field::Title => event.summary = self.transform.apply(&event.summary),
            Field::Description => event.description = self.transform.apply(&event.description),
            Field::Location => event.location = self.transform.apply(&event.location),
            Field::StartTime => {
                if let Some(start) = &mut event.start {
                    *start = self.transform.apply_date(start);
                }
            }
            Field::EndTime => {
                if let Some(end) = &mut event.end {
                    *end = self.transform.apply_date(end);
                }
            }
        };

        event
    }
}

impl Action {
    pub fn apply(&self, mut event: Event) -> Option<Event> {
        match self {
            Action::FieldTransform(field_transform) => {
                event = field_transform.apply(event);
                Some(event)
            }
            Action::Block => None,
            Action::Allow => Some(event),
        }
    }
}
