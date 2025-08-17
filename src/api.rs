use axum::body::Body;
use tokio_util::io::ReaderStream;
use axum::extract::Path;
use axum::http::{header, HeaderMap};
use crate::{db, upstream};
use axum::Json;
use axum::response::IntoResponse;
use serde::{Deserialize, Serialize};
use utoipa::{OpenApi, ToSchema};
use uuid;
use uuid::Uuid;
use crate::processing::Calendar;

pub(crate) fn router() -> axum::Router {
    axum::Router::new()
        .route("/openapi.json", axum::routing::get(openapi))
        .route("/calendars/create", axum::routing::post(create_calendar))
        .route("/calendars/{id}/get_events", axum::routing::get(get_events))
        .route("/calendars/{id}/feed", axum::routing::get(get_feed))
}

#[derive(OpenApi)]
#[openapi(
    paths(openapi, create_calendar, get_events),
    components(schemas(CreateCalendar, CreateCalendarResponse))
)]
struct ApiDoc;

#[utoipa::path(
    get,
    path = "/openapi.json",
    responses(
        (status = 200, description = "JSON file", body = ())
    )
)]
pub async fn openapi() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
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
) -> Result<Json<CreateCalendarResponse>, axum::http::StatusCode> {
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
        (status = 200, description = "Retrieved events for the calendar", body = Calendar),
    )
)]
pub async fn get_events(
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = db::get_url_from_id(&id).await.ok_or(axum::http::StatusCode::NOT_FOUND)?;
    let Ok(cal) = upstream::get_calendar(url).await else {
        return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
    };

    Ok(Json(cal))
}

pub async fn get_feed(
    Path(id): Path<String>,
) -> impl IntoResponse {
    let url = db::get_url_from_id(&id).await.ok_or(axum::http::StatusCode::NOT_FOUND)?;
    let Ok(cal) = upstream::get_calendar(url).await else {
        return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
    };

    let reader = std::io::Cursor::new(cal.to_string().into_bytes());
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
