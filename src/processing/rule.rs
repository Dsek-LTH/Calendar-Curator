use crate::processing::action::Action;
use crate::processing::event::Event;
use crate::processing::filter::Filter;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub struct Rule {
    pub filter: Filter,
    pub action: Action,
}

impl Rule {
    pub fn new(filter: Filter, action: Action) -> Self {
        Self { filter, action }
    }

    /// Applies the rule to an event.
    ///
    /// @returns A tuple containing:
    /// - An `Option<Event>` which is `None` if the event was blocked or transformed, or `Some(event)` if it was allowed.
    /// - A `bool` indicating whether the event was affected by the rule (i.e., whether it was blocked or transformed).
    pub fn apply(&self, event: Event) -> (Option<Event>, bool) {
        if self.filter.matches(&event) {
            (self.action.apply(event), true)
        } else {
            (Some(event), false)
        }
    }
}
