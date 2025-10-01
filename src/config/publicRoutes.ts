/**
 * Public routes that don't require authentication
 * All other routes will redirect to /auth if user is not logged in
 */
export const PUBLIC_ROUTES = [
  "/auth",
  "/auth/signup",
  "/auth/verify-email",
  "/auth/confirmed",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/seed-admin",
  "/invite/*",
  "/auth/accept-invite",
] as const;

/**
 * Check if a given path matches any public route pattern
 */
export function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    // Handle wildcard routes
    if (route.endsWith("/*")) {
      const baseRoute = route.slice(0, -2);
      return path.startsWith(baseRoute);
    }
    // Exact match
    return path === route;
  });
}
