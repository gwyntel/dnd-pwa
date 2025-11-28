/**
 * Unified AI Provider using OpenAI SDK
 * Handles OpenAI, OpenRouter, and LM Studio through a single interface.
 */

import OpenAI from "openai";
import { getAccessToken } from "./auth.js";
import store from "../state/store.js";
import { isProxyEnabled, proxyRequest } from "./proxy.js";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const APP_REFERER = "https://github.com/gwyntel/dnd-pwa";
const APP_TITLE = "D&D PWA";

// Cache client instances to avoid recreating on every request
let cachedClient = null;
let cachedConfig = null;

/**
 * Get current configuration based on settings
 */
function getProviderConfig() {
  const data = store.get();
  const settings = data.settings || {};
  const type = settings.provider || "openrouter";

  let config = { type, baseUrl: "", apiKey: "", headers: {} };

  switch (type) {
    case "openrouter":
      config.baseUrl = OPENROUTER_BASE;
      config.apiKey = getAccessToken(); // From auth.js
      config.headers = {
        "HTTP-Referer": APP_REFERER,
        "X-Title": APP_TITLE,
      };
      break;

    case "openai":
      config.baseUrl = (settings.providers?.openai?.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
      config.apiKey = settings.providers?.openai?.apiKey || "";
      break;

    case "lmstudio":
      config.baseUrl = (settings.providers?.lmstudio?.baseUrl || "http://localhost:1234/v1").replace(/\/$/, "");
      config.apiKey = "not-needed"; // Local models don't use keys
      break;

    default:
      throw new Error(`Unknown provider: ${type}`);
  }

  return config;
}

/**
 * Create custom fetch wrapper for CORS proxy support
 */
function createCustomFetch(config) {
  return async (url, options) => {
    // Only use proxy for OpenAI provider when proxy is enabled
    if (config.type === "openai" && isProxyEnabled()) {
      try {
        // Extract endpoint from full URL
        const endpoint = url.replace(config.baseUrl, "");
        return await proxyRequest(config.baseUrl, config.apiKey, endpoint, options);
      } catch (error) {
        console.error("Proxy Request Error:", error);
        throw error;
      }
    }

    // Direct fetch for all other cases
    return fetch(url, options);
  };
}

/**
 * Get or create OpenAI client instance
 * Caches the client to avoid recreation unless config changes
 */
function getClientInstance(config) {
  // Check if we can reuse cached client
  if (cachedClient && cachedConfig &&
    cachedConfig.type === config.type &&
    cachedConfig.baseUrl === config.baseUrl &&
    cachedConfig.apiKey === config.apiKey) {
    return cachedClient;
  }

  const clientOptions = {
    apiKey: config.apiKey || "not-needed",
    baseURL: config.baseUrl,
    fetch: createCustomFetch(config),
    dangerouslyAllowBrowser: true, // Required for PWA/browser usage
  };

  // Add OpenRouter-specific headers
  if (config.type === "openrouter") {
    clientOptions.defaultHeaders = config.headers;
  }

  cachedClient = new OpenAI(clientOptions);
  cachedConfig = config;

  return cachedClient;
}

/**
 * Fetch Available Models
 */
export async function fetchModels() {
  const config = getProviderConfig();

  if (!config.apiKey && config.type !== "lmstudio") {
    throw new Error(`Authentication required for ${config.type}. Please check settings.`);
  }

  try {
    const client = getClientInstance(config);
    const response = await client.models.list();

    // Normalize list (OpenRouter .data, OpenAI .data, LMStudio varies)
    const rawList = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);

    return rawList.map(m => ({
      id: m.id,
      name: m.name || m.id,
      // Normalize context length detection across providers
      contextLength: m.context_length || m.context_window || m.max_model_len || 4096,
      provider: config.type,
      pricing: m.pricing || { prompt: 0, completion: 0 },
      // Check capability flags (OpenRouter) or simple string match
      supportsReasoning: m.supported_parameters?.includes("reasoning") ||
        m.id.includes("reasoning") ||
        m.id.includes("reasoner") ||  // DeepSeek Reasoner
        m.id.includes("r1") ||          // DeepSeek R1, Qwen R1
        m.id.includes("o1") ||          // OpenAI o1 series
        m.id.toLowerCase().includes("think") || // Thinking models
        false,
      supportedParameters: m.supported_parameters || []
    }));
  } catch (error) {
    console.error("Fetch Models Failed:", error);
    throw error;
  }
}

/**
 * Send Chat Completion (Streaming)
 * Returns an async iterable stream from the OpenAI SDK
 */
