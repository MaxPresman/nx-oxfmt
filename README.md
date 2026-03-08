# nx-oxfmt

Nx plugin for [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) — the high-performance Rust-powered code formatter.

[![CI](https://github.com/MaxPresman/nx-oxfmt/actions/workflows/ci.yml/badge.svg)](https://github.com/MaxPresman/nx-oxfmt/actions/workflows/ci.yml)

## Features

- **Format executor** — runs `oxfmt` to write formatted files
- **Check executor** — runs `oxfmt --check` for CI validation
- **Init generator** — installs oxfmt, scaffolds `.oxfmtrc.json`, optional Prettier migration
- **Automatic target inference** — `createNodesV2` plugin adds `format` and `format-check` targets to every project

## Installation

```bash
npm install nx-oxfmt oxfmt --save-dev
```

## Quick Start

Initialize oxfmt in your workspace:

```bash
nx g nx-oxfmt:init
```

This will:
1. Add `oxfmt` as a dev dependency
2. Create a `.oxfmtrc.json` config file

To migrate from Prettier:

```bash
nx g nx-oxfmt:init --migratePrettier
```

## Usage

### Format files

```bash
nx run my-app:format
```

### Check formatting (CI)

```bash
nx run my-app:format-check
```

### Run across all projects

```bash
nx run-many -t format
nx run-many -t format-check
```

## Executor Options

| Option | Type | Default | Description |
|---|---|---|---|
| `patterns` | `string[]` | — | Glob patterns relative to project root |
| `config` | `string` | — | Path to `.oxfmtrc.json` relative to workspace root |
| `noErrorOnUnmatchedPattern` | `boolean` | `false` | Don't error on unmatched globs |

## Automatic Target Inference

Register the plugin in your `nx.json` to automatically add `format` and `format-check` targets to every project:

```json
{
  "plugins": ["nx-oxfmt/plugin"]
}
```

## License

[MIT](LICENSE)
