import { fetch } from "expo/fetch";
import { Platform } from "react-native";

import { env } from "@/config/env";
import { authClient } from "@/lib/auth/auth-client";

export type ApiErrorPayload = {
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: `/${string}`,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (Platform.OS !== "web") {
    const cookie = await authClient.getCookie();
    if (cookie) headers.set("Cookie", cookie);
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseURL}${path}`, {
      ...options,
      credentials: Platform.OS === "web" ? "include" : "omit",
      headers,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Network error",
      0,
      "NETWORK_ERROR",
    );
  }

  const payload = (await response
    .json()
    .catch(() => null)) as ApiErrorPayload | T | null;

  if (!response.ok) {
    const apiError = payload as ApiErrorPayload | null;
    throw new ApiError(
      apiError?.error?.message ?? `Request failed (${response.status})`,
      response.status,
      apiError?.error?.code,
    );
  }

  return payload as T;
}
