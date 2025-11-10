/**
 * OpenRouter PKCE OAuth Authentication
 * Client-side OAuth flow without backend
 */

const OPENROUTER_AUTH_URL = "https://openrouter.ai/auth"
const OPENROUTER_TOKEN_URL = "https://openrouter.ai/api/v1/auth/keys"
const CALLBACK_URL = window.location.origin + "/auth/callback"

// Session storage keys
const TOKEN_KEY = "openrouter_access_token"
const CODE_VERIFIER_KEY = "pkce_code_verifier"

/**
 * Generate random string for PKCE code verifier
 */
function generateRandomString(length) {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join("")
}

/**
 * Generate SHA-256 hash and return base64url encoded
 */
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest("SHA-256", data)

  // Convert to base64url
  const bytes = new Uint8Array(hash)
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

/**
 * Start OAuth flow
 */
export async function startAuth() {
  try {
    // Generate PKCE parameters
    const codeVerifier = generateRandomString(128)
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // Store code verifier for later
    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier)

    // Build authorization URL (OpenRouter uses callback_url, not redirect_uri)
    const params = new URLSearchParams({
      callback_url: CALLBACK_URL,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    // Redirect to OpenRouter auth
    window.location.href = `${OPENROUTER_AUTH_URL}?${params.toString()}`
  } catch (error) {
    console.error("Error starting auth:", error)
    throw error
  }
}

/**
 * Handle OAuth callback
 */
export async function handleAuthCallback() {
  try {
    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")

    if (!code) {
      throw new Error("No authorization code received")
    }

    // Get stored code verifier
    const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY)
    if (!codeVerifier) {
      throw new Error("Code verifier not found")
    }

    // Exchange code for API key
    const response = await fetch(OPENROUTER_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        code_challenge_method: "S256",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Token exchange failed: ${errorText}`)
    }

    const data = await response.json()

    // Store API key in session storage
    sessionStorage.setItem(TOKEN_KEY, data.key)

    // Clean up
    sessionStorage.removeItem(CODE_VERIFIER_KEY)

    return data.key
  } catch (error) {
    console.error("Error handling auth callback:", error)
    throw error
  }
}

/**
 * Get current access token
 */
export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken()
}

/**
 * Logout (clear tokens)
 */
export function logout() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
}

/**
 * Alternative: Direct API key input (for development/testing)
 */
export function setApiKey(apiKey) {
  sessionStorage.setItem(TOKEN_KEY, apiKey)
}

/**
 * Auto-login using environment variable if available
 * Checks for VITE_OPENROUTER_API_KEY in .env file
 */
export function autoLogin() {
  // Check if already authenticated
  if (isAuthenticated()) {
    return true
  }

  // Check for environment variable
  const envApiKey = import.meta.env.VITE_OPENROUTER_API_KEY

  if (envApiKey && envApiKey.startsWith("sk-or-")) {
    console.log("Auto-login: Using API key from environment variable")
    setApiKey(envApiKey)
    return true
  }

  return false
}

/**
 * Removed getDefaultModelFromEnv() duplicate - use model-utils.js instead
 */
