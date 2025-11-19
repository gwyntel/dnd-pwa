/**
 * Unified AI Provider
 * Handles OpenAI, OpenRouter, and LM Studio through a single interface.
 */

import { getAccessToken } from "./auth.js";
import { loadData } from "./storage.js";
import { isProxyEnabled, proxyRequest } from "./proxy.js";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const APP_REFERER = "https://github.com/gwyntel/dnd-pwa";
const APP_TITLE = "D&D PWA";

/**
 * Get current configuration based on settings
 */
function getProviderConfig() {
  const data = loadData();
  const type = data.settings.provider || "openrouter";
  
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
      config.baseUrl = (data.settings.providers?.openai?.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
      config.apiKey = data.settings.providers?.openai?.apiKey || "";
      break;

    case "lmstudio":
      config.baseUrl = (data.settings.providers?.lmstudio?.baseUrl || "http://localhost:1234/v1").replace(/\/$/, "");
      config.apiKey = "not-needed"; // Local models don't use keys
      break;
      
    default:
      throw new Error(`Unknown provider: ${type}`);
  }

  return config;
}

/**
 * Unified Request Maker
 */
async function makeRequest(endpoint, options = {}, config = null) {
  const cfg = config || getProviderConfig();

  if (!cfg.apiKey && cfg.type !== "lmstudio") {
    throw new Error(`Authentication required for ${cfg.type}. Please check settings.`);
  }

  const headers = {
    "Content-Type": "application/json",
    ...cfg.headers,
    ...options.headers,
  };

  if (cfg.apiKey && cfg.type !== "lmstudio") {
    headers["Authorization"] = `Bearer ${cfg.apiKey}`;
  }

  // Use Proxy if enabled and type is OpenAI (to avoid CORS)
  if (cfg.type === "openai" && isProxyEnabled()) {
    try {
      const response = await proxyRequest(cfg.baseUrl, cfg.apiKey, endpoint, {
        method: options.method || "POST",
        headers,
        body: options.body
      });
      if (!response.ok) await handleApiError(response);
      return response;
    } catch (error) {
      console.error("Proxy Request Error:", error);
      throw error;
    }
  }

  // Direct Request
  try {
    const response = await fetch(`${cfg.baseUrl}${endpoint}`, {
      ...options,
      headers
    });
    if (!response.ok) await handleApiError(response);
    return response;
  } catch (error) {
    console.error("Network/CORS Error:", error);
    // Nice user message for LM Studio specifically
    if (cfg.type === "lmstudio" && error.message.includes("Failed to fetch")) {
      throw new Error("Unable to reach LM Studio. Is the local server running at " + cfg.baseUrl + "?");
    }
    throw error;
  }
}

/**
 * Standardized API Error Handling
 */
async function handleApiError(response) {
  const data = await response.json().catch(() => ({}));
  const msg = data.error?.message || `API Error ${response.status}`;
  const err = new Error(msg);
  err.status = response.status;
  err.code = data.error?.code;
  
  if (response.status === 401) err.message = "Authentication failed. Check API Key or Login.";
  if (response.status === 402) err.message = "Insufficient credits/quota.";
  if (response.status === 429) err.message = "Rate limited. Please wait a moment.";
  
  throw err;
}

/**
 * Fetch Available Models
 */
export async function fetchModels() {
  const config = getProviderConfig();
  try {
    const response = await makeRequest("/models", { method: "GET" }, config);
    const json = await response.json();
    
    // Normalize list (OpenRouter .data, OpenAI .data, LMStudio varies)
    const rawList = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
    
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
                         m.id.includes("o1") || 
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
 */
export async function sendChatCompletion(messages, model, options = {}) {
  const config = getProviderConfig();
  
  // Common payload
  const payload = {
    model,
    messages,
    stream: true,
    temperature: options.temperature ?? 1.0
  };

  // Add Reasoning Params (if applicable and enabled)
  if (options.reasoningEnabled && config.type === "openrouter") {
     // Only OpenRouter officially exposes strict parameters for reasoning this way for now
     // Other providers pass them transparently if supported models are used
     payload.reasoning = {
       effort: options.reasoningEffort || "medium"
     };
     if (options.reasoningMaxTokens) {
       // Note: Some models might require integer parsing here
       // Keeping simple logic for now
     }
  }
  
  // System Prompt Support (prepend if exists)
  if (options.system) {
    payload.messages = [{ role: "system", content: options.system }, ...messages];
  }

  // Response Format (JSON Mode / Schema)
  if (options.responseFormat || options.jsonSchema) {
    // Map simplified jsonSchema option to OpenAI standard response_format
    if (options.jsonSchema) {
      payload.response_format = {
        type: "json_schema",
        json_schema: options.jsonSchema
      };
    } else {
      payload.response_format = options.responseFormat;
    }
  }

  return await makeRequest("/chat/completions", {
    method: "POST",
    body: JSON.stringify(payload)
  }, config);
}

/**
 * Unified Streaming Parser (Server-Sent Events)
 */
export async function* parseStreamingResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.error) throw new Error(json.error.message);
          yield json;
        } catch (e) {
          console.warn("Stream Parse Warning:", e);
        }
      }
    }
  } finally {
    reader.releaseLock();
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