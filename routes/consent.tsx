import { Handlers, PageProps } from "$fresh/server.ts";

interface ConsentData {
  consentText?: string;
  error?: string;
}

export const handler: Handlers<ConsentData> = {
  GET(_req, ctx) {
    try {
      // TODO: Implement API call to get consent module
      // const response = await api.getConsentModule();

      // Placeholder consent text
      const consentText =
        `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`;

      return ctx.render({ consentText });
    } catch (error) {
      return ctx.render({ error: error.message });
    }
  },

  POST(_req, _ctx) {
    try {
      // TODO: Implement API call to submit consent
      // const response = await api.submitConsent();

      // Placeholder - redirect to dashboard after consent
      return new Response(null, {
        status: 303,
        headers: { Location: "/dashboard" },
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

export default function ConsentPage({ data }: PageProps<ConsentData>) {
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
                &gt; FAILED TO LOAD CONSENT MODULE
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
        <div class="my-8">
          <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase text-center">
            INFORMED CONSENT
          </h1>

          <div class="my-8 px-6 py-6 border-2 border-analog-purple shadow-vhs-glow-purple bg-decay-smoke/30 max-h-[400px] overflow-y-auto">
            <div class="text-base text-vhs-white-dim leading-relaxed whitespace-pre-line">
              {data.consentText}
            </div>
          </div>

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
                  &gt; I AGREE TO THE TERMS
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
            <p>&gt; CONSENT REQUIRED TO PROCEED</p>
            <p class="text-analog-red text-shadow-vhs-red">
              &gt; YOU MUST AGREE TO CONTINUE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
