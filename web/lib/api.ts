import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { components, paths } from "./schema";

export const fetchClient = createFetchClient<paths>({
  baseUrl: "http://localhost:8000",
});
export const $api = createClient(fetchClient);

export type CalendarEvent = components["schemas"]["EventResponse"];

export type Rule = components["schemas"]["Rule"];
export type Filter = components["schemas"]["Filter"];
export type Matcher = components["schemas"]["Matcher"];
export type Field = components["schemas"]["Field"];
export type MatchType = components["schemas"]["MatchType"];
export type Action = components["schemas"]["Action"];
export type FieldTransform = components["schemas"]["FieldTransform"];
export type Transform = components["schemas"]["Transform"];
export type StringTransform = components["schemas"]["StringTransform"];
export type DateTransform = components["schemas"]["DateTransform"];
