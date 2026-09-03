import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";
import { OpenAiProvider } from "./openai";
import type { LLMProvider } from "../types";

export interface ResolvedProvider {
  kind: "llm" | "mock";
  name: string;
  provider: LLMProvider | null;
}

/**
 * Resolve the AI provider from the environment.
 *
 * AI_PROVIDER=auto (default) picks the first available key among OpenAI,
 * Anthropic and Google. AI_PROVIDER=mock forces the deterministic offline
 * engine. Explicit values (openai|anthropic|google|mock) are honoured.
 */
export function getProvider(): ResolvedProvider {
  const explicit = (process.env.AI_PROVIDER || "auto").toLowerCase();
  const keys: Array<{ key: string; factory: (k: string) => LLMProvider; name: string }> = [
    {
      key: "OPENAI_API_KEY",
      name: "openai",
      factory: (k) => new OpenAiProvider(k),
    },
    {
      key: "ANTHROPIC_API_KEY",
      name: "anthropic",
      factory: (k) => new AnthropicProvider(k),
    },
    {
      key: "GOOGLE_API_KEY",
      name: "google",
      factory: (k) => new GoogleProvider(k),
    },
  ];

  const byName = (name: string) => {
    const entry = keys.find((k) => k.name === name);
    const apiKey = process.env[entry!.key];
    if (!apiKey) throw new Error(`AI_PROVIDER=${name} but ${entry!.key} is not set.`);
    return { kind: "llm" as const, name, provider: entry!.factory(apiKey) };
  };

  if (explicit === "mock") return { kind: "mock", name: "mock", provider: null };
  if (explicit !== "auto") return byName(explicit);

  const available = keys.find((k) => process.env[k.key]);
  if (!available) {
    return { kind: "mock", name: "mock", provider: null };
  }
  return {
    kind: "llm",
    name: available.name,
    provider: available.factory(process.env[available.key]!),
  };
}

export function isMock(): boolean {
  return getProvider().kind === "mock";
}

export async function loadPrompt(name: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  return readFile(`${process.cwd()}/prompts/${name}.md`, "utf8");
}
