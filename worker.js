// Cloudflare Worker for SPA fallback with static assets from ./dist
// - Serves built assets normally from ASSETS binding
// - Falls back to /index.html for client routes (no extension)
// - Critical: correctly strip `/auth` prefix so asset URLs resolve to built paths.
// - Provides /api/proxy endpoint for server-side API calls (bypasses CORS)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // IMPORTANT: Handle API proxy requests FIRST, before any asset handling
    // This prevents ASSETS binding from intercepting these requests
    if (url.pathname === '/api/proxy' || url.pathname.startsWith('/api/proxy/')) {
      console.log('[Worker] Handling proxy request:', request.method, url.pathname);
      return handleProxyRequest(request);
    }

    // If we're under /auth or /game, normalize paths so assets and manifest load correctly.
    // Example:
    //   /auth/assets/index.js       -> /assets/index.js
    //   /auth/manifest.json         -> /manifest.json
    //   /auth/callback?code=...     -> SPA route -> index.html
    //   /game/assets/index.js       -> /assets/index.js
    //   /game/manifest.json         -> /manifest.json
    if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/game/")) {
      const prefix = url.pathname.startsWith("/auth/") ? "/auth" : "/game";
      const subPath = url.pathname.slice(prefix.length); // keep leading '/' on remainder

      // Asset or manifest under /auth or /game -> strip prefix and fetch real asset.
      if (subPath.startsWith("/assets/") || subPath === "/manifest.json" || subPath === "/favicon.ico") {
        const rewritten = new URL(subPath, request.url);
        const assetReq = new Request(rewritten.toString(), request);
        const assetRes = await env.ASSETS.fetch(assetReq);
        if (assetRes.status !== 404) {
          return assetRes;
        }
        // If not found as asset, fall through to SPA handling below.
      }

      // For /auth/callback, /game/... and any other path without an extension:
      // treat as SPA route -> serve index.html so client-side code can run.
      const lastSegment = subPath.split("/").pop() || "";
      const hasExt = lastSegment.includes(".");
      if (!hasExt) {
        const indexUrl = new URL("/", request.url);
        const indexReq = new Request(indexUrl.toString(), request);
        return env.ASSETS.fetch(indexReq);
      }
      // If it has an extension and wasn't returned above, let it 404 below.
    }

    // Default behavior for non-/auth paths:
    // Try to serve the requested path from ASSETS.
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // If ASSETS returns 404 and this looks like a SPA route (no extension),
    // fall back to index.html.
    if (isSpaRoute(url.pathname)) {
      const indexUrl = new URL("/", request.url);
      const indexRequest = new Request(indexUrl.toString(), request);
      return env.ASSETS.fetch(indexRequest);
    }

    // Otherwise, return the original 404.
    return assetResponse;
  },
};

/**
 * Handle API proxy requests
 * POST /api/proxy - Proxy OpenAI-compatible API requests
 */
async function handleProxyRequest(request) {
  // Handle CORS preflight first
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // Only allow POST requests to the proxy endpoint
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      detail: `Received ${request.method} request, but /api/proxy only accepts POST`
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    // Parse the proxy request payload
    const payload = await request.json();
    const { baseUrl, apiKey, endpoint, method, headers: customHeaders, body } = payload;

    // Validate required fields
    if (!baseUrl || !endpoint) {
      return new Response(JSON.stringify({ error: 'Missing required fields: baseUrl, endpoint' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Construct the target URL
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const targetUrl = `${cleanBaseUrl}${endpoint}`;

    // Build request headers
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    // Add Authorization header if API key is provided
    if (apiKey) {
      requestHeaders['Authorization'] = `Bearer ${apiKey}`;
    }

    // Make the proxied request
    const targetMethod = method || 'POST';
    const targetOptions = {
      method: targetMethod,
      headers: requestHeaders,
    };

    // Add body for POST/PUT/PATCH requests
    if (body && ['POST', 'PUT', 'PATCH'].includes(targetMethod.toUpperCase())) {
      targetOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(targetUrl, targetOptions);

    // Get response headers to pass through
    const responseHeaders = {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    // For streaming responses, pass through the stream
    if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
      responseHeaders['Content-Type'] = 'text/event-stream';
      responseHeaders['Cache-Control'] = 'no-cache';
      responseHeaders['Connection'] = 'keep-alive';
      
      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // For non-streaming responses, return the full response
    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ 
      error: 'Proxy request failed',
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Treat as SPA route if:
// - It has no file extension (no '.' in last path segment)
function isSpaRoute(pathname) {
  if (pathname === "/" || pathname === "") return true;
  const lastSegment = pathname.split("/").pop() || "";
  return !lastSegment.includes(".");
}
