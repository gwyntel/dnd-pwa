// Cloudflare Worker for SPA fallback with static assets from ./dist
// - Serves built assets normally
// - Falls back to /index.html for any non-asset route (e.g. /auth/callback)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve static assets directly (JS, CSS, images, etc.)
    if (isAssetRequest(url.pathname)) {
      const assetResponse = await env.ASSETS.fetch(request);
      // If asset exists, return it
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      // If not found, fall through to SPA fallback
    }

    // SPA fallback: always return index.html for non-asset routes
    const indexUrl = new URL("/", request.url);
    const indexRequest = new Request(indexUrl.toString(), request);
    return env.ASSETS.fetch(indexRequest);
  },
};

// Detect asset requests by path/extension
function isAssetRequest(pathname) {
  if (pathname === "/" || pathname === "") return false;
  // Common static asset extensions from Vite build
  return (
    pathname.includes("/assets/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".map") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".txt") ||
    pathname.endsWith(".json") ||
    pathname.endsWith(".xml") ||
    pathname.endsWith(".pdf")
  );
}
