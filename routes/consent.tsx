import { Handlers, PageProps } from "$fresh/server.ts";

const API_BASE_URL =
  Deno.env.get("API_BASE_URL") || "http://localhost:8000";

interface ConsentVersion {
  version: string;
  title: string;
  content_text: string;
  content_url?: string;
  effective_date: string;
}

interface ConsentStatus {
  has_consented: boolean;
  latest_consent: {
    id: number;
    version: string;
    consented_at: string;
  } | null;
}

interface ConsentData {
  consentVersion?: ConsentVersion;
  consentStatus?: ConsentStatus;
  alreadyConsented?: boolean;
  error?: string;
}

export const handler: Handlers<ConsentData> = {
  async GET(req, ctx) {
    const cookies = req.headers.get("cookie");
    const authToken = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("auth_token="))
      ?.split("=")[1];

    if (!authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      });
    }

    try {
      // Fetch current consent version (public endpoint)
      const versionResponse = await fetch(
        `${API_BASE_URL}/api/consent/version/current`,
      );

      if (!versionResponse.ok) {
        throw new Error("Failed to fetch consent version");
      }

      const consentVersion: ConsentVersion = await versionResponse.json();

      // Fetch user's consent status
      const statusResponse = await fetch(
        `${API_BASE_URL}/api/consent/status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      let consentStatus: ConsentStatus | undefined;
      if (statusResponse.ok) {
        consentStatus = await statusResponse.json();

        // If already consented, redirect to modules
        if (consentStatus?.has_consented) {
          return new Response(null, {
            status: 303,
            headers: { Location: "/modules" },
          });
        }
      }

      return ctx.render({
        consentVersion,
        consentStatus,
      });
    } catch (error) {
      return ctx.render({ error: error.message });
    }
  },

  async POST(req, _ctx) {
    const cookies = req.headers.get("cookie");
    const authToken = cookies
      ?.split(";")
      .find((c) => c.trim().startsWith("auth_token="))
      ?.split("=")[1];

    if (!authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      });
    }

    try {
      // Submit consent
      const response = await fetch(`${API_BASE_URL}/api/consent`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responses: {
            agreed: true,
            agreed_at: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit consent");
      }

      // Redirect to modules after successful consent
      return new Response(null, {
        status: 303,
        headers: { Location: "/modules" },
      });
    } catch (error) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: "/consent?error=" + encodeURIComponent(error.message),
        },
      });
    }
  },
};

export default function ConsentPage({ data, url }: PageProps<ConsentData>) {
  // Check for error in URL params
  const urlError = url.searchParams.get("error");
  const displayError = data?.error || urlError;

  if (displayError) {
    return (
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
              ERROR
            </h1>

            <div class="my-8 px-4 space-y-4">
              <p class="text-lg text-vhs-white-dim">
                &gt; FAILED TO LOAD CONSENT MODULE
              </p>
              <p class="text-lg text-analog-red text-shadow-vhs-red">
                &gt; {displayError}
              </p>
            </div>

            <div class="my-8 space-x-4">
              <a
                href="/consent"
                class="inline-block border-2 border-analog-purple px-8 py-4 text-analog-purple font-bold uppercase text-lg transition-colors shadow-vhs-glow-purple text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
              >
                &gt; TRY AGAIN
              </a>
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

  const { consentVersion } = data;

  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto">
        <div class="my-8">
          <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase text-center">
            INFORMED CONSENT
          </h1>

          {consentVersion?.title && (
            <p class="text-center text-vhs-gray text-sm mb-4">
              &gt; VERSION: {consentVersion.version} | EFFECTIVE:{" "}
              {new Date(consentVersion.effective_date).toLocaleDateString()}
            </p>
          )}

          <div class="my-8 px-6 py-6 border-2 border-analog-purple shadow-vhs-glow-purple bg-decay-smoke/30 max-h-[400px] overflow-y-auto">
            <div class="text-base text-vhs-white-dim leading-relaxed whitespace-pre-line">
              {consentVersion?.content_text ||
                "Loading consent information..."}
            </div>
          </div>

          {consentVersion?.content_url && (
            <div class="text-center mb-6">
              <a
                href={consentVersion.content_url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-analog-blue hover:underline text-sm"
              >
                &gt; VIEW FULL DOCUMENT (OPENS IN NEW TAB)
              </a>
            </div>
          )}

          <form method="POST" action="/consent" class="my-8">
            <div class="flex items-center justify-center my-6">
              <label class="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="agree"
                  required
                  class="w-5 h-5 mr-3 bg-decay-smoke border-2 border-analog-purple accent-analog-purple"
                />
                <span class="text-lg text-vhs-white font-medium uppercase">
                  &gt; I HAVE READ AND AGREE TO THE TERMS
                </span>
              </label>
            </div>

            <div class="text-center">
              <button
                type="submit"
                class="inline-block border-2 border-analog-blue px-10 py-5 text-analog-blue font-bold uppercase text-lg transition-all duration-300 shadow-vhs-glow-blue text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
              >
                &gt; SUBMIT CONSENT
              </button>
            </div>
          </form>

          <div class="my-8 text-sm text-vhs-gray space-y-1 font-medium text-center">
            <p>&gt; CONSENT IS REQUIRED TO PARTICIPATE</p>
            <p class="text-analog-red text-shadow-vhs-red">
              &gt; YOUR RESPONSES WILL BE ANONYMOUS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
