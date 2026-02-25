import { Handlers, PageProps } from "$fresh/server.ts";
import { api } from "../lib/api.ts";
import { getAuthToken } from "../lib/cookies.ts";
import { setCookie } from "https://deno.land/std@0.208.0/http/cookie.ts";

interface LoginData {
  error?: string;
}

export const handler: Handlers<LoginData> = {
  GET(req, ctx) {
    const authToken = getAuthToken(req);
    if (authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/dashboard" },
      });
    }

    const url = new URL(req.url);
    const error = url.searchParams.get("error");
    return ctx.render({ error: error || undefined });
  },

  async POST(req, _ctx) {
    try {
      const formData = await req.formData();
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;

      if (!username || !password) {
        return new Response(null, {
          status: 303,
          headers: {
            Location: "/login?error=" +
              encodeURIComponent("Username and password are required"),
          },
        });
      }

      const loginResponse = await api.login(username, password);

      const headers = new Headers();
      headers.set("Location", "/dashboard");

      setCookie(headers, {
        name: "auth_token",
        value: loginResponse.token,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "Lax",
        path: "/",
        secure: Deno.env.get("DENO_ENV") === "production",
      });

      return new Response(null, {
        status: 303,
        headers,
      });
    } catch (error) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/login?error=" +
            encodeURIComponent(
              error instanceof Error ? error.message : "Unknown error",
            ),
        },
      });
    }
  },
};

export default function LoginPage({ data }: PageProps<LoginData>) {
  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
            RE-AUTHENTICATE
          </h1>

          <div class="my-8 px-4 space-y-4">
            <p class="text-lg text-vhs-white-dim">
              &gt; ENTER YOUR CREDENTIALS TO RESUME SESSION
            </p>
          </div>

          {data?.error && (
            <div class="my-6 border-2 border-analog-red bg-analog-red/10 px-4 py-3">
              <p class="text-analog-red text-shadow-vhs-red">
                &gt; ERROR: {data.error}
              </p>
            </div>
          )}

          <form method="POST" class="my-8 space-y-6">
            <div>
              <label class="block text-sm text-vhs-gray uppercase mb-2">
                &gt; USERNAME
              </label>
              <input
                type="text"
                name="username"
                required
                autocomplete="username"
                class="w-full max-w-sm mx-auto block bg-decay-smoke/50 border-2 border-vhs-gray-dark px-4 py-3 text-vhs-white font-mono text-lg focus:border-analog-purple focus:outline-none transition-colors"
                placeholder="e.g. BraveTiger"
              />
            </div>

            <div>
              <label class="block text-sm text-vhs-gray uppercase mb-2">
                &gt; PASSWORD
              </label>
              <input
                type="password"
                name="password"
                required
                autocomplete="current-password"
                class="w-full max-w-sm mx-auto block bg-decay-smoke/50 border-2 border-vhs-gray-dark px-4 py-3 text-vhs-white font-mono text-lg focus:border-analog-purple focus:outline-none transition-colors"
              />
            </div>

            <div class="pt-4">
              <button
                type="submit"
                class="inline-block border-2 border-analog-blue px-8 py-4 text-analog-blue font-bold uppercase text-lg transition-colors shadow-vhs-glow-blue text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50 cursor-pointer"
              >
                &gt; RESUME SESSION
              </button>
            </div>
          </form>

          <div class="my-8">
            <a
              href="/new-user"
              class="text-vhs-gray hover:text-vhs-white-dim text-sm transition-colors"
            >
              &gt; NEW PARTICIPANT? CREATE SESSION
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
