/**
 * Proxy utility functions for backend API calls
 * Provides functions to make API requests through the Cloudflare Worker proxy
 * to bypass CORS restrictions
 */

import { loadData, saveData } from "./storage.js"

/**
 * Check if the proxy is enabled in settings
 * @returns {boolean} True if proxy is enabled
 */
export function isProxyEnabled() {
  const data = loadData()
  return data.settings.useProxy === true
}

/**
 * Enable or disable the proxy
 * @param {boolean} enabled - Whether to enable the proxy
 */
export function setProxyEnabled(enabled) {
  const data = loadData()
  data.settings.useProxy = enabled
  saveData(data)
}

/**
 * Get the proxy endpoint URL
 * @returns {string} The proxy endpoint URL
 */
export function getProxyUrl() {
  // In development, use the local dev server
  if (import.meta.env.DEV) {
    return '/api/proxy'
  }
  
  // In production, use the deployed worker URL
  return `${window.location.origin}/api/proxy`
}

/**
 * Make an API request through the backend proxy
 * @param {string} baseUrl - The base URL of the API (e.g., https://api.openai.com/v1)
 * @param {string} apiKey - The API key for authentication
 * @param {string} endpoint - The API endpoint (e.g., /models, /chat/completions)
 * @param {Object} options - Fetch options (method, headers, body)
 * @returns {Promise<Response>} The fetch response
 */
export async function proxyRequest(baseUrl, apiKey, endpoint, options = {}) {
  const proxyUrl = getProxyUrl()
  
  // Prepare the proxy payload
  const payload = {
    baseUrl,
    apiKey,
    endpoint,
    method: options.method || 'POST',
    headers: options.headers || {},
    body: options.body,
  }
  
  // Make the request to the proxy
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  
  return response
}

/**
 * Test the proxy connection
 * @param {string} baseUrl - The base URL to test
 * @param {string} apiKey - The API key to test
 * @returns {Promise<boolean>} True if connection successful
 */
export async function testProxyConnection(baseUrl, apiKey) {
  try {
    const response = await proxyRequest(baseUrl, apiKey, '/models', {
      method: 'GET',
    })
    
    return response.ok
  } catch (error) {
    console.error('Proxy connection test failed:', error)
    return false
  }
}
