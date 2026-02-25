import { Handlers, PageProps } from "$fresh/server.ts";
import { getAuthToken } from "../lib/cookies.ts";

const API_BASE_URL = Deno.env.get("API_BASE_URL") || "http://localhost:8000";

interface User {
  id: string;
  username: string;
  role: string;
}

interface ProgressStats {
  total_modules: number;
  completed_modules: number;
  current_module: string | null;
  completion_percentage: number;
}

interface CurrentModule {
  name: string;
  title: string;
  sequence_order: number;
}

interface ConsentStatus {
  has_consented: boolean;
}

interface DashboardData {
  user?: User;
  progress?: ProgressStats;
  currentModule?: CurrentModule | null;
  consentStatus?: ConsentStatus;
  error?: string;
}

export const handler: Handlers<DashboardData> = {
  async GET(req, ctx) {
    const authToken = getAuthToken(req);

    if (!authToken) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/" },
      });
    }

    try {
      // Fetch user info
      const userResponse = await fetch(`${API_BASE_URL}/api/auth/user`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          return new Response(null, {
            status: 303,
            headers: { Location: "/" },
          });
        }
        throw new Error("Failed to fetch user info");
      }

      const user: User = await userResponse.json();

      // Fetch consent status
      const consentResponse = await fetch(
        `${API_BASE_URL}/api/consent/status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      let consentStatus: ConsentStatus | undefined;
      if (consentResponse.ok) {
        consentStatus = await consentResponse.json();
      }

      // If not consented, redirect to consent page
      if (consentStatus && !consentStatus.has_consented) {
        return new Response(null, {
          status: 303,
          headers: { Location: "/consent" },
        });
      }

      // Fetch progress stats
      const progressResponse = await fetch(
        `${API_BASE_URL}/api/modules/progress/stats`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      let progress: ProgressStats | undefined;
      if (progressResponse.ok) {
        progress = await progressResponse.json();
      }

      // Fetch current module
      const currentModuleResponse = await fetch(
        `${API_BASE_URL}/api/modules/current`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      let currentModule: CurrentModule | null = null;
      if (currentModuleResponse.ok) {
        const data = await currentModuleResponse.json();
        currentModule = data.current_module;
      }

      return ctx.render({
        user,
        progress,
        currentModule,
        consentStatus,
      });
    } catch (error) {
      return ctx.render({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div class="w-full h-3 bg-decay-smoke border border-vhs-gray-dark">
      <div
        class="h-full bg-analog-purple transition-all duration-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

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

  const { user, progress, currentModule } = data;
  const isAllComplete = progress &&
    progress.completed_modules >= progress.total_modules;

  return (
    <div class="container mx-auto py-8 px-4">
      <div class="max-w-screen-md mx-auto">
        {/* Header */}
        <div class="text-center my-8">
          <h1 class="text-4xl font-bold text-vhs-white text-shadow-vhs-purple my-6 uppercase">
            SESSION ACTIVE
          </h1>
        </div>

        {/* User Info Card */}
        <div class="border-2 border-vhs-gray-dark bg-decay-smoke/30 p-6 my-6">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-vhs-gray">&gt; USER ID</p>
              <p class="text-vhs-white font-mono">{user?.username}</p>
            </div>
            <div>
              <p class="text-vhs-gray">&gt; STATUS</p>
              <p class="text-analog-blue">AUTHENTICATED</p>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        {progress && (
          <div class="border-2 border-analog-purple bg-decay-smoke/30 p-6 my-6 shadow-vhs-glow-purple">
            <h2 class="text-xl font-bold text-vhs-white uppercase mb-4">
              &gt; STUDY PROGRESS
            </h2>

            <div class="mb-4">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-vhs-white-dim">
                  {progress.completed_modules} / {progress.total_modules}{" "}
                  MODULES
                </span>
                <span class="text-analog-purple">
                  {progress.completion_percentage.toFixed(0)}%
                </span>
              </div>
              <ProgressBar percentage={progress.completion_percentage} />
            </div>

            {isAllComplete
              ? (
                <div class="text-center py-4">
                  <p class="text-analog-blue text-lg font-bold mb-2">
                    &gt; ALL MODULES COMPLETED
                  </p>
                  <p class="text-vhs-gray text-sm">
                    THANK YOU FOR YOUR PARTICIPATION
                  </p>
                </div>
              )
              : currentModule
              ? (
                <div class="mt-4">
                  <p class="text-vhs-gray text-sm mb-2">&gt; CURRENT MODULE:</p>
                  <p class="text-vhs-white text-lg font-bold">
                    [{String(currentModule.sequence_order).padStart(2, "0")}]
                    {" "}
                    {currentModule.title}
                  </p>
                </div>
              )
              : null}
          </div>
        )}

        {/* Action Buttons */}
        <div class="my-8 space-y-4 text-center">
          {!isAllComplete && currentModule && (
            <a
              href={`/modules/${currentModule.name}`}
              class="inline-block border-2 border-analog-purple px-10 py-5 text-analog-purple font-bold uppercase text-lg transition-all duration-300 shadow-vhs-glow-purple text-shadow-void-text bg-decay-smoke/30 hover:bg-analog-purple/20"
            >
              &gt; CONTINUE STUDY
            </a>
          )}

          <div class="space-x-4">
            <a
              href="/modules"
              class="inline-block border-2 border-analog-blue px-8 py-4 text-analog-blue font-bold uppercase text-sm transition-colors shadow-vhs-glow-blue text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50"
            >
              &gt; VIEW ALL MODULES
            </a>

            <a
              href="/logout"
              class="inline-block border-2 border-vhs-gray px-8 py-4 text-vhs-gray font-bold uppercase text-sm transition-colors text-shadow-void-text bg-decay-smoke/30 hover:bg-decay-smoke/50 hover:border-analog-red hover:text-analog-red"
            >
              &gt; LOGOUT
            </a>
          </div>
        </div>

        {/* Status Footer */}
        <div class="my-8 text-sm text-vhs-gray space-y-1 font-medium text-center">
          <p>&gt; SESSION ESTABLISHED</p>
          {isAllComplete
            ? <p class="text-analog-blue">&gt; STUDY COMPLETE</p>
            : (
              <p class="text-analog-purple text-shadow-vhs-purple">
                &gt; SYSTEM READY
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
