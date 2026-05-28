# ti-parts-engine

Bootstrap for a future TI parts engine package in the `tscircuit` org.

## Scope

This PR keeps the initial scope intentionally small:

- Bun/TypeScript package scaffolding
- build, typecheck, test, and formatting tooling
- local env example for partner-token based development
- safe gitignore rules for env files, build output, and local generated artifacts
- bootstrap Bun config and CI workflows
- initial shared package structure for follow-up TI parts work
- a typed Ultra Librarian bridge client surfaced through a small parts engine API

## Repo shape

`ti-parts-engine` should stay close to `@tscircuit/parts-engine` in overall package layout:

- `index.ts` for package exports
- `lib/ti-parts-engine/` for the package-level engine API
- `lib/ultra-librarian-bridge-client/` for the lower-level bridge client
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

## LM358 bridge verification

Use this local-only flow when you need to verify the Ultra Librarian Bridge can
search and export KiCad assets for `LM358`.

```bash
cp .env.example .env.local
```

Add your real partner token to `.env.local`:

```bash
PARTNER_TOKEN=
```

Then run:

```bash
bun run verify:lm358-bridge
```

The script uses
`https://situations-build-tommy-integrate.trycloudflare.com`, calls
`GET /v1/parts/search?q=LM358&exact_only=true&limit=1`, then calls
`GET /v1/export/kicad?mpn=LM358&version=6`. It writes the downloaded zip and
extracted KiCad files under ignored `imports/` output only.

## Safety notes

- `.env`, `.env.local`, `imports/`, `.tmp/`, and other temporary output are ignored by git
- real partner tokens are read from local env files only and are never logged
- downloaded Ultra Librarian/TI zip files and extracted KiCad files must stay in ignored local output only
- this PR only adds code, tooling, config examples, and tests
