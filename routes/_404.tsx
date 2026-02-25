import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - SIGNAL LOST</title>
      </Head>
      <div class="container mx-auto py-8 px-4">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <div class="text-center">
            <p class="text-analog-red text-9xl font-bold text-shadow-vhs-red my-4">
              404
            </p>
            <h1 class="text-3xl font-bold text-vhs-white text-shadow-vhs-red my-6 uppercase">
              SIGNAL LOST
            </h1>

            <div class="my-8 px-4 space-y-3">
              <p class="text-lg text-vhs-white-dim">
                &gt; REQUESTED LOCATION NOT FOUND
              </p>
              <p class="text-vhs-gray text-sm">
                &gt; THE CHANNEL YOU ARE LOOKING FOR DOES NOT EXIST
              </p>
            </div>

            <div class="my-8">
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
