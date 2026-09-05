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

export type DataEnvelope<T> = { data: T };

export type PageEnvelope<T, TMeta extends object = object> = DataEnvelope<T[]> & {
  meta: TMeta & {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

type QueryValue = string | number | boolean | null | undefined;

export function apiPath(
  path: `/${string}`,
  query?: Readonly<Record<string, QueryValue>>,
): `/${string}` {
  if (!query) return path;

  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const queryString = search.toString();
  return queryString ? `${path}?${queryString}` : path;
}

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

  const payload = response.status === 204
    ? null
    : ((await response.json().catch(() => null)) as ApiErrorPayload | T | null);

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
