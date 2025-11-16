/**
 * LM Studio API integration
 * Handles model listing and chat completions for LM Studio local server
 */

import { loadData } from "./storage.js"

/**
 * Get provider configuration from settings
 */
function getProviderConfig() {
  const data = loadData()
  const config = data.settings.providers?.lmstudio || {}
  
  return {
    baseUrl: (config.baseUrl || "http://localhost:1234/v1").replace(/\/$/, ""), // Remove trailing slash
  }
}

/**
 * Make request to LM Studio API (no authentication required)
 */
async function makeRequest(endpoint, options = {}) {
  const config = getProviderConfig()
  
  const headers = {
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
        case 404:
          userMessage = "Endpoint not found. Is LM Studio running and a model loaded?"
          break
        case 408:
          userMessage = "Request timed out. The model took too long to respond. Please try again."
          break
        case 500:
        case 502:
        case 503:
          userMessage = "LM Studio server error. Please check that LM Studio is running properly."
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

    console.error("LM Studio API error:", error)
    
    // More specific error message for connection failures
    if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
      throw new Error("Unable to connect to LM Studio. Please ensure LM Studio is running and the server is started.")
    }
    
    throw new Error("Network error: Unable to reach LM Studio server. Please check that LM Studio is running.")
  }
}

/**
 * Detect reasoning type based on model ID
 * LM Studio can host various models, so we use similar detection logic
 * @param {string} modelId - The model ID
 * @returns {"effort" | "max_tokens" | null} - The reasoning type
 */
function detectReasoningType(modelId) {
  const lowerModelId = modelId.toLowerCase()
  
  // OpenAI reasoning models
  if (lowerModelId.includes("o1") || lowerModelId.includes("o3")) {
    return "effort"
  }
  
  // Claude models
  if (lowerModelId.includes("claude")) {
    return "max_tokens"
  }
  
  // Gemini thinking models
  if (lowerModelId.includes("gemini") && lowerModelId.includes("thinking")) {
    return "max_tokens"
  }
  
  // DeepSeek reasoning models
  if (lowerModelId.includes("deepseek") && (lowerModelId.includes("-r1") || lowerModelId.includes("reasoning"))) {
    return "max_tokens"
  }
  
  // Qwen thinking models
  if (lowerModelId.includes("qwen") && lowerModelId.includes("thinking")) {
    return "max_tokens"
  }
  
  return null
}

/**
 * Fetch available models from LM Studio
 */
export async function fetchModels() {
  try {
    const response = await makeRequest("/models")
    const data = await response.json()

    // LM Studio returns { data: [...models] } similar to OpenAI
    const models = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []

    return models.map((model) => {
      const modelId = model.id || model.model || "unknown"
      const supportsReasoning = detectReasoningType(modelId) !== null
      
      return {
        id: modelId,
        name: model.name || modelId,
        // LM Studio may provide context_length or max_model_len
        contextLength: model.context_length || model.max_model_len || 4096,
        pricing: {
          prompt: 0, // Local models have no API cost
          completion: 0,
        },
        supportsReasoning: supportsReasoning,
        reasoningType: supportsReasoning ? detectReasoningType(modelId) : null,
        supportedParameters: [], // LM Studio doesn't expose this
        provider: "lmstudio",
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

    // Ensure all messages conform to the OpenAI schema (LM Studio uses OpenAI-compatible format)
    const validMessages = messages
      .map((msg) => {
        const { role, content, name } = msg

        if (!role || !["user", "assistant", "system"].includes(role)) {
          console.error("Invalid message role:", msg)
          return null
        }

        if (content === undefined || content === null) {
          console.error("Invalid message content:", msg)
          return null
        }

        const apiMsg = {
          role,
          content: String(content),
        }

        if (name) {
          apiMsg.name = name
        }

        return apiMsg
      })
      .filter(Boolean)

    console.log("Sending payload with", validMessages.length, "messages to LM Studio")

    const payload = {
      model,
      messages: validMessages,
      stream: true,
      temperature,
    }

    // Handle reasoning parameters if model supports it
    // Note: LM Studio may not support all reasoning parameters
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

    // Add optional parameters (LM Studio supports many OpenAI parameters)
    if (options.max_tokens) payload.max_tokens = options.max_tokens
    if (options.top_p) payload.top_p = options.top_p
    if (options.frequency_penalty) payload.frequency_penalty = options.frequency_penalty
    if (options.presence_penalty) payload.presence_penalty = options.presence_penalty
    if (options.stop) payload.stop = options.stop

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
 * Note: LM Studio is local, so cost is always 0
 */
export function calculateCost(usage, pricing) {
  // Local models have no API cost
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
