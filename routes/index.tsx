export default function Home() {
  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div class="text-center">
          <h1 class="text-5xl font-bold text-vhs-white text-shadow-vhs-red my-8 uppercase tracking-wider">
            TERMINAL UTOPIA
          </h1>

          <div class="my-10 px-4 space-y-3">
            <p class="text-base text-vhs-white-dim font-medium">
              &gt; RESEARCH PLATFORM v1.0.0
            </p>
            <p class="text-base text-vhs-white-dim font-medium">
              &gt; ANONYMOUS PARTICIPANT SYSTEM
            </p>
          </div>

          <div class="my-10">
            <a
              href="/new-user"
              class="inline-block border-2 border-analog-red px-10 py-5 text-analog-red font-bold uppercase text-lg transition-all duration-300 shadow-vhs-glow text-shadow-void-text bg-decay-ash/40 hover:bg-analog-red/20 hover:shadow-vhs-glow hover:text-vhs-white"
            >
              &gt; F I N D &nbsp; Y O U R S E L F
            </a>
          </div>

          <div class="my-8 text-sm text-vhs-gray space-y-1 font-medium">
            <p>&gt; AUTHORIZED PERSONNEL ONLY</p>
            <p>&gt; ALL SESSIONS ARE MONITORED</p>
            <p class="text-analog-purple text-shadow-vhs-purple">
              &gt; SYSTEM STATUS: OPERATIONAL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
