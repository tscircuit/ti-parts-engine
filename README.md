# ti-parts-engine

Bootstrap for a future TI parts engine package in the `tscircuit` org.

## Scope

This PR keeps the initial scope intentionally small:

- Bun/TypeScript package scaffolding
- build, typecheck, test, and formatting tooling
- optional local env example for partner-token based development
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

## GitHub install

This package is not published to npm yet. Install it directly from GitHub:

```bash
bun add -D github:tscircuit/ti-parts-engine
```

For the reviewer-requested custom config flow, import `createTiPartsEngine`:

```ts
import { createTiPartsEngine } from "@tscircuit/ti-parts-engine"
```

The default API endpoint is
`https://ti-api-cors-proxy.seve.workers.dev/`, which does not require a
partner token. If a future local flow needs partner credentials:

```bash
cp .env.example .env.local
```

Set `PARTNER_TOKEN` in `.env.local` or `.env`. Keep the real token local only
and never commit it.

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
bun run verify:lm358-bridge
```

The script uses
`https://ti-api-cors-proxy.seve.workers.dev/`, calls
`GET /v1/parts/search?q=LM358&exact_only=true&limit=1`, then calls
`GET /v1/export/kicad?mpn=LM358&version=6`. It writes the downloaded zip and
extracted KiCad files under ignored `imports/` output only. If `PARTNER_TOKEN`
is set in `.env.local`, `.env`, or the shell environment, the script includes it;
otherwise it calls the default proxy without auth.

## Custom Platform Config Example

For local CLI or dev usage, use a custom `tscircuit.config.ts` that provides
TI-backed part lookup through `platformConfig.partsEngine` and explicit
`ti:` footprint strings through `platformConfig.footprintLibraryMap`:

```ts
import {
  createTiFootprintLibrary,
  createTiPartsEngine,
} from "@tscircuit/ti-parts-engine"

export default {
  platformConfig: {
    partsEngine: createTiPartsEngine(),
    footprintLibraryMap: createTiFootprintLibrary(),
  },
}
```

If you want a runnable `RootCircuit` example, use
[`examples/root-circuit-platform-config.tsx`](./examples/root-circuit-platform-config.tsx):

```bash
bun examples/root-circuit-platform-config.tsx
```

The example creates the TI parts engine with `createTiPartsEngine(...)`, passes
it to `new RootCircuit({ platform: { partsEngine } })`, adds an `LM358` chip,
renders the circuit, and prints Circuit JSON.

## Explicit `ti:` Footprint Strings

With `footprintLibraryMap` configured, circuits can reference TI footprints by
manufacturer part number:

```tsx
<chip name="U1" footprint="ti:LM358" />
```

Programmatic `RootCircuit` callers can also use `createTiPlatformConfig(...)`
to wire both `partsEngine` and `footprintLibraryMap` together.
