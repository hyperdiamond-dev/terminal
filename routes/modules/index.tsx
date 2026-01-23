import { Handlers, PageProps } from "$fresh/server.ts";
import { api } from "../../lib/api.ts";

interface ModuleOverview {
  name: string;
  title: string;
  description: string | null;
  sequence_order: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  accessible: boolean;
  is_completed: boolean;
  started_at?: string;
  completed_at?: string;
}

interface ProgressStats {
  total_modules: number;
  completed_modules: number;
  current_module: string | null;
  completion_percentage: number;
}

interface ModulesData {
  modules?: ModuleOverview[];
  progress?: ProgressStats;
  error?: string;
}

export const handler: Handlers<ModulesData> = {
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
      api.setToken(authToken);

      // Fetch module overview from API
      const response = await fetch(
        `${Deno.env.get("API_BASE_URL") || "http://localhost:8000"}/api/modules`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          return new Response(null, {
            status: 303,
            headers: { Location: "/" },
          });
        }
        throw new Error("Failed to fetch modules");
      }

      const data = await response.json();

      return ctx.render({
        modules: data.modules,
        progress: data.progress,
      });
    } catch (error) {
      return ctx.render({ error: error.message });
    }
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = {
    NOT_STARTED: {
      bg: "bg-vhs-gray-dark/50",
      text: "text-vhs-gray",
      border: "border-vhs-gray-dark",
      label: "NOT STARTED",
    },
    IN_PROGRESS: {
      bg: "bg-analog-purple/20",
      text: "text-analog-purple",
      border: "border-analog-purple",
      label: "IN PROGRESS",
    },
    COMPLETED: {
      bg: "bg-analog-blue/20",
      text: "text-analog-blue",
      border: "border-analog-blue",
      label: "COMPLETED",
    },
  }[status] || {
    bg: "bg-vhs-gray-dark/50",
    text: "text-vhs-gray",
    border: "border-vhs-gray-dark",
    label: "UNKNOWN",
  };

  return (
    <span
      class={`px-2 py-1 text-xs font-bold uppercase border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div class="w-full h-2 bg-decay-smoke border border-vhs-gray-dark">
      <div
        class="h-full bg-analog-purple transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function ModulesPage({ data }: PageProps<ModulesData>) {
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
                &gt; FAILED TO LOAD MODULES
              </p>
              <p class="text-lg text-analog-red text-shadow-vhs-red">
                &gt; {data.error}
              </p>
            </div>

            <div class="my-8">
              <a
                href="/dashboard"
                class="inline-block border-2 border-analog-blue px-8 py-4 text-analog-blue font-bold uppercase text-lg transition-colors shadow-vhs-glow-blue text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
              >
                &gt; RETURN TO DASHBOARD
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const modules = data?.modules || [];
  const progress = data?.progress;

  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto">
        <div class="text-center my-8">
          <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-purple my-6 uppercase tracking-wider">
            RESEARCH MODULES
          </h1>

          {progress && (
            <div class="my-6">
              <p class="text-sm text-vhs-white-dim mb-2">
                &gt; PROGRESS: {progress.completed_modules} /{" "}
                {progress.total_modules} MODULES COMPLETE
              </p>
              <ProgressBar percentage={progress.completion_percentage} />
              <p class="text-xs text-vhs-gray mt-2">
                {progress.completion_percentage.toFixed(0)}% COMPLETE
              </p>
            </div>
          )}
        </div>

        <div class="space-y-4 my-8">
          {modules.map((module, index) => (
            <div
              key={module.name}
              class={`
                border-2 p-6 transition-all duration-300
                ${
                module.accessible
                  ? module.is_completed
                    ? "border-analog-blue/50 bg-decay-smoke/20 hover:bg-decay-smoke/40"
                    : "border-analog-purple bg-decay-smoke/30 hover:bg-decay-smoke/50 shadow-vhs-glow-purple"
                  : "border-vhs-gray-dark bg-decay-ash/30 opacity-60"
              }
              `}
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-vhs-gray text-sm font-mono">
                      [{String(index + 1).padStart(2, "0")}]
                    </span>
                    <h2 class="text-xl font-bold text-vhs-white uppercase">
                      {module.title}
                    </h2>
                    <StatusBadge status={module.status} />
                  </div>

                  {module.description && (
                    <p class="text-vhs-white-dim text-sm mt-2 mb-4">
                      {module.description}
                    </p>
                  )}

                  {!module.accessible && (
                    <p class="text-vhs-gray text-sm flex items-center gap-2">
                      <span class="text-analog-red">&#x1F512;</span>
                      COMPLETE PREVIOUS MODULES TO UNLOCK
                    </p>
                  )}

                  {module.is_completed && module.completed_at && (
                    <p class="text-vhs-gray text-xs mt-2">
                      &gt; COMPLETED:{" "}
                      {new Date(module.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div class="flex-shrink-0">
                  {module.accessible
                    ? (
                      <a
                        href={`/modules/${module.name}`}
                        class={`
                        inline-block px-6 py-3 font-bold uppercase text-sm transition-all duration-200
                        ${
                          module.is_completed
                            ? "border-2 border-analog-blue text-analog-blue hover:bg-analog-blue/20"
                            : "border-2 border-analog-purple text-analog-purple hover:bg-analog-purple/20 shadow-vhs-glow-purple"
                        }
                      `}
                      >
                        {module.is_completed ? "&gt; REVIEW" : "&gt; ENTER"}
                      </a>
                    )
                    : (
                      <span class="inline-block px-6 py-3 border-2 border-vhs-gray-dark text-vhs-gray font-bold uppercase text-sm cursor-not-allowed">
                        LOCKED
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {modules.length === 0 && (
          <div class="text-center my-16">
            <p class="text-vhs-white-dim text-lg">
              &gt; NO MODULES AVAILABLE
            </p>
            <p class="text-vhs-gray text-sm mt-2">
              &gt; PLEASE CONTACT ADMINISTRATOR
            </p>
          </div>
        )}

        <div class="my-8 text-center">
          <a
            href="/dashboard"
            class="text-vhs-gray hover:text-vhs-white-dim text-sm transition-colors"
          >
            &gt; BACK TO DASHBOARD
          </a>
        </div>
      </div>
    </div>
  );
}
