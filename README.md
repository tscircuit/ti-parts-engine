# ti-parts-engine

Bootstrap for a future TI parts engine package in the `tscircuit` org.

## Scope

This PR keeps the initial scope intentionally small:

- Bun/TypeScript package scaffolding
- build, typecheck, test, and formatting tooling
- local env example for partner-token based development
- safe gitignore rules for env files, build output, and local generated artifacts
- initial shared package structure for follow-up TI parts work
- a typed Ultra Librarian bridge client with unit tests

## Repo shape

`ti-parts-engine` should stay close to `@tscircuit/parts-engine` in overall package layout:

- `index.ts` for package exports
- `lib/ultra-librarian-bridge-client.ts` for the bridge HTTP client
- `tests/` for secret-free Bun tests

## Local setup

```bash
bun install
```

If a future local flow needs partner credentials:

```bash
cp .env.example .env.local
```

Set `PARTNER_TOKEN` in `.env.local` or `.env`. Keep the real token local only and never commit it.

## Repo checks

```bash
bun test
bun run typecheck
bun run build
bun run format
```

## Safety notes

- `.env`, `.env.local`, `imports/`, `.tmp/`, and other temporary output are ignored by git
- this PR only adds code, tooling, config examples, and tests
