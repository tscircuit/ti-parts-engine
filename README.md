# ti-parts-engine

A TI parts engine workspace with a small Ultra Librarian bridge pilot check for LM358 KiCad export.

## Repo shape

`ti-parts-engine` should be closest to `@tscircuit/parts-engine` in overall package layout:

- `index.ts` for package exports
- `lib/ultra-librarian-bridge-client.ts` for the bridge HTTP client
- `lib/kicad-archive.ts` for zip inspection and extraction helpers
- `tests/` for secret-free Bun tests
- `scripts/` for token-backed live/dev checks

For env handling and ignored temporary downloaded data, the pattern is closer to `jlcsearch`:

- local-only `.env` / `.env.local`
- ignored generated output under `imports/`
- live helper scripts kept separate from normal unit tests

So the intended shape here is: `parts-engine` style package, with `jlcsearch` style setup and temp-data hygiene.

## Local setup

This repo follows the same Bun-first setup used in nearby `tscircuit` repos.

1. Install dependencies:

```bash
bun install
```

2. Create a local env file and add the partner token:

```bash
cp .env.example .env.local
```

Set `PARTNER_TOKEN` in `.env.local` or `.env`. Keep the real token local only and never commit it.

## Run the LM358 bridge test

```bash
bun run verify:lm358-bridge
```

For normal repo checks that do not require a partner token:

```bash
bun test
bun run typecheck
bun run build
```

What the script does:

- Reads `PARTNER_TOKEN` from the local environment.
- Uses `https://situations-build-tommy-integrate.trycloudflare.com` by default.
- Calls `GET /v1/parts/search?q=LM358&exact_only=true&limit=1`.
- Calls `GET /v1/export/kicad?mpn=LM358&version=6`.
- Saves the downloaded zip under `imports/`.
- Verifies the zip contains at least one `.kicad_sym` and one `.kicad_mod`.
- Extracts matching KiCad files only inside the ignored `imports/` directory.

You can override the base URL locally if the pilot tunnel rotates:

```bash
BASE_URL=https://situations-build-tommy-integrate.trycloudflare.com bun run test:lm358-bridge
```

`bun run test:lm358-bridge` is kept as a compatibility alias, but `verify:lm358-bridge` is the clearer name because this is a live bridge verification script, not a unit test.

## Safety notes

- The script never hardcodes or prints the partner token.
- `.env`, `.env.local`, `imports/`, `.tmp/`, and other temporary output are ignored by git.
- Downloaded Ultra Librarian/TI artifacts stay inside ignored local artifact directories and should not be committed.
