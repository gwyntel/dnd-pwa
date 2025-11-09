/**
 * OpenRouter API integration
 * Handles model listing and chat completions
 */

import { getAccessToken } from "./auth.js"
import { loadData } from "./storage.js"

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
const APP_REFERER = "https://github.com/gwyntel/dnd-pwa"
const APP_TITLE = "D&D PWA"

/**
 * Make authenticated request to OpenRouter
 */
async function makeRequest(endpoint, options = {}) {
  const token = getAccessToken()
  if (!token) {
    throw new Error("Not authenticated")
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "HTTP-Referer": APP_REFERER,
    "X-Title": APP_TITLE,
    "Content-Type": "application/json",
    ...options.headers,
  }

  try {
    const response = await fetch(`${OPENROUTER_API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    // Handle token expiration
    if (response.status === 401) {
      throw new Error("Authentication expired. Please log in again.")
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API request failed: ${response.status}`)
    }

    return response
  } catch (error) {
    console.error("OpenRouter API error:", error)
    throw error
  }
}

/**
 * Fetch available models from OpenRouter
 */
export async function fetchModels() {
  try {
    const response = await makeRequest("/models")
    const data = await response.json()

    // Transform model data for easier use
    return data.data.map((model) => ({
      id: model.id,
      name: model.name || model.id,
      contextLength: model.context_length,
      pricing: {
        prompt: model.pricing?.prompt || 0,
        completion: model.pricing?.completion || 0,
      },
      supportsReasoning: model.supports_reasoning || false,
      provider: model.id.split("/")[0] || "unknown",
    }))
  } catch (error) {
    console.error("Error fetching models:", error)
    throw error
  }
}

/**
 * Send chat completion request (streaming)
 */
export async function sendChatCompletion(messages, model, options = {}) {
  try {
    const data = loadData()
    const temperature = options.temperature !== undefined ? options.temperature : data.settings.temperature || 1.0

    const response = await makeRequest("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature,
        ...options,
      }),
    })

    return response
  } catch (error) {
    console.error("Error sending chat completion:", error)
    throw error
  }
}

/**
 * Parse streaming response
 */
export async function* parseStreamingResponse(response) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      // Append new chunk to buffer
      buffer += decoder.decode(value, { stream: true })

      // Process complete lines from buffer
      while (true) {
        const lineEnd = buffer.indexOf("\n")
        if (lineEnd === -1) break

        const line = buffer.slice(0, lineEnd).trim()
        buffer = buffer.slice(lineEnd + 1)

        // Skip empty lines and comments (SSE spec)
        if (!line || line.startsWith(":")) continue

        // Check for [DONE] marker
        if (line === "data: [DONE]") break

        // Parse data lines
        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            yield parsed
          } catch (e) {
            console.warn("Failed to parse SSE data:", line)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Extract usage information from completion response
 */
export function extractUsage(data) {
  const usage = data.usage || {}
  return {
    promptTokens: usage.prompt_tokens || 0,
    completionTokens: usage.completion_tokens || 0,
    reasoningTokens: usage.completion_tokens_details?.reasoning_tokens || 0,
    totalTokens: usage.total_tokens || 0,
  }
}

/**
 * Calculate cost based on model pricing and usage
 */
export function calculateCost(usage, pricing) {
  const promptCost = (usage.promptTokens / 1000000) * pricing.prompt
  const completionCost = (usage.completionTokens / 1000000) * pricing.completion
  return promptCost + completionCost
}

/**
 * Test API connection
 */
export async function testConnection() {
  try {
    await fetchModels()
    return true
  } catch (error) {
    return false
  }
}
