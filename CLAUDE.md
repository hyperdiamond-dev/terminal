# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
deno task start      # Dev server with hot-reload (watches static/, routes/)
deno task check      # Format check, lint, type check
deno task build      # Production build
deno task preview    # Run production build
deno task manifest   # Regenerate Fresh manifest (fresh.gen.ts)
```

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

## Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.tsx` | Landing page |
| `/new-user` | `new-user.tsx` | Anonymous user creation (GET/POST) |
| `/consent` | `consent.tsx` | Informed consent form |
| `/dashboard` | `dashboard.tsx` | User session dashboard |
| `/greet/[name]` | `greet/[name].tsx` | Dynamic route example |
| `/api/joke` | `api/joke.ts` | API endpoint example |

**Layout:** `_app.tsx` applies visual effects (grain, CRT vignette, glitch) based on page type.

## API Client (lib/api.ts)

Type-safe client for the Utopia backend API.

```typescript
import { api } from "../lib/api.ts";

api.setToken(authToken);                    // Set auth token
const user = await api.getCurrentUser();    // Get current user
const modules = await api.getModules();     // List modules
await api.startModule("module1");           // Start a module
await api.submitResponse(questionId, value); // Submit response
```

**Key Methods:**
- Auth: `createAnonymousUser()`, `login()`, `getCurrentUser()`
- Modules: `getModules()`, `getCurrentModule()`, `startModule()`, `completeModule()`
- Submodules: `getSubmodule()`, `startSubmodule()`, `completeSubmodule()`
- Questions: `getModuleQuestions()`, `getSubmoduleQuestions()`, `submitResponse()`, `submitBatchResponses()`

**Configuration:** `API_BASE_URL` environment variable (default: `http://localhost:8000`)

## Visual Effects

Custom VHS/retro aesthetic defined in `static/styles.css` and `tailwind.config.ts`:
- Film grain effect (light/heavy variants with wobble animation)
- CRT vignette (radial gradient edge darkening)
- Chromatic aberration (red/blue color shifts)
- Glitch effect (animated text distortion on hover)

**Tailwind Theme Extensions:**
- Custom colors: `analog-*` (red, blue, purple, cyan), `decay-*` (void, ash, smoke, dust)
- Custom shadows: `vhs-*` glow effects
- Font: JetBrains Mono

## State Management

Uses Preact Signals for reactive state in islands:

```typescript
import { useSignal } from "@preact/signals";

const count = useSignal(0);
count.value++;  // Triggers re-render
```

## Environment Variables

- `API_BASE_URL` - Backend API URL (default: `http://localhost:8000`)
