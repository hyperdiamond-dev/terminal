# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Development Commands

```bash
deno task start      # Dev server with hot-reload (watches static/, routes/)
deno task check      # Format check, lint, type check
deno task build      # Production build
deno task preview    # Run production build
deno task manifest   # Regenerate Fresh manifest (fresh.gen.ts)
```

**Known issue:** `deno task check` currently fails on `node_modules/tailwindcss`
(pre-existing). Use targeted `deno check <files>` instead.

## Architecture Overview

**Stack:** Fresh 1.7.3, Deno, Preact 10.22.0, Preact Signals, Tailwind CSS

**Project Structure:**

```
├── routes/          # File-based routing (Fresh convention)
├── islands/         # Interactive Preact components (hydrated on client)
├── components/      # Server-rendered UI components (no JS shipped)
├── lib/             # Utilities and API client
├── static/          # Static assets and CSS effects
├── fresh.gen.ts     # Auto-generated manifest (do not edit manually)
├── dev.ts           # Development entry point
└── main.ts          # Production entry point
```

**Island Architecture:**

- `islands/` components are interactive and hydrated on the client
- `components/` are server-rendered only (zero JavaScript)
- Fresh only ships JavaScript for islands, minimizing bundle size

**Islands (15):** question renderers (`QuestionRenderer`, `TrueFalseQuestion`,
`MultipleChoiceQuestion`, `CheckboxMultiSelectQuestion`, `FillBlankQuestion`,
`FreeFormQuestion`, `NoteQuestion`, `FileUploadQuestion`), questionnaires
(`ModuleQuestionnaire`, `SubmoduleQuestionnaire`), media (`VideoPlayer`,
`AudioPlayer`, `ImageGallery`, `ContentCarousel`), and `MobileMenu`.

**Components:** `MediaContent`, `Breadcrumbs`, `Header`, `Button`, `Skeleton`.

## Routes

| Route                        | File                             | Purpose                            |
| ---------------------------- | -------------------------------- | ---------------------------------- |
| `/`                          | `index.tsx`                      | Landing page                       |
| `/new-user`                  | `new-user.tsx`                   | Anonymous user creation (GET/POST) |
| `/login`                     | `login.tsx`                      | Login form                         |
| `/logout`                    | `logout.tsx`                     | Session logout                     |
| `/consent`                   | `consent.tsx`                    | Informed consent form              |
| `/dashboard`                 | `dashboard.tsx`                  | User session dashboard             |
| `/modules`                   | `modules/index.tsx`              | Module overview                    |
| `/modules/[name]`            | `modules/[name].tsx`             | Module page                        |
| `/modules/[name]/review`     | `modules/[name]/review.tsx`      | Read-only review of completed      |
| `/modules/[name]/[submodule]`| `modules/[name]/[submodule].tsx` | Submodule page                     |

Special files: `_app.tsx` (layout + theme injection), `_404.tsx`.

**Layout:** `_app.tsx` applies visual effects (grain, CRT vignette, glitch)
based on page type and injects theme CSS variables.

## API Client (lib/api.ts)

Type-safe client for the Utopia backend API.

```typescript
import { api } from "../lib/api.ts";

api.setToken(authToken); // Set auth token
const profile = await api.getProfile(); // Get current user profile
const modules = await api.getModules(); // List modules
await api.startModule("module1"); // Start a module
await api.submitResponse(questionId, value); // Submit response
```

**Key Methods:**

- Token: `setToken()`, `clearToken()`
- Auth: `createAnonymousUser()`, `login()`, `getProfile()`
- Modules: `getModules()`, `getCurrentModule()`, `getModule()`,
  `startModule()`, `completeModule()`
- Submodules: `getSubmodule()`, `startSubmodule()`, `completeSubmodule()`
- Questions: `getModuleQuestions()`, `getSubmoduleQuestions()`,
  `getQuestion()`, `submitResponse()`, `submitBatchResponses()`,
  `getResponse()`
- Content: `getModuleContent()`, `getSubmoduleContent()`

There is no file-upload method on the client; the `FileUploadQuestion` island
handles uploads directly.

**Configuration:** `API_BASE_URL` environment variable (default:
`http://localhost:3001`)

## Visual Effects & Theming

Custom VHS/retro aesthetic defined in `static/styles.css` and
`tailwind.config.ts`:

- Film grain effect (light/heavy variants with wobble animation)
- CRT vignette (radial gradient edge darkening)
- Chromatic aberration (red/blue color shifts)
- Glitch effect (animated text distortion on hover)

**Data-Driven Themes:**

- `lib/themes.ts` fetches themes from the backend (`GET /api/themes`) with a
  5-minute in-memory cache; `DEFAULT_THEME` is a hardcoded fallback
  (`id: "vhs"`, "VHS Static")
- Theme CSS variables (`--theme-*`) are injected as inline styles by
  `_app.tsx`; defaults live on `:root` in `static/styles.css`
- Theme-specific effect overrides in `static/styles.css`:
  `.theme-poolrooms`, `.theme-redrooms`, `.theme-void`, `.theme-yellow`

**Tailwind Theme Extensions:**

- Theme-aware `t-*` token namespace mapped to `--theme-*` CSS vars: `t-bg`,
  `t-text`, `t-text-dim`, `t-text-muted`, `t-accent`, `t-accent-dim`,
  `t-accent-secondary`, `t-surface`, `t-surface-light`, `t-border`, plus
  `shadow-t-glow`
- Static colors: `analog-*` (red, blue, purple, cyan), `decay-*` (void, ash,
  smoke, dust), `vhs-*`
- Custom shadows: `vhs-*` glow effects
- Font: JetBrains Mono

## State Management

Uses Preact Signals for reactive state in islands:

```typescript
import { useSignal } from "@preact/signals";

const count = useSignal(0);
count.value++; // Triggers re-render
```

## Environment Variables

- `API_BASE_URL` - Backend API URL (default: `http://localhost:3001`)
- `PUBLIC_API_BASE_URL` - Browser-facing API URL (defaults to `API_BASE_URL`)
