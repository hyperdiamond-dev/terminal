import { Head } from "$fresh/runtime.ts";
import { type PageProps } from "$fresh/server.ts";

export default function Error500(props: PageProps) {
  const error = (props as { error?: unknown }).error;
  const message = error instanceof Error ? error.message : null;
  const retryHref = props.url.pathname + props.url.search;

  return (
    <>
      <Head>
        <title>500 - TRANSMISSION ERROR</title>
      </Head>
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <p class="text-analog-red text-9xl font-bold text-shadow-vhs-red my-4">
              500
            </p>
            <h1 class="text-3xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
              TRANSMISSION ERROR
            </h1>

            <div class="my-8 px-4 space-y-3" role="alert">
              <p class="text-lg text-vhs-white-dim">
                &gt; AN UNEXPECTED FAULT INTERRUPTED THE SIGNAL
              </p>
              {message && (
                <p class="text-vhs-gray text-sm">
                  &gt; {message.toUpperCase()}
                </p>
              )}
            </div>

            <div class="my-8 flex flex-wrap justify-center gap-4">
              <a
                href={retryHref}
                class="inline-block border-2 border-analog-red px-8 py-4 text-analog-red font-bold uppercase text-lg transition-colors shadow-vhs-glow text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
              >
                &gt; RETRY
              </a>
              <a
                href="/"
                class="inline-block border-2 border-analog-purple px-8 py-4 text-analog-purple font-bold uppercase text-lg transition-colors shadow-vhs-glow-purple text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
              >
                &gt; RETURN TO HOME
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
