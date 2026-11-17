/**
 * True only inside the Tauri shell — the renderer also runs in a plain
 * browser during `bun run dev` and under Vitest, where the updater plugin
 * has nothing to talk to. Mirrors the guard in `session-storage.ts`.
 */
export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
