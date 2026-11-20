import { request } from "./http";
import type { AdminProfile, AuthTokens } from "./types";

export function login(email: string, password: string) {
  return request<AuthTokens>("/v1/auth/login", { method: "POST", body: { email, password } });
}

export function fetchAdminProfile() {
  return request<AdminProfile>("/v1/admin/me");
}
