import { Handlers, PageProps } from "$fresh/server.ts";
import { api } from "../lib/api.ts";

interface DashboardData {
  user?: {
    id: string;
    username: string;
    role: string;
  };
  error?: string;
}

export const handler: Handlers<DashboardData> = {
  async GET(req, ctx) {
    // Get token from cookie
    const cookies = req.headers.get("cookie");
    const authToken = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("auth_token="))
      ?.split("=")[1];

    if (!authToken) {
      // Redirect to home if no token
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      });
    }

    try {
      // Set token in API client
      api.setToken(authToken);

      // Get current user info
      const user = await api.getCurrentUser();

      return ctx.render({ user });
    } catch (error) {
      return ctx.render({ error: error.message });
    }
  },
};

export default function Dashboard({ data }: PageProps<DashboardData>) {
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
                &gt; AUTHENTICATION FAILED
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

  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto">
        <div class="text-center my-8">
          <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
            SESSION ACTIVE
          </h1>

          <div class="my-8 px-4 space-y-4">
            <p class="text-lg text-vhs-white-dim">
              &gt; USER ID: {data.user?.id}
            </p>
            <p class="text-lg text-vhs-white-dim">
              &gt; USERNAME: {data.user?.username}
            </p>
            <p class="text-lg text-vhs-white-dim">
              &gt; ROLE: {data.user?.role}
            </p>
          </div>

          <div class="my-8 text-sm text-vhs-gray space-y-1">
            <p>&gt; SESSION ESTABLISHED</p>
            <p>&gt; AWAITING MODULE ASSIGNMENT</p>
            <p class="text-analog-red text-shadow-vhs-red">
              &gt; SYSTEM READY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
