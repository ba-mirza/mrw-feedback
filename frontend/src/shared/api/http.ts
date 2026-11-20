import { getAccessToken, setAccessToken } from "@/shared/lib/session";

import type { ValidationIssue } from "./types";

const JSON_CONTENT_TYPE = "application/json";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly issues: ValidationIssue[];

  constructor(status: number, message: string, code: string | null = null, issues: ValidationIssue[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

function isValidationIssues(value: unknown): value is ValidationIssue[] {
  return Array.isArray(value) && value.every((item) => typeof item?.field === "string");
}

function readString(body: unknown, key: string) {
  if (typeof body !== "object" || body === null || !(key in body)) return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

async function toApiError(response: Response) {
  const body: unknown = await response.json().catch(() => null);

  if (isValidationIssues(body)) {
    return new ApiError(response.status, body[0]?.message ?? response.statusText, null, body);
  }

  return new ApiError(response.status, readString(body, "message") ?? response.statusText, readString(body, "code"));
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT";
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

function buildUrl(path: string, query: RequestOptions["query"]) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const search = params.toString();

  return search ? `${path}?${search}` : path;
}

async function send(path: string, { method = "GET", query, body }: RequestOptions) {
  const headers = new Headers();
  const token = getAccessToken();

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("Content-Type", JSON_CONTENT_TYPE);

  const response = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && token) setAccessToken(null);
  if (!response.ok) throw await toApiError(response);

  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const response = await send(path, options);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export async function requestBlob(path: string, options: RequestOptions = {}) {
  const response = await send(path, options);

  return response.blob();
}
