export default function Home() {
  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-crt-green text-shadow-crt-green my-6 uppercase">
            TERMINAL UTOPIA
          </h1>

          <div class="my-8 px-4 space-y-4">
            <p class="text-lg text-terminal-black">
              &gt; RESEARCH PLATFORM v1.0.0
            </p>
            <p class="text-lg text-terminal-black">
              &gt; ANONYMOUS PARTICIPANT SYSTEM
            </p>
            <p class="text-lg text-terminal-black">
              &gt; SEQUENTIAL MODULE PROGRESSION
            </p>
          </div>

          <div class="my-8">
            <a
              href="/new-user"
              class="inline-block border-2 border-crt-green px-8 py-4 text-crt-green font-bold uppercase text-lg transition-colors shadow-border-glow text-shadow-crt-green bg-crt-green/5 hover:bg-crt-green/10"
            >
              &gt; BEGIN SESSION
            </a>
          </div>

          <div class="my-8 text-sm text-terminal-gray space-y-1">
            <p>&gt; AUTHORIZED PERSONNEL ONLY</p>
            <p>&gt; ALL SESSIONS ARE MONITORED</p>
            <p class="text-crt-amber text-shadow-crt-amber">
              &gt; SYSTEM STATUS: OPERATIONAL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
