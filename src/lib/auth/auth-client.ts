import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { env } from "@/config/env";

export const authClient = createAuthClient({
  baseURL: env.apiBaseURL,
  plugins: [
    expoClient({
      scheme: "loka",
      storagePrefix: "loka",
      storage: SecureStore,
    }),
  ],
});

export type AuthSession = typeof authClient.$Infer.Session;
