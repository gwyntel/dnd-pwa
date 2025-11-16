/**
 * OpenAI-compatible API integration
 * Handles model listing and chat completions for any OpenAI-compatible endpoint
 */

import { loadData } from "./storage.js"

/**
 * Get provider configuration from settings
 */
function getProviderConfig() {
  const data = loadData()
  const config = data.settings.providers?.openai || {}
  
  if (!config.baseUrl) {
    throw new Error("OpenAI provider base URL not configured")
  }
  
  if (!config.apiKey) {
    throw new Error("OpenAI provider API key not configured")
  }
  
  return {
    baseUrl: config.baseUrl.replace(/\/$/, ""), // Remove trailing slash
    apiKey: config.apiKey,
  }
}

/**
 * Make authenticated request to OpenAI-compatible API
 */
async function makeRequest(endpoint, options = {}) {
  const config = getProviderConfig()
  
  const headers = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    ...options.headers,
  }

  try {
    const response = await fetch(`${config.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorCode = response.status
      const errorMessage = errorData.error?.message || `API request failed`

      let userMessage = errorMessage

      switch (errorCode) {
        case 400:
          userMessage = "Bad request: " + errorMessage
          break
        case 401:
          userMessage = "Authentication failed. Please check your API key."
          break
        case 402:
          userMessage = "Insufficient credits. Please add credits to your account."
          break
        case 403:
          userMessage = "Access forbidden: " + errorMessage
          break
        case 408:
          userMessage = "Request timed out. The model took too long to respond. Please try again."
          break
        case 429:
          userMessage = "Rate limited. Please wait a moment and try again."
          break
        case 500:
        case 502:
        case 503:
          userMessage = "Server error. Please try again later."
          break
        default:
          userMessage = `Error ${errorCode}: ${errorMessage}`
      }

      const error = new Error(userMessage)
      error.code = errorCode
      error.rawMessage = errorMessage
      throw error
    }

    return response
  } catch (error) {
    if (error.code) {
      throw error
    }

    console.error("OpenAI API error:", error)
    throw new Error("Network error: Unable to reach API endpoint. Please check your connection and base URL.")
  }
}

/**
 * Detect reasoning type based on model ID (OpenAI-compatible)
 * @param {string} modelId - The model ID
 * @returns {"effort" | "max_tokens" | null} - The reasoning type
 */
function detectReasoningType(modelId) {
  const lowerModelId = modelId.toLowerCase()
  
  // OpenAI reasoning models: o1, o3 series use effort-based reasoning
  if (lowerModelId.includes("o1") || lowerModelId.includes("o3")) {
    return "effort"
  }
  
  // Claude models use max_tokens-based reasoning
  if (lowerModelId.includes("claude")) {
    return "max_tokens"
  }
  
  // Gemini thinking models use max_tokens-based reasoning
  if (lowerModelId.includes("gemini") && lowerModelId.includes("thinking")) {
    return "max_tokens"
  }
  
  // DeepSeek reasoning models
  if (lowerModelId.includes("deepseek") && (lowerModelId.includes("-r1") || lowerModelId.includes("reasoning"))) {
    return "max_tokens"
  }
  
  return null
}

/**
 * Fetch available models from OpenAI-compatible endpoint
 */
export async function fetchModels() {
  try {
    const response = await makeRequest("/models")
    const data = await response.json()

    // OpenAI API returns { data: [...models] }
    const models = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []

    return models.map((model) => {
      const modelId = model.id || model.model || "unknown"
      const supportsReasoning = detectReasoningType(modelId) !== null
      
      return {
        id: modelId,
        name: model.name || modelId,
        contextLength: model.context_window || model.max_model_len || 4096,
        pricing: {
          prompt: 0, // OpenAI-compatible APIs typically don't expose pricing
          completion: 0,
        },
        supportsReasoning: supportsReasoning,
        reasoningType: supportsReasoning ? detectReasoningType(modelId) : null,
        supportedParameters: [], // Not typically exposed by OpenAI-compatible APIs
        provider: "openai-compatible",
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

    // Ensure all messages conform to the OpenAI schema
    const validMessages = messages
      .map((msg) => {
        const { role, content, name, tool_call_id } = msg

        if (!role || !["user", "assistant", "system", "tool"].includes(role)) {
          console.error("Invalid message role:", msg)
          return null
        }

        if (content === undefined || content === null) {
          console.error("Invalid message content:", msg)
          return null
        }

        const apiMsg = { role }

        if (role === "tool") {
          if (!tool_call_id) {
            console.error("Message with role 'tool' must have a 'tool_call_id'", msg)
            return null
          }
          apiMsg.tool_call_id = tool_call_id
          apiMsg.content = String(content)
        } else {
          apiMsg.content = String(content)
        }

        if (name) {
          apiMsg.name = name
        }

        return apiMsg
      })
      .filter(Boolean)

    console.log("Sending payload with", validMessages.length, "messages")

    const payload = {
      model,
      messages: validMessages,
      stream: true,
      temperature,
    }

    // Handle reasoning parameters if model supports it
    const attachReasoning = (() => {
      if (options.reasoning) return true

      if (
        options.reasoningEffort !== undefined ||
        options.reasoningMaxTokens !== undefined ||
        options.reasoningEnabled !== undefined
      ) {
        if (typeof options.modelSupportsReasoning === "boolean") {
          return options.modelSupportsReasoning
        }
        return false
      }

      return false
    })()

    if (attachReasoning) {
      if (options.reasoning) {
        payload.reasoning = options.reasoning
      } else {
        const reasoning = {}
        const isReasoningEnabled = options.reasoningEnabled !== false
        
        if (isReasoningEnabled) {
          const reasoningType = options.reasoningType || detectReasoningType(model)
          
          if (reasoningType === "effort" && options.reasoningEffort) {
            reasoning.effort = options.reasoningEffort
          } else if (reasoningType === "max_tokens" && options.reasoningMaxTokens) {
            reasoning.max_tokens = Number(options.reasoningMaxTokens)
          } else if (reasoningType === "effort" && !options.reasoningEffort) {
            reasoning.effort = "medium"
          } else if (reasoningType === "max_tokens" && !options.reasoningMaxTokens) {
            reasoning.enabled = true
          }
        }

        if (Object.keys(reasoning).length > 0) {
          payload.reasoning = reasoning
        }
      }
    }

    // Optional system message support
    if (options.system) {
      payload.messages.unshift({
        role: "system",
        content: String(options.system),
      })
    }

    // Optional JSON schema structured outputs
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

    // Add optional parameters
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

      buffer += decoder.decode(value, { stream: true })

      while (true) {
        const lineEnd = buffer.indexOf("\n")
        if (lineEnd === -1) break

        const line = buffer.slice(0, lineEnd).trim()
        buffer = buffer.slice(lineEnd + 1)

        if (!line || line.startsWith(":")) continue

        if (line === "data: [DONE]") break

        if (line.startsWith("data: ")) {
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)

            if (parsed.error) {
              const errorCode = parsed.error.code || 500
              const errorMessage = parsed.error.message || "Unknown error"

              const error = new Error(`Generation error: ${errorMessage}`)
              error.code = errorCode
              error.isMidStream = true
              throw error
            }

            yield parsed
          } catch (e) {
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
 * Note: OpenAI-compatible providers typically don't expose pricing, so we return 0
 */
export function calculateCost(usage, pricing) {
  // Most OpenAI-compatible providers don't expose pricing information
  // Return 0 to indicate cost tracking is not available
  return 0
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
