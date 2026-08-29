import { AxiosError, create } from "axios";

import { env } from "@/config/env";

export type ApiErrorPayload = {
  message?: string;
  code?: string;
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

export const apiClient = create({
  baseURL: env.apiBaseURL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    if (error.response) {
      throw new ApiError(
        error.response.data?.message ?? error.message,
        error.response.status,
        error.response.data?.code,
      );
    }

    throw new ApiError(error.message || "Network error", 0, "NETWORK_ERROR");
  },
);
