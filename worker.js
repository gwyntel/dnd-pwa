// Cloudflare Worker for SPA fallback with static assets from ./dist
// - Serves built assets normally
// - Falls back to /index.html for any non-asset route (e.g. /auth/callback)
// Fix: do NOT rewrite /auth/* asset URLs like /auth/assets/*.js|css to index.html;
// only treat real app routes (no extension and not under /assets) as SPA paths.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Let the Pages/assets handler try first with the original path.
    const assetResponse = await env.ASSETS.fetch(request);

    // If it's not a 404, return as-is (correct MIME types for JS/CSS/etc).
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // If 404 from ASSETS, decide whether this should be a SPA route.
    if (isSpaRoute(url.pathname)) {
      // Serve index.html for SPA routes (e.g. /auth/callback, /characters, etc.)
      const indexUrl = new URL("/", request.url);
      const indexRequest = new Request(indexUrl.toString(), request);
      return env.ASSETS.fetch(indexRequest);
    }

    // Otherwise, return original 404.
    return assetResponse;
  },
};

// Treat as SPA route if:
// - It has no file extension, and
// - It's not obviously a static asset directory.
function isSpaRoute(pathname) {
  // Root is SPA
  if (pathname === "/" || pathname === "") return true;

  // If path looks like it has a file extension, it's not a SPA route
  const lastSegment = pathname.split("/").pop() || "";
  if (lastSegment.includes(".")) return false;

  // Anything else (no extension) we treat as SPA route
  // e.g. /auth/callback, /characters, /worlds/123
  return true;
}
