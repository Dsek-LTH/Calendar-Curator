use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use crate::processing::filter::Filter;
use crate::processing::transform::Action;

#[derive(Clone, Debug, ToSchema, Serialize, Deserialize)]
pub struct Rule {
    pub filter: Filter,
    pub action: Action,
}

impl Rule {
    pub fn new(filter: Filter, action: Action) -> Self {
        Self { filter, action }
    }

    pub fn apply(&self, event: &crate::processing::processing::Event) -> Option<Action> {
        todo!()
    }
}