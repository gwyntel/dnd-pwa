# Implementation Plan

[Overview]
This document outlines the plan to add two new secondary providers for chat completions: a generic OpenAI-compatible provider and an LM Studio provider, ensuring full feature parity with the existing OpenRouter integration.

Both providers will use OpenAI-compatible endpoints. The key distinction is:
- **OpenAI Provider**: Generic implementation for any OpenAI-compatible API (custom base URL + API key)
- **LM Studio Provider**: Specialized for LM Studio's local server (default: http://localhost:1234/v1, no authentication required)

LM Studio API Details (from docs-mcp):
- Base URL: `http://localhost:1234/v1` (default, user-configurable)
- Authentication: None required (uses dummy "lm-studio" API key)
- Endpoints: `/v1/models` (GET), `/v1/chat/completions` (POST)
- Supported parameters: model, messages, temperature, top_p, top_k, max_tokens, stream, stop, presence_penalty, frequency_penalty, logit_bias, repeat_penalty, seed
- Model metadata may be limited compared to OpenRouter (context length, pricing, reasoning support will need special handling)

[Types]
We will extend the existing settings data structure to include provider selection and configuration:

```javascript
settings: {
  provider: "openrouter" | "openai" | "lmstudio",
  providers: {
    openrouter: {
      apiKey: string  // Already exists via auth.js
    },
    openai: {
      baseUrl: string,
      apiKey: string
    },
    lmstudio: {
      baseUrl: string  // Default: "http://localhost:1234"
    }
  },
  // ... existing settings
}
```

Model data structure will remain the same, but we'll need to handle cases where certain metadata (like pricing, reasoning support) may not be available from all providers.

[Files]
This implementation will involve creating two new files and modifying three existing files.

- **New Files:**
  - `src/utils/openai.js`: This file will contain the logic for interacting with any OpenAI-compatible API (generic provider), including fetching models and sending chat completion requests. Will require base URL and API key configuration.
  - `src/utils/lmstudio.js`: This file will contain the logic for interacting with the LM Studio local server API, including fetching models and sending chat completion requests. Will use default localhost:1234 with no authentication, but allow base URL override.

- **Modified Files:**
  - `src/utils/storage.js`: May need to update default settings structure to include provider configuration
  - `src/utils/model-utils.js`: This file will be modified to include a provider factory (`getProvider()`) that returns the appropriate provider module based on settings
  - `src/views/settings.js`: This file will be modified to include:
    - Provider selection dropdown (OpenRouter, OpenAI-Compatible, LM Studio)
    - Provider-specific configuration UI (base URL for OpenAI/LM Studio, API key for OpenAI)
    - Hide/show configuration based on selected provider
  - `src/views/models.js`: This file will be modified to:
    - Use the provider factory to fetch models from the selected provider
    - Handle cases where model metadata may be incomplete (e.g., no pricing from LM Studio)
  - `src/views/game.js` (and other files using chat completions): Will need to be updated to use the provider factory instead of directly importing from openrouter.js

[Functions]
This implementation will involve creating new functions and modifying existing functions.

- **New Functions:**
  - `fetchModels()` in `src/utils/openai.js`: Fetch models from OpenAI-compatible endpoint. Returns normalized model array matching OpenRouter's format.
  - `sendChatCompletion(messages, model, options)` in `src/utils/openai.js`: Send chat completion request. Mirror OpenRouter's function signature for compatibility.
  - `parseStreamingResponse(response)` in `src/utils/openai.js`: Parse SSE streaming response. Match OpenRouter's implementation.
  - `extractUsage(data)` in `src/utils/openai.js`: Extract token usage from response.
  - `calculateCost(usage, pricing)` in `src/utils/openai.js`: Calculate cost (will return 0 for providers without pricing).
  - `testConnection()` in `src/utils/openai.js`: Test API connectivity.
  
  - `fetchModels()` in `src/utils/lmstudio.js`: Fetch models from LM Studio. Returns normalized model array.
  - `sendChatCompletion(messages, model, options)` in `src/utils/lmstudio.js`: Send chat completion to LM Studio.
  - `parseStreamingResponse(response)` in `src/utils/lmstudio.js`: Parse SSE streaming response.
  - `extractUsage(data)` in `src/utils/lmstudio.js`: Extract token usage.
  - `calculateCost(usage, pricing)` in `src/utils/lmstudio.js`: Always returns 0 (local models have no API cost).
  - `testConnection()` in `src/utils/lmstudio.js`: Test LM Studio connectivity.
  
  - `getProvider()` in `src/utils/model-utils.js`: Provider factory function. Returns the appropriate provider module based on settings.provider. Will dynamically import the correct provider module.

