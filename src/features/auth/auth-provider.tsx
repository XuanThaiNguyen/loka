import { createContext, type PropsWithChildren, useContext } from "react";

import {
  authClient,
  type AuthSession,
} from "@/lib/auth/auth-client";

type AuthContextValue = {
  session: AuthSession | null;
  isPending: boolean;
  error: Error | null;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const { data, error, isPending, refetch } = authClient.useSession();

  return (
    <AuthContext.Provider
      value={{
        session: data ?? null,
        isPending,
        error,
        refreshSession: refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
