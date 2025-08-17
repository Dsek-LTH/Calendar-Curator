import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import { components, paths } from "./schema";

export const fetchClient = createFetchClient<paths>({
  baseUrl: "http://localhost:8000",
});
export const $api = createClient(fetchClient);

export type CalendarEvent = components["schemas"]["EventResponse"];
