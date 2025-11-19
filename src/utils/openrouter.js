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

    // Check for pre-stream errors (HTTP status will match error code)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorCode = response.status
      const errorMessage = errorData.error?.message || `API request failed`
      const metadata = errorData.error?.metadata

      // Build user-friendly error message based on error code
      let userMessage = errorMessage

      switch (errorCode) {
        case 400:
          userMessage = "Bad request: " + errorMessage
          break
        case 401:
          userMessage = "Authentication expired. Please log in again."
          break
        case 402:
          userMessage = "Insufficient credits. Please add credits to your OpenRouter account."
          break
        case 403:
          if (metadata?.reasons) {
            userMessage = `Input flagged by moderation: ${metadata.reasons.join(", ")}`
          } else {
            userMessage = "Input was blocked by content moderation."
          }
          break
        case 408:
          userMessage = "Request timed out. The model took too long to respond. Please try again."
          break
        case 429:
          userMessage = "Rate limited. Please wait a moment and try again."
          break
        case 502:
          if (metadata?.provider_name) {
            userMessage = `Model provider (${metadata.provider_name}) is currently down or returned an invalid response. Try a different model.`
          } else {
            userMessage = "Model is currently unavailable. Please try a different model."
          }
          break
        case 503:
          userMessage = "No available model provider meets requirements. Please try again or choose a different model."
          break
        default:
          userMessage = `Error ${errorCode}: ${errorMessage}`
      }

      const error = new Error(userMessage)
      error.code = errorCode
      error.metadata = metadata
      error.rawMessage = errorMessage
      throw error
    }

    return response
  } catch (error) {
    // Re-throw our formatted errors
    if (error.code) {
      throw error
    }

    // Network or other errors
    console.error("OpenRouter API error:", error)
    throw new Error("Network error: Unable to reach OpenRouter. Please check your connection.")
  }
}

/**
 * Detect reasoning type based on model ID
 * @param {string} modelId - The model ID
 * @returns {"effort" | "max_tokens" | null} - The reasoning type
 */
function detectReasoningType(modelId) {
  const lowerModelId = modelId.toLowerCase()
  
  // OpenAI reasoning models: o1, o3, gpt-5 series use effort-based reasoning
  if (lowerModelId.includes("/o1") || lowerModelId.includes("/o3") || lowerModelId.includes("/gpt-5")) {
    return "effort"
  }
  
  // xAI Grok models use effort-based reasoning
  if (lowerModelId.includes("grok")) {
    return "effort"
  }
  
  // Anthropic Claude models use max_tokens-based reasoning
  if (lowerModelId.includes("claude")) {
    return "max_tokens"
  }
  
  // Google Gemini thinking models use max_tokens-based reasoning
  if (lowerModelId.includes("gemini") && lowerModelId.includes("thinking")) {
    return "max_tokens"
  }
  
  // Alibaba Qwen models - some support max_tokens (check model description for thinking_budget)
  // For now, default to max_tokens for qwen models with "thinking" in the name
  if (lowerModelId.includes("qwen") && lowerModelId.includes("thinking")) {
    return "max_tokens"
  }
  
  // DeepSeek reasoning models
  if (lowerModelId.includes("deepseek") && (lowerModelId.includes("-r1") || lowerModelId.includes("reasoning"))) {
    return "max_tokens"
  }
  
  // MiniMax M2
  if (lowerModelId.includes("minimax") && lowerModelId.includes("m2")) {
    return "max_tokens"
  }
  
  // Kimi K2 Thinking
  if (lowerModelId.includes("kimi") && lowerModelId.includes("k2") && lowerModelId.includes("thinking")) {
    return "max_tokens"
  }
  
  return null
}

/**
 * Fetch available models from OpenRouter
 */
