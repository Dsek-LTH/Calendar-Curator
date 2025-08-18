use crate::api::types::EventResponse;
use crate::processing::rule::Rule;
use crate::{db, upstream};
use axum::Json;
use axum::body::Body;
use axum::extract::Path;
use axum::http::{HeaderMap, StatusCode, header};
use axum::response::IntoResponse;
use serde::{Deserialize, Serialize};
use tokio_util::io::ReaderStream;
use utoipa::ToSchema;
use utoipa_axum::router::OpenApiRouter;
use utoipa_axum::routes;
use uuid;
use uuid::Uuid;

pub(crate) fn router() -> axum::Router {
    let (app_router, openapi) = OpenApiRouter::new()
        .routes(routes!(create_calendar))
        .routes(routes!(get_events))
        .routes(routes!(get_calendar_url))
        .routes(routes!(create_rule))
        .routes(routes!(list_rules))
        .routes(routes!(update_rule))
        .routes(routes!(delete_rule))
        .routes(routes!(get_rule))
        .routes(routes!(block_add))
        .routes(routes!(block_remove))
        .routes(routes!(block_list))
        .split_for_parts();
    app_router
        .route("/calendars/{id}/feed", axum::routing::get(get_feed))
        .route(
            "/openapi.json",
            axum::routing::get(move || async { Json(openapi) }),
        )
}

#[derive(Deserialize, ToSchema)]
pub struct CreateCalendar {
    url: String,
}

#[derive(Serialize, ToSchema)]
pub struct CreateCalendarResponse {
    id: String,
}

#[utoipa::path(
    post,
    path = "/calendars/create",
    request_body = CreateCalendar,
    responses(
        (status = 200, description = "Created calendar", body = CreateCalendarResponse),
    )
)]
pub async fn create_calendar(
    calendar_data: Json<CreateCalendar>,
) -> Result<Json<CreateCalendarResponse>, StatusCode> {
    let calendar_id = Uuid::new_v4().to_string();
    db::add_url_id_mapping(calendar_data.url.clone(), calendar_id.clone()).await;
    let response = CreateCalendarResponse { id: calendar_id };
    Ok(Json(response))
}

#[utoipa::path(
    get,
    path = "/calendars/{id}/get_events",
    params(
        ("id" = String, Path, description = "The ID of the calendar")
    ),
    responses(
        (status = 200, description = "Retrieved events for the calendar", body = Vec<EventResponse>),
    )
)]
pub async fn get_events(Path(id): Path<String>) -> impl IntoResponse {
    let url = db::get_url_from_id(&id)
        .await
        .ok_or(StatusCode::NOT_FOUND)?;
    let Ok(cal) = upstream::get_calendar(url).await else {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    };

    let blocked_events = db::get_manual_blocks(&id).await.unwrap_or_default();
    let events: Vec<EventResponse> = cal
        .get_events()
        .into_iter()
        .map(|event| {
            let blocked = blocked_events.contains(&event.uid);
            EventResponse {
                event: event.clone(),
                blocked,
            }
        })
        .collect();

    Ok(Json(events))
}

#[utoipa::path(
    get,
    path = "/calendars/{id}/get_url",
    params(
        ("id" = String, Path, description = "The ID of the calendar")
    ),
    responses(
        (status = 200, description = "Retrieved url", body = String),
        (status = 404, description = "Calendar not found")
    )
)]
pub async fn get_calendar_url(Path(id): Path<String>) -> impl IntoResponse {
    db::get_url_from_id(&id)
        .await
        .map(|e| Json(e))
        .ok_or(StatusCode::NOT_FOUND)
}

pub async fn get_feed(Path(id): Path<String>) -> impl IntoResponse {
    let url = db::get_url_from_id(&id)
        .await
        .ok_or(StatusCode::NOT_FOUND)?;
    let Ok(calendar) = upstream::get_calendar(url).await else {
        return Err(StatusCode::INTERNAL_SERVER_ERROR);
    };

    let ical = calendar.get_filtered_icalendar();

    let reader = std::io::Cursor::new(ical.to_string().into_bytes());
    let stream = ReaderStream::new(reader);
    let body = Body::from_stream(stream);

    let mut headers = HeaderMap::new();
    headers.insert(
        header::CONTENT_TYPE,
        "application/octet-stream".parse().unwrap(),
    );
    headers.insert(
        header::CONTENT_DISPOSITION,
        "attachment; filename=\"feed.ics\"".parse().unwrap(),
    );

    Ok((headers, body))
}

