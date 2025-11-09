// Cloudflare Worker for SPA fallback with static assets from ./dist
// - Serves built assets normally from ASSETS binding
// - Falls back to /index.html for client routes (no extension)
// - Critical: correctly strip `/auth` prefix so asset URLs resolve to built paths.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // If we're under /auth, normalize paths so assets and manifest load correctly.
    // Example:
    //   /auth/assets/index.js       -> /assets/index.js
    //   /auth/manifest.json         -> /manifest.json
    //   /auth/callback?code=...     -> SPA route -> index.html
    if (url.pathname.startsWith("/auth/")) {
      const subPath = url.pathname.slice("/auth".length); // keep leading '/' on remainder

      // Asset or manifest under /auth -> strip /auth and fetch real asset.
      if (subPath.startsWith("/assets/") || subPath === "/manifest.json" || subPath === "/favicon.ico") {
        const rewritten = new URL(subPath, request.url);
        const assetReq = new Request(rewritten.toString(), request);
        const assetRes = await env.ASSETS.fetch(assetReq);
        if (assetRes.status !== 404) {
          return assetRes;
        }
        // If not found as asset, fall through to SPA handling below.
      }

      // For /auth/callback and any other /auth/* path without an extension:
      // treat as SPA route -> serve index.html so client-side code can run handleAuthCallback().
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

// Treat as SPA route if:
// - It has no file extension (no '.' in last path segment)
function isSpaRoute(pathname) {
  if (pathname === "/" || pathname === "") return true;
  const lastSegment = pathname.split("/").pop() || "";
  return !lastSegment.includes(".");
}
