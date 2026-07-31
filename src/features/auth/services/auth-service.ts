import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types";

const MOCK_USER: User = {
  id: "usr_neuro_109283",
  name: "Alex Vance",
  email: "alex@neurodesk.ai",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  createdAt: new Date().toISOString(),
};

const delay = (ms: number = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(1000);

    if (credentials.email === "error@neurodesk.ai") {
      throw new Error("Invalid email or password. Please check your credentials.");
    }

    const user: User = {
      ...MOCK_USER,
      email: credentials.email,
      name: credentials.email.split("@")[0].replace(".", " "),
    };

    return {
      user,
      token: `mock_jwt_token_${Date.now()}`,
    };
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    await delay(1200);

    if (credentials.email === "existing@neurodesk.ai") {
      throw new Error("An account with this email address already exists.");
    }

    const user: User = {
      id: `usr_${Date.now()}`,
      name: credentials.name,
      email: credentials.email,
      createdAt: new Date().toISOString(),
    };

    return {
      user,
      token: `mock_jwt_token_${Date.now()}`,
    };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await delay(1000);

    if (email === "notfound@neurodesk.ai") {
      throw new Error("No account registered with this email address.");
    }

    return {
      success: true,
      message: "Password reset link has been dispatched to your inbox.",
    };
  },

  async resetPassword(password: string): Promise<{ success: boolean; message: string }> {
    await delay(1000);

    if (!password) {
      throw new Error("Password is required for reset.");
    }

    return {
      success: true,
      message: "Your password has been reset successfully.",
    };
  },

  async logout(): Promise<void> {
    await delay(500);
  },
};
