/**
 * auth-service.ts
 *
 * Real HTTP auth service — connects to the FastAPI backend via the
 * central api-client.
 */

import { apiClient, tokenStorage } from "@/lib/api-client";
import {
  AuthResponse,
  LoginCredentials,
  MeResponse,
  RegisterCredentials,
  TokenResponse,
  User,
} from "../types";

interface RegisterBackendResponse {
  success: boolean;
  message: string;
  data: {
    user: MeResponse;
    tokens: TokenResponse;
  };
}

// ── Helper: parse full name into first and last name ───────────────────────

function parseName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "User";
  const lastName = parts.slice(1).join(" ") || undefined;
  return { firstName, lastName };
}

// ── Helper: generate clean unique username from email & name ────────────────

function generateUsername(email: string, name: string): string {
  const emailPrefix = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (emailPrefix.length >= 3) return emailPrefix;
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (nameSlug.length >= 3) return nameSlug;
  return `user_${Math.floor(1000 + Math.random() * 9000)}`;
}

// ── Helper: map backend UserResponse → frontend User ──────────────────────

function mapMeToUser(me: MeResponse): User {
  const parts = [me.first_name, me.last_name].filter(Boolean);
  const fullName = parts.length > 0 ? parts.join(" ") : me.username;
  return {
    id: String(me.id),
    name: fullName,
    email: me.email,
    role: me.role,
    is_active: me.is_active,
    is_verified: me.is_verified,
    avatarUrl: me.avatar_url ?? undefined,
    createdAt: me.created_at,
  };
}

// ── Service ────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Login via JSON payload.
   * POST /auth/login with Content-Type: application/json and { email, password }.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const tokenResp = await apiClient.post<TokenResponse>("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });

    // Store the JWT so subsequent requests attach it automatically
    tokenStorage.set(tokenResp.access_token);

    // Fetch the full user profile
    const me = await apiClient.get<MeResponse>("/auth/me");
    const user = mapMeToUser(me);

    return { user, token: tokenResp.access_token };
  },

  /**
   * Register a new account.
   * POST /auth/register with JSON body matching backend RegisterRequest schema.
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { firstName, lastName } = parseName(credentials.name);
    const username = generateUsername(credentials.email, credentials.name);

    const resp = await apiClient.post<RegisterBackendResponse>("/auth/register", {
      email: credentials.email.toLowerCase().trim(),
      username,
      password: credentials.password,
      first_name: firstName,
      last_name: lastName,
      terms_accepted: true,
    });

    const accessToken = resp.data?.tokens?.access_token;
    if (!accessToken) {
      throw new Error("Registration succeeded but access token was missing from backend response.");
    }

    // Save JWT token for authenticated requests
    tokenStorage.set(accessToken);

    // Map user directly from registration response data
    const user = mapMeToUser(resp.data.user);

    return { user, token: accessToken };
  },

  /**
   * Request a password-reset email.
   */
  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    interface ForgotResp {
      message: string;
    }
    const resp = await apiClient.post<ForgotResp>("/auth/forgot-password", {
      email,
    });
    return { success: true, message: resp.message };
  },

  /**
   * Reset password using a token (obtained from the reset email link).
   */
  async resetPassword(
    password: string,
    token?: string
  ): Promise<{ success: boolean; message: string }> {
    interface ResetResp {
      message: string;
    }
    const resp = await apiClient.post<ResetResp>("/auth/reset-password", {
      new_password: password,
      token,
    });
    return { success: true, message: resp.message };
  },

  /**
   * Fetch the currently authenticated user's profile.
   * Returns null if not authenticated.
   */
  async me(): Promise<User | null> {
    try {
      const me = await apiClient.get<MeResponse>("/auth/me");
      return mapMeToUser(me);
    } catch {
      return null;
    }
  },

  /**
   * Logout – clears the local token. Backend token invalidation is optional.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Always clear local session even if backend call fails
    } finally {
      tokenStorage.clear();
    }
  },
};
