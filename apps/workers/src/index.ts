// Background worker process — Phase 1 has no persistent jobs.
// Seed scripts live in src/seeds/ and are run via `pnpm seed:*` commands.
// This file exists so the dev watch script and future cron jobs have an entrypoint.

console.log('[workers] No background jobs configured for Phase 1.');
console.log('[workers] Use `pnpm seed:all` to populate the database.');
