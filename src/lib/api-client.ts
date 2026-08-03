/**
 * api-client.ts
 *
 * Central HTTP client for communicating with the FastAPI backend.
 *
 * - Base URL : /api/v1  (proxied by next.config.mjs → http://127.0.0.1:8000/api/v1)
 * - Auth     : Reads the JWT `access_token` from sessionStorage automatically.
 * - Context  : Auto-injects X-Workspace-ID and X-Organization-ID from the active
 *              Zustand workspace context persisted in localStorage.
 * - 401      : Clears the session and redirects to /login.
 * - Errors   : Throws ApiError for non-2xx responses.
 */

import { ApiError } from "./api-error";

const BASE_URL = "/api/v1";

/** Shape of every backend success envelope */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

// ── Token helpers ──────────────────────────────────────────────────────────

const TOKEN_KEY = "neurodesk_access_token";

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(TOKEN_KEY);
    // Also clear the legacy auth session zustand store key
    sessionStorage.removeItem("neurodesk_auth_session");
  },
};

// ── Workspace / Org context helpers ────────────────────────────────────────

/**
 * Reads the active workspace and organization IDs from the persisted Zustand
 * workspace-context-store (localStorage key: neurodesk_active_workspace_context).
 * These are injected as X-Workspace-ID and X-Organization-ID request headers so
 * the FastAPI backend always resolves the correct multi-tenant context.
 */
export const contextStorage = {
  getWorkspaceId(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("neurodesk_active_workspace_context");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state?.currentWorkspace?.id ?? null;
    } catch {
      return null;
    }
  },
  getOrganizationId(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("neurodesk_active_workspace_context");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state?.currentWorkspace?.organization_id ?? null;
    } catch {
      return null;
    }
  },
};

// ── Core request function ──────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  headers?: HeadersInit,
  isFormEncoded = false
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const requestHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  // Attach auth token if available
  const token = tokenStorage.get();
  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Auto-inject workspace and organization context headers.
  // This ensures every API call targets the same workspace that the
  // File Manager displays — fixing the mismatch between file list
  // queries and storage calculation queries.
  const workspaceId = contextStorage.getWorkspaceId();
  const organizationId = contextStorage.getOrganizationId();
  if (workspaceId && !requestHeaders["X-Workspace-ID"]) {
    requestHeaders["X-Workspace-ID"] = workspaceId;
  }
  if (organizationId && !requestHeaders["X-Organization-ID"]) {
    requestHeaders["X-Organization-ID"] = organizationId;
  }

  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    if (isFormEncoded) {
      // OAuth2 / form-urlencoded (used by /auth/login)
      requestHeaders["Content-Type"] = "application/x-www-form-urlencoded";
      requestBody = new URLSearchParams(body as Record<string, string>).toString();
    } else {
      requestHeaders["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    credentials: "same-origin",
  });

  // Handle 401 on authentication / protected endpoints
  if (response.status === 401) {
    const isLoginEndpoint = url.includes("/auth/login");
    let message = isLoginEndpoint
      ? "Invalid email or password."
      : "Unauthorized access.";

    try {
      const errJson = await response.json();
      if (typeof errJson.detail === "string") {
        message = errJson.detail;
      } else if (errJson.message && typeof errJson.message === "string") {
        message = errJson.message;
      }
    } catch {
      // keep default
    }

    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");
    if (!isAuthEndpoint) {
      tokenStorage.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    throw new ApiError(401, message);
  }

  // Handle all other non-2xx responses
  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    let detail: string | undefined;

    try {
      const errJson = await response.json();

      // Priority 1: FastAPI detail string (e.g., "An account with this email address already exists.")
      if (typeof errJson.detail === "string") {
        message = errJson.detail;
        detail = errJson.detail;
      }
      // Priority 2: Structured envelope message
      else if (errJson.message && typeof errJson.message === "string") {
        message = errJson.message;
        detail = errJson.error?.code ?? errJson.error?.detail ?? undefined;
      }
      // Priority 3: FastAPI array of validation error objects [{loc: [...], msg: "..."}]
      else if (Array.isArray(errJson.detail)) {
        const firstErr = errJson.detail[0];
        const rawLoc = (firstErr?.loc ?? []).slice(1).join(" -> ");
        const fieldName = rawLoc ? rawLoc.charAt(0).toUpperCase() + rawLoc.slice(1) : "";
        message = fieldName
          ? `${fieldName}: ${firstErr?.msg ?? "Invalid value"}`
          : (firstErr?.msg ?? message);
        detail = JSON.stringify(errJson.detail);
      }
    } catch {
      // JSON parse failed
    }

    throw new ApiError(response.status, message, detail);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

// ── Public API client ──────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, headers?: HeadersInit): Promise<T> {
    return request<T>("GET", path, undefined, headers);
  },

  post<T>(path: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return request<T>("POST", path, body, headers);
  },

  /** POST with application/x-www-form-urlencoded body (OAuth2 login) */
  postForm<T>(path: string, body: Record<string, string>): Promise<T> {
    return request<T>("POST", path, body, undefined, true);
  },

  put<T>(path: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return request<T>("PUT", path, body, headers);
  },

  patch<T>(path: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return request<T>("PATCH", path, body, headers);
  },

  delete<T>(path: string, headers?: HeadersInit): Promise<T> {
    return request<T>("DELETE", path, undefined, headers);
  },
};
