import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, _ctx) {
    // Clear the auth_token cookie and redirect to home
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie":
          "auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax",
      },
    });
  },
};
