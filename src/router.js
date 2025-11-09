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
  currentRoute = path;
  
  // Find matching route
  let handler = routes.get(path);
  
  // Try to match dynamic routes
  if (!handler) {
    for (const [routePath, routeHandler] of routes.entries()) {
      if (routePath.includes(':')) {
        const pattern = routePath.replace(/:[^/]+/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = path.match(regex);
        
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
