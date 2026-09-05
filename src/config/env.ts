export const env = {
  apiBaseURL: (
    process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"
  ).replace(/\/$/, ""),
  openRouterApiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
  openRouterModel:
    process.env.EXPO_PUBLIC_OPENROUTER_MODEL ?? "deepseek/deepseek-v4-flash",
};
