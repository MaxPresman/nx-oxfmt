# nx-oxfmt

Nx plugin for oxfmt (Rust-powered code formatter from the Oxc project).

## Project Structure

- `src/executors/format/` — executor that runs `oxfmt` to write formatted files
- `src/executors/check/` — executor that runs `oxfmt --check` (CI mode, exits non-zero on unformatted files)
- `src/generators/init/` — generator that installs oxfmt, scaffolds `.oxfmtrc.json`, optionally migrates Prettier
- `src/utils/` — shared utilities (binary resolution, CLI arg building, oxfmt runner)
- `plugin.ts` — `createNodesV2` for automatic target inference

## Development

- **Test:** `npm test` (vitest)
- **Type check:** `npx tsc --noEmit`
- **Build:** `npm run build`

## Conventions

- Do not commit directly to main
- Run `npx tsc --noEmit` before committing
- Each executor has `schema.json` + `schema.d.ts` for Nx CLI/Console integration
- Tests mock `src/utils/run-oxfmt.ts` rather than `child_process` directly (Nx internals use child_process and mocking it breaks imports)
