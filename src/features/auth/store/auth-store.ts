import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, LoginCredentials, RegisterCredentials } from "../types";
import { authService } from "../services/auth-service";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Failed to log in. Please try again.";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw err;
        }
      },

      register: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(credentials);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Failed to register account.";
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw err;
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await authService.forgotPassword(email);
          set({ isLoading: false, error: null });
          return true;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Failed to send reset email.";
          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      resetPassword: async (password) => {
        set({ isLoading: true, error: null });
        try {
          await authService.resetPassword(password);
          set({ isLoading: false, error: null });
          return true;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Failed to reset password.";
          set({
            isLoading: false,
            error: errorMessage,
          });
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await authService.logout();
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "neurodesk_auth_session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
