/**
 * Extract the auth_token cookie from an HTTP request's cookie header.
 */
export function getAuthToken(req: Request): string | undefined {
  return req.headers.get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("auth_token="))
    ?.split("=")[1];
}
