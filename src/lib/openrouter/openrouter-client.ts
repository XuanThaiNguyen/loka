import { env } from "@/config/env";

type OpenRouterMessage = {
  role: "system" | "user";
  content: string;
};

type RequestOpenRouterCompletionInput = {
  systemPrompt: string;
  userContent: string;
  maxCompletionTokens: number;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 180000;

export async function requestOpenRouterCompletion({
  systemPrompt,
  userContent,
  maxCompletionTokens,
}: RequestOpenRouterCompletionInput) {
  if (!env.openRouterApiKey) {
    throw new Error("OpenRouter API key is not configured");
  }

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${env.openRouterApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.openRouterModel,
      messages,
      temperature: 0.55,
      max_completion_tokens: maxCompletionTokens,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenRouter HTTP ${response.status}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenRouter returned an empty response");
  }

  return content.trim();
}