export async function fetchModels() {
  try {
    const response = await makeRequest("/models")
    const data = await response.json()

    // Transform model data for easier use
    return data.data.map((model) => {
      const supportedParameters = model.supported_parameters || []
      const supportsReasoning = supportedParameters.includes("reasoning")
      
      return {
        id: model.id,
        name: model.name || model.id,
        contextLength: model.context_length,
        pricing: {
          prompt: model.pricing?.prompt || 0,
          completion: model.pricing?.completion || 0,
        },
        // Check if model supports reasoning by looking for "reasoning" in supported_parameters array
        supportsReasoning: supportsReasoning,
        // Detect which type of reasoning parameters this model supports
        reasoningType: supportsReasoning ? detectReasoningType(model.id) : null,
        // OpenRouter models advertise supported parameters; use this to gate structured outputs and other features
        supportedParameters: supportedParameters,
        provider: model.id.split("/")[0] || "unknown",
      }
    })
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

    if (!messages || messages.length === 0) {
      throw new Error("Messages array cannot be empty")
    }

    // Ensure all messages conform to the OpenRouter/OpenAI schema
    const validMessages = messages
      .map((msg) => {
        const { role, content, name, tool_call_id } = msg

        if (!role || !["user", "assistant", "system", "tool"].includes(role)) {
          console.error("[v0] Invalid message role:", msg)
          // Skip invalid message
          return null
        }

        if (content === undefined || content === null) {
          console.error("[v0] Invalid message content:", msg)
          // Skip invalid message
          return null
        }

        const apiMsg = { role }

        if (role === "tool") {
          if (!tool_call_id) {
            console.error("[v0] Message with role 'tool' must have a 'tool_call_id'", msg)
            return null
          }
          apiMsg.tool_call_id = tool_call_id
          apiMsg.content = String(content)
        } else {
          // For user, assistant, system
          // The API supports multi-part content for user roles, but we are only sending strings for now.
          apiMsg.content = String(content)
        }

        if (name) {
          apiMsg.name = name
        }

        return apiMsg
      })
      .filter(Boolean) // Remove any null messages that failed validation

    console.log("[v0] Sending payload with", validMessages.length, "messages")

    const payload = {
      model,
      messages: validMessages,
      stream: true,
      temperature,
    }

    // Refactored: Directly construct the reasoning payload from settings
    if (options.modelSupportsReasoning && options.reasoningEnabled) {
      const reasoningPayload = {
        enabled: true, // Always explicitly enable if we're in this block
      }
      
      const reasoningType = options.reasoningType || detectReasoningType(model)
      
      if (reasoningType === 'effort') {
        // Use the configured effort, or default to 'medium'
        reasoningPayload.effort = options.reasoningEffort || 'medium'
      } else if (reasoningType === 'max_tokens') {
        // Use the configured max_tokens if available, otherwise let the API use its default
        if (options.reasoningMaxTokens) {
          reasoningPayload.max_tokens = Number(options.reasoningMaxTokens)
        }
      }
      
      payload.reasoning = reasoningPayload
    }

    // Optional system message support (kept for backwards compatibility)
    if (options.system) {
      payload.messages.unshift({
        role: "system",
        content: String(options.system),
      })
    }

    // Optional JSON schema structured outputs support.
    // Callers may pass:
    //  - options.responseFormat: already a full OpenRouter/OpenAI-style response_format object
    //  - or options.jsonSchema: { name, strict, schema } to auto-wrap as response_format.
    if (options.responseFormat) {
      payload.response_format = options.responseFormat
    } else if (options.jsonSchema) {
      const { name, strict = true, schema } = options.jsonSchema
      if (name && schema) {
        payload.response_format = {
          type: "json_schema",
          json_schema: {
            name,
            strict,
            schema,
          },
        }
      }
    }

    // Only add specific supported options if provided
    if (options.max_tokens) payload.max_tokens = options.max_tokens
    if (options.top_p) payload.top_p = options.top_p
    if (options.frequency_penalty) payload.frequency_penalty = options.frequency_penalty
    if (options.presence_penalty) payload.presence_penalty = options.presence_penalty

    const response = await makeRequest("/chat/completions", {
      method: "POST",
      body: JSON.stringify(payload),
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

            if (parsed.error) {
              const errorCode = parsed.error.code
              const errorMessage = parsed.error.message
              const metadata = parsed.error.metadata

              let userMessage = errorMessage

              switch (errorCode) {
                case 402:
                  userMessage = "Insufficient credits during generation. Please add credits to your OpenRouter account."
                  break
                case 408:
                  userMessage = "Model timed out during generation. Please try again."
                  break
                case 502:
                  if (metadata?.provider_name) {
                    userMessage = `Model provider (${metadata.provider_name}) encountered an error during generation.`
                  } else {
                    userMessage = "Model encountered an error during generation."
                  }
                  break
                default:
                  userMessage = `Generation error: ${errorMessage}`
              }

              const error = new Error(userMessage)
              error.code = errorCode
              error.metadata = metadata
              error.isMidStream = true
              throw error
            }

            yield parsed
          } catch (e) {
            // Re-throw our error objects
            if (e.isMidStream) {
              throw e
            }
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
 * Note: OpenRouter API returns pricing in $/token, not $/million tokens
 */
export function calculateCost(usage, pricing) {
  const promptCost = usage.promptTokens * Number(pricing.prompt)
  const completionCost = usage.completionTokens * Number(pricing.completion)
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
