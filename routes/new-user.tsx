import { Handlers, PageProps } from "$fresh/server.ts";
import { api } from "../lib/api.ts";
import { setCookie } from "https://deno.land/std@0.208.0/http/cookie.ts";

interface NewUserData {
  error?: string;
  credentials?: {
    username: string;
    password: string;
  };
}

export const handler: Handlers<NewUserData> = {
  async GET(_req, ctx) {
    try {
      // Create anonymous user via API
      const response = await api.createAnonymousUser();

      // Render page with credentials
      return ctx.render({
        credentials: response.credentials,
      });
    } catch (error) {
      // If API call fails, render error page
      return ctx.render({ error: error.message });
    }
  },

  async POST(req, _ctx) {
    try {
      // Parse form data to get credentials
      const formData = await req.formData();
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;

      // Login user via API
      const loginResponse = await api.login(username, password);

      // Create response with redirect
      const headers = new Headers();
      headers.set("Location", "/consent");

      // Set auth token in cookie
      setCookie(headers, {
        name: "auth_token",
        value: loginResponse.token,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: "Lax",
        path: "/",
        secure: false, // Set to true in production with HTTPS
      });

      return new Response(null, {
        status: 303,
        headers,
      });
    } catch (error) {
      // Redirect back to new-user page with error
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/new-user?error=" + encodeURIComponent(error.message),
        },
      });
    }
  },
};

export default function NewUserPage({ data }: PageProps<NewUserData>) {
  if (data?.error) {
    return (
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
              ERROR
            </h1>

            <div class="my-8 px-4 space-y-4">
              <p class="text-lg text-vhs-white-dim">
                &gt; FAILED TO CREATE SESSION
              </p>
              <p class="text-lg text-analog-red text-shadow-vhs-red">
                &gt; {data.error}
              </p>
            </div>

            <div class="my-8">
              <a
                href="/"
                class="inline-block border-2 border-analog-blue px-8 py-4 text-analog-blue font-bold uppercase text-lg transition-colors shadow-vhs-glow-blue text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
              >
                &gt; RETURN TO HOME
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (data?.credentials) {
    return (
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
              SESSION CREATED
            </h1>

            <div class="my-8 px-4 space-y-4">
              <p class="text-lg text-vhs-white-dim">
                &gt; ANONYMOUS USER ACCOUNT GENERATED
              </p>
              <p class="text-lg text-vhs-white-dim">
                &gt; CREDENTIALS ASSIGNED
              </p>
            </div>

            <div class="my-8 px-6 py-6 border-2 border-analog-blue shadow-vhs-glow-blue bg-decay-smoke/30">
              <p class="text-sm my-2 uppercase text-vhs-gray">
                &gt; USERNAME
              </p>
              <p class="text-2xl font-bold text-vhs-white text-shadow-vhs-red my-2 tabular-nums">
                {data.credentials.username}
              </p>

              <div class="my-4 border-t border-analog-blue opacity-30">
              </div>

              <p class="text-sm my-2 uppercase text-vhs-gray">
                &gt; PASSWORD
              </p>
              <p class="text-2xl font-bold text-vhs-white text-shadow-vhs-red my-2 tabular-nums">
                {data.credentials.password}
              </p>
            </div>

            <div class="my-8 text-sm text-analog-red text-shadow-vhs-red space-y-1">
              <p>&gt; SAVE THESE CREDENTIALS</p>
              <p>&gt; REQUIRED FOR RE-AUTHENTICATION</p>
              <p>&gt; CANNOT BE RECOVERED</p>
            </div>

            <form method="POST" class="my-8">
              <input
                type="hidden"
                name="username"
                value={data.credentials.username}
              />
              <input
                type="hidden"
                name="password"
                value={data.credentials.password}
              />
              <button
                type="submit"
                class="inline-block border-2 border-analog-blue px-8 py-4 text-analog-blue font-bold uppercase text-lg transition-colors shadow-vhs-glow-blue text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50 cursor-pointer"
              >
                &gt; BEGIN SESSION
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (shouldn't normally be seen)
  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
            INITIALIZING
          </h1>

          <div class="my-8 px-4 space-y-4">
            <p class="text-lg text-vhs-white-dim">
              &gt; CREATING ANONYMOUS SESSION...
            </p>
            <p class="text-lg text-vhs-white-dim">
              &gt; GENERATING CREDENTIALS...
            </p>
            <p class="text-lg text-vhs-white-dim">
              &gt; ESTABLISHING CONNECTION...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
