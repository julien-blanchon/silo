# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Silo is an AI-powered desktop application for **computer use** — it lets AI models take screenshots, move the mouse, click, type, and scroll on the user's actual desktop. Built with SvelteKit 5 (frontend) + Tauri v2 (Rust backend), routed through OpenRouter or LM Studio.

## Development Commands

```bash
bun install                  # Install dependencies
bun run dev                  # Start Vite dev server (port 1420) + Tauri dev mode
bun run build                # Build frontend for production
bun run tauri build          # Build the desktop app binary
bun run check                # TypeScript type checking (svelte-check)
bun run check:watch          # Type checking in watch mode
```

No test framework is currently configured.

## Architecture

### Frontend ↔ Backend Boundary

- **Frontend:** SvelteKit 5 SPA (static adapter, no SSR) in `src/`
- **Backend:** Tauri v2 Rust commands in `src-tauri/src/`
- **IPC bindings:** Auto-generated via `tauri-specta` into `src/lib/bindings.ts` on debug builds. All Rust commands must be registered in `create_builder()` in `src-tauri/src/lib.rs` via `collect_commands![]`.

### AI Transport Layer

The core AI integration is a custom `ChatTransport` implementation:

1. **`src/lib/transports/computer-transport.ts`** — `ComputerTransport` class implements the Vercel AI SDK `ChatTransport` interface. Manages model selection, middleware wrapping, image management in conversation history (keeps last 5 screenshots), and token usage tracking.
2. **`src/lib/tools/index.ts`** — Defines the `computer` tool with actions (screenshot, click, type, key, scroll, drag, wait, cursor_position). All coordinates are scaled between "computer use dimensions" (optimized for AI training, e.g. 1280x800) and real monitor dimensions.
3. **`src/lib/middleware/uiTars.ts`** — Custom middleware for UI-TARS protocol format.

Models connect via two providers:
- **OpenRouter** (most models) — requires API key in settings
- **LM Studio** (local models) — connects to local server

Models that lack native tool calling use middleware wrappers (`gemma`, `hermes`, `morphXml`, `uiTars`) from `@ai-sdk-tool/parser` to convert tool schemas into prompt-formatted instructions.

### State Management

- **Persistent settings:** `src/lib/runes/settings.svelte.ts` — uses `@tauri-store/svelte` `RuneStore` with debounced auto-save (stores API keys, default model, auto-screenshot toggle)
- **UI state:** Svelte 5 runes (`$state`, `$derived`, `$effect`) — no legacy stores

### Rust Commands (`src-tauri/src/commands/`)

- `screenshot.rs` — Screen capture via `xcap`, resized to target dimensions via `fast_image_resize`, returned as base64 JPEG
- `input.rs` — Mouse/keyboard control via `enigo` (move, click, type, key press, drag, scroll)
- All commands use `specta` for TypeScript type generation

### UI Components

- **Base UI:** shadcn-svelte components in `src/lib/components/ui/`
- **AI-specific:** `src/lib/components/ai-elements/` — prompt-input, conversation, message, context (token usage), reasoning, response, tool, artifact, loader
- **Styling:** Tailwind CSS v4

### Coordinate Scaling

`src/lib/utils/scaling.ts` handles bidirectional coordinate mapping between the AI model's "computer use" resolution and the actual monitor resolution. The `ScalingSource` enum indicates whether coordinates originate from the API or the real computer.

## Conventions

- **Svelte 5 syntax:** Use runes (`$state`, `$derived`, `$effect`, `$props`, `$bindable`), `onclick` (not `on:click`), snippets with `{@render}` (not `<slot>`), callback props (not `createEventDispatcher`)
- **Tauri v2 patterns:** Owned types in async commands (no `&str`), all commands registered in `generate_handler![]`, capabilities required for plugin features
- **Commits:** Angular conventional commits (`feat`, `fix`, `docs`, etc.) — semantic-release auto-bumps versions in `package.json`, `tauri.conf.json`, and `Cargo.toml`
- **Package manager:** Bun (not npm/yarn)
- **Formatting:** Prettier with svelte and tailwindcss plugins