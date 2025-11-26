/**
 * Simple client-side router
 * Handles navigation between views
 */

const routes = new Map();
let currentRoute = null;

/**
 * Register a route
 */
export function registerRoute(path, handler) {
  routes.set(path, handler);
}

/**
 * Navigate to a route
 */
export function navigateTo(path, state = {}) {
  // Update browser history
  window.history.pushState(state, '', path);

  // Render the route
  renderRoute(path, state);
}

/**
 * Render current route
 */
function renderRoute(path, state = {}) {
  // Handle paths with query parameters
  let pathname = path;
  let search = '';

  if (path.includes('?')) {
    const parts = path.split('?');
    pathname = parts[0];
    search = parts[1];
  }

  currentRoute = pathname;

  // Extract query parameters
  const queryParams = {};

  // From the path string
  if (search) {
    const searchParams = new URLSearchParams(search);
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
  }

  // Also check window.location if we're rendering the current page
  // (This handles initial load or back/forward navigation)
  if (window.location.pathname === pathname) {
    const url = new URL(window.location.href);
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
  }

  // Add query params to state
  if (Object.keys(queryParams).length > 0) {
    state.query = { ...state.query, ...queryParams };
  }

  // Find matching route
  let handler = routes.get(pathname);

  // Try to match dynamic routes
  if (!handler) {
    for (const [routePath, routeHandler] of routes.entries()) {
      if (routePath.includes(':')) {
        const pattern = routePath.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = pathname.match(regex);

        if (match) {
          handler = routeHandler;
          // Extract params
          const paramNames = routePath.match(/:[^/]+/g) || [];
          const params = {};
          paramNames.forEach((name, i) => {
            params[name.slice(1)] = match[i + 1];
          });
          state.params = params;
          break;
        }
      }
    }
  }

  // Fallback to 404 or home
  if (!handler) {
    console.log(`[Router] No handler for ${pathname}, falling back to home`);
    handler = routes.get('/404') || routes.get('/');
  }

  // Execute handler
  if (handler) {
    handler(state);
  }
}

/**
 * Handle browser back/forward
 */
window.addEventListener('popstate', (event) => {
  renderRoute(window.location.pathname, event.state || {});
});

/**
 * Initialize router
 */
export function initRouter() {
  // Handle initial route
  renderRoute(window.location.pathname);

  // Intercept link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="/"]');
    if (link && !link.hasAttribute('target')) {
      e.preventDefault();
      navigateTo(link.getAttribute('href'));
    }
  });
}

/**
 * Get current route
 */
export function getCurrentRoute() {
  return currentRoute;
}
