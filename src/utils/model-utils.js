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
 * Get clean model ID (currently a pass-through)
 * Kept for backward compatibility - now passes :nitro tags to API
 */
export function getCleanModelId(modelId) {
  return modelId
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
 * Get the provider module (Unified)
 */
export async function getProvider() {
  return import("./ai-provider.js");
}