#[utoipa::path(
    post,
    path = "/calendars/{id}/rules/create",
    request_body = Rule,
    params(
        ("id" = String, Path, description = "The ID of the calendar")
    ),
    responses(
        (status = 200, description = "Rule created", body = String)
    )
)]
pub async fn create_rule(Path(id): Path<String>, body: Json<Rule>) -> impl IntoResponse {
    let id = db::add_rule(id.clone(), body.clone().0).await;
    id
}

#[utoipa::path(
    get,
    path = "/calendars/{id}/rules/list",
    params(
        ("id" = String, Path, description = "The ID of the calendar")
    ),
    responses(
        (status = 200, description = "List of rules", body = [Rule]),
        (status = 404, description = "Calendar not found")
    )
)]
pub async fn list_rules(Path(id): Path<String>) -> impl IntoResponse {
    let Some(rules) = db::list_rules(&id).await else {
        return Err(StatusCode::NOT_FOUND);
    };
    Ok(Json(rules))
}
#[utoipa::path(
    put,
    path = "/calendars/{id}/rules/{rule_id}/update",
    request_body = Rule,
    params(
        ("id" = String, Path, description = "The ID of the calendar"),
        ("rule_id" = String, Path, description = "The ID of the rule")
    ),
    responses(
        (status = 201, description = "Rule updated"),
        (status = 404, description = "Rule not found")
    )
)]
pub async fn update_rule(
    Path((id, rule_id)): Path<(String, String)>,
    body: Json<Rule>,
) -> impl IntoResponse {
    let success = db::update_rule(&id, &rule_id, body.0).await;
    if !success {
        return Err(StatusCode::NOT_FOUND);
    }
    Ok(StatusCode::CREATED)
}

#[utoipa::path(
    delete,
    path = "/calendars/{id}/rules/{rule_id}/delete",
    params(
        ("id" = String, Path, description = "The ID of the calendar"),
        ("rule_id" = String, Path, description = "The ID of the rule")
    ),
    responses(
        (status = 204, description = "Rule deleted"),
        (status = 404, description = "Rule not found")
    )
)]
pub async fn delete_rule(Path((id, rule_id)): Path<(String, String)>) -> impl IntoResponse {
    let success = db::delete_rule(&id, &rule_id).await;
    if !success {
        return Err(StatusCode::NOT_FOUND);
    }
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    get,
    path = "/calendars/{id}/rules/{rule_id}/get",
    params(
        ("id" = String, Path, description = "The ID of the calendar"),
        ("rule_id" = String, Path, description = "The ID of the rule")
    ),
    responses(
        (status = 200, description = "Retrieved rule", body = Rule),
        (status = 404, description = "Rule not found")
    )
)]
pub async fn get_rule(
    Path((id, rule_id)): Path<(String, String)>,
) -> Result<Json<Rule>, StatusCode> {
    let rule = db::get_rule(&id, &rule_id)
        .await
        .ok_or(StatusCode::NOT_FOUND)?;
    Ok(Json(rule))
}

#[utoipa::path(
    post,
    path = "/calendars/{id}/block/add",
    request_body = String,
    params(
        ("id" = String, Path, description = "The ID of the calendar")
    ),
    responses(
        (status = 200, description = "Rule created", body = String)
    )
)]
pub async fn block_add(Path(id): Path<String>, body: Json<String>) -> impl IntoResponse {
    db::add_manual_block(id.clone(), body.0).await;
    StatusCode::NO_CONTENT
}

#[utoipa::path(
    post,
    path = "/calendars/{id}/block/remove",
    request_body = String,
    params(
        ("id" = String, Path, description = "The ID of the calendar")
    ),
    responses(
        (status = 200, description = "Rule created", body = String)
    )
)]
pub async fn block_remove(Path(id): Path<String>, body: Json<String>) -> impl IntoResponse {
    let success = db::remove_manual_block(&id, &body.0).await;
    if !success {
        Err(StatusCode::NOT_FOUND)
    } else {
        Ok(StatusCode::NO_CONTENT)
    }
}

#[utoipa::path(
    get,
    path = "/calendars/{id}/block/list",
    request_body = String,
    params(
        ("id" = String, Path, description = "The ID of the calendar")
    ),
    responses(
        (status = 200, description = "List of all blocks", body = HashSet<String>)
    )
)]
pub async fn block_list(Path(id): Path<String>) -> impl IntoResponse {
    let Some(set) = db::get_manual_blocks(&id).await else {
        return Err(StatusCode::NOT_FOUND);
    };

    Ok(Json(set))
}
