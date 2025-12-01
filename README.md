# Terminal - Utopia Frontend

A modern frontend application for the Utopia research platform, built with
[Fresh](https://fresh.deno.dev) - a next-generation web framework for Deno.

## Overview

This is the frontend client for the Utopia server application. It provides a
user interface for participants to navigate through modules, answer questions,
and complete research tasks with adaptive branching logic.

## Tech Stack

- **Framework**: Fresh (Deno's web framework)
- **Runtime**: Deno
- **UI Library**: Preact (with signals for state management)
- **Language**: TypeScript
- **Backend**: Utopia API (Hono-based REST API)

## Features

- Server-side rendering (SSR) for optimal performance
- Island architecture for interactive components
- Type-safe API client for backend communication
- Sequential module progression with branching logic
- Real-time question response handling
- Anonymous user authentication

## Prerequisites

- [Deno](https://deno.land/manual/getting_started/installation) installed on
  your machine

## Getting Started

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` to set your backend API URL (default: `http://localhost:8000`):

```bash
API_BASE_URL=http://localhost:8000
```

### 2. Start the Development Server

```bash
deno task start
```

This will start the Fresh development server with hot-reloading enabled. The
application will be available at `http://localhost:8000`.

### 3. Build for Production

```bash
deno task build
```

### 4. Preview Production Build

```bash
deno task preview
```

## Project Structure

```
terminal/
├── components/       # Reusable UI components
├── islands/          # Interactive client-side components
├── lib/              # Utilities and API client
│   └── api.ts        # Type-safe API client for Utopia backend
├── routes/           # File-based routing
│   ├── api/          # API routes (server-side)
│   ├── _app.tsx      # Root app component
│   └── index.tsx     # Home page
├── static/           # Static assets (images, CSS, etc.)
├── deno.json         # Deno configuration and tasks
├── fresh.config.ts   # Fresh framework configuration
└── main.ts           # Application entry point
```

## API Client Usage

The project includes a type-safe API client located at
[lib/api.ts](lib/api.ts:1). Example usage:

```typescript
import { api } from "../lib/api.ts";

// Login
const { token, user } = await api.login(username, password);
api.setToken(token);

// Get modules
const modules = await api.getModules();

// Start a module
await api.startModule("consent");

// Submit a question response
await api.submitResponse(questionId, "My answer");
```

## Available Tasks

```bash
deno task start      # Start development server with hot-reload
deno task build      # Build for production
deno task preview    # Preview production build
deno task check      # Run type checking, formatting, and linting
deno task manifest   # Regenerate the Fresh manifest
```

## Backend Integration

This frontend is designed to work with the Utopia backend server. Make sure the
backend is running and accessible at the URL configured in your `.env` file.

For backend documentation, see the
[Utopia API documentation](../utopia/README.md).

## Development

Fresh uses a file-based routing system:

- Add new pages by creating files in [routes/](routes/)
- Create interactive islands in [islands/](islands/)
- Add reusable components in [components/](components/)

Learn more about Fresh: https://fresh.deno.dev/docs/getting-started

## Contributing

This is a research platform frontend. For questions or issues, please contact
the development team.

## License

[Add your license information here]
