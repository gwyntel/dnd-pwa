/**
 * CORS detection and error handling utilities
 * Identifies CORS-related errors and provides guidance
 */

/**
 * Detect if an error is CORS-related
 * @param {Error} error - The error to check
 * @returns {boolean} True if the error is CORS-related
 */
export function isCorsError(error) {
  if (!error) return false
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorString = error.toString().toLowerCase()
  
  // Common CORS error indicators
  const corsIndicators = [
    'cors',
    'cross-origin',
    'blocked by cors policy',
    'no \'access-control-allow-origin\'',
    'access-control-allow-origin',
    'preflight',
    'access to fetch',
    'has been blocked',
  ]
  
  return corsIndicators.some(indicator => 
    errorMessage.includes(indicator) || errorString.includes(indicator)
  )
}

/**
 * Detect if a fetch failed due to network/CORS issues
 * @param {Error} error - The error to check
 * @returns {Object} Detection result with type and suggested action
 */
export function detectCorsIssue(error) {
  if (!error) {
    return {
      isCors: false,
      type: null,
      message: null,
      suggestedAction: null,
    }
  }
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorString = error.toString().toLowerCase()
  
  // Check for CORS errors
  if (isCorsError(error)) {
    return {
      isCors: true,
      type: 'cors',
      message: 'Request blocked by CORS policy',
      suggestedAction: 'enable_proxy',
      userMessage: 'This API doesn\'t support direct browser requests. Enable the backend proxy in settings to resolve this issue.',
    }
  }
  
  // Check for network errors that might be CORS
  if (errorMessage.includes('failed to fetch') || errorMessage.includes('network error')) {
    return {
      isCors: true,
      type: 'network',
      message: 'Network request failed (possibly CORS)',
      suggestedAction: 'enable_proxy',
      userMessage: 'Connection failed. This may be due to CORS restrictions. Try enabling the backend proxy in settings.',
    }
  }
  
  // Check for TypeError which often indicates CORS issues
  if (error.name === 'TypeError' && errorMessage.includes('fetch')) {
    return {
      isCors: true,
      type: 'type_error',
      message: 'Fetch failed (possibly CORS)',
      suggestedAction: 'enable_proxy',
      userMessage: 'Request failed. This API may require the backend proxy. Enable it in settings to continue.',
    }
  }
  
  // Not a CORS error
  return {
    isCors: false,
    type: null,
    message: error.message,
    suggestedAction: null,
    userMessage: error.message,
  }
}

/**
 * Get user-friendly guidance for CORS issues
 * @param {boolean} proxyEnabled - Whether the proxy is currently enabled
 * @returns {string} User guidance message
 */
export function getCorsGuidance(proxyEnabled) {
  if (proxyEnabled) {
    return 'The backend proxy is enabled but the request still failed. Please check your API configuration and try again.'
  }
  
  return 'This API doesn\'t support direct browser requests due to CORS restrictions. Enable the backend proxy in Settings to resolve this issue.'
}

/**
 * Create a user-friendly CORS error with guidance
 * @param {Error} originalError - The original error
 * @param {boolean} proxyEnabled - Whether the proxy is currently enabled
 * @returns {Error} Enhanced error with user guidance
 */
export function enhanceCorsError(originalError, proxyEnabled) {
  const detection = detectCorsIssue(originalError)
  
  if (!detection.isCors) {
    return originalError
  }
  
  const guidance = getCorsGuidance(proxyEnabled)
  const enhancedError = new Error(`${detection.message}\n\n${guidance}`)
  enhancedError.originalError = originalError
  enhancedError.isCors = true
  enhancedError.suggestedAction = detection.suggestedAction
  
  return enhancedError
}