export async function sendChatCompletion(messages, model, options = {}) {
  const config = getProviderConfig();

  if (!config.apiKey && config.type !== "lmstudio") {
    throw new Error(`Authentication required for ${config.type}. Please check settings.`);
  }

  const client = getClientInstance(config);

  // Common parameters
  const params = {
    model,
    messages,
    stream: true,
    temperature: options.temperature ?? 1.0
  };

  // ========== UNIFIED REASONING ABSTRACTION ==========
  // Handles three main shapes across providers:
  // 1. Qualitative effort (OpenAI reasoning_effort, OpenRouter reasoning.effort)
  // 2. Quantitative token limit (Anthropic/Gemini reasoning.max_tokens)
  // 3. Reasoning visibility toggle (OpenRouter include_reasoning)

  if (options.reasoningEnabled) {
    const reasoningMode = options.reasoningMode || "auto"; // "auto" | "visible" | "none"
    const reasoningEffort = options.reasoningEffort; // "low" | "medium" | "high"
    const reasoningMaxTokens = options.reasoningMaxTokens; // integer | null

    // OpenAI native reasoning_effort (o-series, GPT-5)
    if (reasoningEffort && (config.type === "openai" || config.type === "lmstudio")) {
      params.reasoning_effort = reasoningEffort; // low, medium, high
    }

    // OpenRouter unified reasoning interface
    if (config.type === "openrouter") {
      const reasoning = {};

      // Map effort level
      if (reasoningEffort) {
        reasoning.effort = reasoningEffort;
      }

      // Map max reasoning tokens
      if (reasoningMaxTokens) {
        reasoning.max_tokens = reasoningMaxTokens;
      }

      // Include reasoning traces if visibility requested
      if (reasoningMode === "visible") {
        // @ts-expect-error - OpenRouter-specific parameter
        params.include_reasoning = true;
      }

      // Only add reasoning object if it has properties
      if (Object.keys(reasoning).length > 0) {
        // @ts-expect-error - OpenRouter-specific parameter
        params.reasoning = reasoning;
      }
    }

    // For providers with numeric-only reasoning caps (Anthropic, Gemini via some gateways)
    // If only max_tokens is supported, translate effort levels to token budgets
    if (reasoningMaxTokens && config.type !== "openrouter") {
      // Most providers may not have a dedicated reasoning.max_tokens field
      // but might use max_tokens or max_output_tokens as a combined budget.
      // Document this in settings UI that reasoning_max_tokens affects total budget.
      // @ts-expect-error - Some providers may support this
      params.reasoning_max_tokens = reasoningMaxTokens;
    }
  }

  // ========== PROMPT CACHING ==========
  // OpenAI and OpenRouter support prompt caching to reduce costs on repeated contexts
  if (options.cachingEnabled === true) {
    // OpenAI prompt caching (beta feature)
    if (config.type === "openai") {
      // @ts-expect-error - OpenAI-specific caching parameter
      params.store = true;
    }

    // OpenRouter supports caching via transforms on messages
    // This is typically done by marking messages with cache_control
    // For now, we'll let this be handled at a higher level (message tagging)
  }

  // Response Format (JSON Mode / Schema)
  if (options.responseFormat || options.jsonSchema) {
    // Map simplified jsonSchema option to OpenAI standard response_format
    if (options.jsonSchema) {
      params.response_format = {
        type: "json_schema",
        json_schema: options.jsonSchema
      };
    } else {
      params.response_format = options.responseFormat;
    }
  }

  try {
    // Return the stream directly - SDK returns async iterable
    return await client.chat.completions.create(params);
  } catch (error) {
    console.error("Chat Completion Error:", error);

    // Provide user-friendly error messages
    if (error.status === 401) {
      throw new Error("Authentication failed. Check API Key or Login.");
    }
    if (error.status === 402) {
      throw new Error("Insufficient credits/quota.");
    }
    if (error.status === 429) {
      throw new Error("Rate limited. Please wait a moment.");
    }
    if (error.message?.includes("Failed to fetch") && config.type === "lmstudio") {
      throw new Error("Unable to reach LM Studio. Is the local server running at " + config.baseUrl + "?");
    }

    throw error;
  }
}

/**
 * Parse Streaming Response
 * NOTE: This function is now a simple pass-through for backward compatibility.
 * The OpenAI SDK returns an async iterable that already handles SSE parsing.
 * Consumers can now directly iterate over the stream returned by sendChatCompletion.
 */
export async function* parseStreamingResponse(stream) {
  // Simply yield each chunk from the SDK stream
  for await (const chunk of stream) {
    yield chunk;
  }
}

/**
 * Helper: Calculate Cost
 */
export function calculateCost(usage, pricing) {
  if (!pricing) return 0;
  // OpenRouter pricing is per token (usually)
  return (usage.promptTokens * Number(pricing.prompt || 0)) +
    (usage.completionTokens * Number(pricing.completion || 0));
}

/**
 * Helper: Extract Usage Stats
 */
export function extractUsage(chunk) {
  // Some providers send usage in the final chunk
  if (!chunk?.usage) return null;
  return {
    promptTokens: chunk.usage.prompt_tokens || 0,
    completionTokens: chunk.usage.completion_tokens || 0,
    totalTokens: chunk.usage.total_tokens || 0,
    reasoningTokens: chunk.usage.completion_tokens_details?.reasoning_tokens || 0
  };
}

export async function testConnection() {
  try {
    await fetchModels();
    return true;
  } catch (e) {
    return false;
  }
}