- **Modified Functions:**
  - `renderSettings()` in `src/views/settings.js`: Add provider selection UI and provider-specific configuration forms. Update event handlers to save provider settings.
  - `renderModels()` in `src/views/models.js`: Replace direct `fetchModels()` import with `getProvider().fetchModels()`. Handle missing metadata gracefully (e.g., show "N/A" for pricing if not available).
  - `selectModel()` in `src/views/models.js`: May need to validate that selected model is compatible with current provider.
  - All functions in `src/views/game.js` that call chat completion: Update to use `getProvider().sendChatCompletion()` instead of direct OpenRouter import.
  - `loadData()` and default settings in `src/utils/storage.js`: Update to include default provider configuration if not present.

[Classes]
No new classes will be introduced.

[Dependencies]
No new dependencies will be added. The implementation will use existing fetch API and JavaScript module system.

[Testing]
The testing approach will involve manual testing of the new provider integrations.

- **Test Cases:**
  - OpenRouter (ensure no regressions):
    - Verify existing OpenRouter functionality works unchanged
    - Test model fetching, selection, and chat completions
    - Verify reasoning tokens and other OpenRouter-specific features work
  
  - OpenAI-Compatible Provider:
    - Configure with valid OpenAI API credentials (or other compatible provider)
    - Test model listing
    - Test chat completions with various parameters (temperature, max_tokens, etc.)
    - Verify error handling for invalid credentials or network issues
  
  - LM Studio Provider:
    - Start LM Studio local server
    - Test connectivity to default localhost:1234
    - Test model listing (should show loaded/available models)
    - Test chat completions with loaded model
    - Verify streaming works correctly
    - Test with custom base URL configuration
    - Verify graceful handling when LM Studio is not running
  
  - Provider Switching:
    - Test switching between providers in settings
    - Verify that each provider's configuration is preserved when switching
    - Ensure model selection resets/validates when switching providers
    - Test that game chat works after provider switch

[Implementation Order]
The implementation will be carried out in the following order:

1.  **Update storage defaults** (`src/utils/storage.js`):
    - Add default provider configuration to settings structure
    - Ensure backward compatibility with existing data

2.  **Create provider modules**:
    - Create `src/utils/openai.js` with full OpenAI-compatible API implementation
    - Create `src/utils/lmstudio.js` with LM Studio-specific implementation
    - Both modules must export the same interface as openrouter.js for compatibility

3.  **Create provider factory** (`src/utils/model-utils.js`):
    - Implement `getProvider()` function that returns the correct provider based on settings
    - Handle dynamic imports and error cases

4.  **Update settings UI** (`src/views/settings.js`):
    - Add provider selection dropdown
    - Add provider-specific configuration forms (base URL, API key)
    - Add visibility logic to show/hide relevant config per provider
    - Update save/load logic for provider settings

5.  **Update models view** (`src/views/models.js`):
    - Replace direct openrouter import with provider factory
    - Handle cases where model metadata may be incomplete
    - Update display logic to gracefully show "N/A" for missing data

6.  **Update game/chat logic** (`src/views/game.js` and related files):
    - Replace direct openrouter imports with provider factory
    - Ensure all chat completion calls use the provider factory
    - Test that reasoning tokens and other features work across providers

7.  **Testing and refinement**:
    - Manual testing with all three providers
    - Test error handling and edge cases
    - Verify no regressions in existing OpenRouter functionality
    - Document any provider-specific limitations or behaviors

8.  **Commit changes**:
    - Make git commits after each major milestone
    - Ensure commit messages are descriptive
