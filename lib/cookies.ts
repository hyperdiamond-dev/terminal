/** Name of the cookie holding the user's selected theme id. */
export const THEME_COOKIE = "utopia_theme";

/**
 * Extract a cookie value from an HTTP request's cookie header.
 */
export function getCookieValue(
  req: Request,
  name: string,
): string | undefined {
  const raw = req.headers.get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${name}=`))
    ?.split("=")[1];
  if (raw === undefined) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Extract the auth_token cookie from an HTTP request's cookie header.
 */
export function getAuthToken(req: Request): string | undefined {
  return getCookieValue(req, "auth_token");
}
