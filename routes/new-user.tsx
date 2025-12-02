import { Handlers, PageProps } from "$fresh/server.ts";
import { api } from "../lib/api.ts";

interface NewUserData {
  error?: string;
  credentials?: {
    username: string;
    password: string;
  };
}

export const handler: Handlers<NewUserData> = {
  async GET(req, ctx) {
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
};

export default function NewUserPage({ data }: PageProps<NewUserData>) {
  if (data?.error) {
    return (
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-crt-green text-shadow-crt-green my-6 uppercase">
              ERROR
            </h1>

            <div class="my-8 px-4 space-y-4">
              <p class="text-lg text-terminal-black">
                &gt; FAILED TO CREATE SESSION
              </p>
              <p class="text-lg text-crt-amber text-shadow-crt-amber">
                &gt; {data.error}
              </p>
            </div>

            <div class="my-8">
              <a
                href="/"
                class="inline-block border-2 border-crt-green px-8 py-4 text-crt-green font-bold uppercase text-lg transition-colors shadow-border-glow text-shadow-crt-green bg-crt-green/5 hover:bg-crt-green/10"
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
            <h1 class="text-4xl font-bold text-crt-green text-shadow-crt-green my-6 uppercase">
              SESSION CREATED
            </h1>

            <div class="my-8 px-4 space-y-4">
              <p class="text-lg text-terminal-black">
                &gt; ANONYMOUS USER ACCOUNT GENERATED
              </p>
              <p class="text-lg text-terminal-black">
                &gt; CREDENTIALS ASSIGNED
              </p>
            </div>

            <div class="my-8 px-6 py-6 border-2 border-crt-green shadow-border-glow bg-crt-green/5">
              <p class="text-sm my-2 uppercase text-terminal-gray">
                &gt; USERNAME
              </p>
              <p class="text-2xl font-bold text-crt-green text-shadow-crt-green my-2 tabular-nums">
                {data.credentials.username}
              </p>

              <div class="my-4 border-t border-crt-green opacity-30"></div>

              <p class="text-sm my-2 uppercase text-terminal-gray">
                &gt; PASSWORD
              </p>
              <p class="text-2xl font-bold text-crt-green text-shadow-crt-green my-2 tabular-nums">
                {data.credentials.password}
              </p>
            </div>

            <div class="my-8 text-sm text-crt-amber text-shadow-crt-amber space-y-1">
              <p>&gt; SAVE THESE CREDENTIALS</p>
              <p>&gt; REQUIRED FOR RE-AUTHENTICATION</p>
              <p>&gt; CANNOT BE RECOVERED</p>
            </div>

            <div class="my-8">
              <a
                href="/dashboard"
                class="inline-block border-2 border-crt-green px-8 py-4 text-crt-green font-bold uppercase text-lg transition-colors shadow-border-glow text-shadow-crt-green bg-crt-green/5 hover:bg-crt-green/10"
              >
                &gt; CONTINUE TO DASHBOARD
              </a>
            </div>
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
          <h1 class="text-4xl font-bold text-crt-green text-shadow-crt-green my-6 uppercase">
            INITIALIZING
          </h1>

          <div class="my-8 px-4 space-y-4">
            <p class="text-lg text-terminal-black">
              &gt; CREATING ANONYMOUS SESSION...
            </p>
            <p class="text-lg text-terminal-black">
              &gt; GENERATING CREDENTIALS...
            </p>
            <p class="text-lg text-terminal-black">
              &gt; ESTABLISHING CONNECTION...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
