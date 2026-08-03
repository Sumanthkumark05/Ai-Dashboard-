// ── Core user types (aligned with backend UserResponse schema) ─────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  /** User's role: owner | admin | member | viewer */
  role?: string;
  is_active?: boolean;
  is_verified?: boolean;
  createdAt: string;
}

// ── Auth response types ────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  token: string;
}

/** FastAPI OAuth2 token response shape (matches backend TokenResponse schema) */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/** Backend /auth/me → UserResponse schema */
export interface MeResponse {
  id: string;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser?: boolean;
  created_at: string;
  updated_at: string;
}

// ── Credential types ───────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

export interface ForgotPasswordCredentials {
  email: string;
}

export interface ResetPasswordCredentials {
  password: string;
  confirmPassword: string;
  token?: string;
}
