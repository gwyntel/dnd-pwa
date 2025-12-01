/**
 * Model and Endpoint Utilities
 * Handles model selection, environment variables, Nitro detection, and provider factory
 */

import store from "../state/store.js"

/**
 * Detect if endpoint has :nitro suffix for fast throughput
 */
export function isNitroModel(modelId) {
  return modelId && modelId.includes(":nitro")
}

/**
 * Strip :nitro suffix for API calls
 */
export function getCleanModelId(modelId) {
  return modelId // Pass through full model ID including :nitro
}

/**
 * Get default model from environment variable
 * Unified function to handle VITE_DEFAULT_NARRATIVE_MODEL / VITE_DEFAULT_MODEL env vars
 */
export function getDefaultModelFromEnv() {
  // Check for both environment variable names (backwards compatible)
  const viteDefault = import.meta.env.VITE_DEFAULT_NARRATIVE_MODEL || import.meta.env.VITE_DEFAULT_MODEL
  return viteDefault || null
}

/**
 * Get available models or recommended defaults
 */
export function getRecommendedModels() {
  return [
    { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Fast, Cheap)", provider: "OpenAI" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (Smart)", provider: "Anthropic" },
    { id: "google/gemini-pro", name: "Gemini Pro (Balanced)", provider: "Google" },
    { id: "meta-llama/llama-2-70b-chat", name: "Llama 2 70B (Powerful)", provider: "Meta" },
  ]
}

/**
 * Validate model string format
 */
export function isValidModelId(modelId) {
  if (!modelId || typeof modelId !== "string") return false
  // Should have format like "provider/model-name" or "provider/model-name:nitro"
  const cleaned = modelId.replace(":nitro", "")
  return /^[a-z0-9-]+\/[a-z0-9-]+/.test(cleaned)
}

/**
 * Get the provider module (Unified)
 */
export async function getProvider() {
  // No switch case needed anymore!
  return import("./ai-provider.js");
}

/**
 * Get the current provider name
 * @returns {string} The current provider name
 */
export function getCurrentProvider() {
  const data = store.get()
  return data.settings?.provider || "openrouter"
}
