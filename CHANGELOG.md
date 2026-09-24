# Changelog

All notable changes to this project are documented here.

## 1.2.0

### Added
- Config file support: `fs-watch.config.json`, an `"fsWatch"` key in `package.json`, or `--config <file>`. CLI flags override config values.
- Multiple watch paths (`-w/--watch`), extension filtering (`-e/--ext`) and glob patterns (`--include`, `--ignore`) supporting `*`, `**`, `?`, `[abc]` and `{a,b}`.
- Run modes: `--mode restart | queue | concurrent`, and a configurable `--kill-timeout` for the SIGTERM to SIGKILL escalation.
- Built-in fallback watcher that walks the directory tree, so recursive watching also works on Node 18 (Linux). Ignored folders are never descended into. Force it with `--fallback`.
- Interactive keys: `r` rerun, `c` clear the screen, `q` quit (disable with `--no-keys`).
- Logging controls: `--quiet`, `--verbose`, `--timestamps`, `--no-color`, and `NO_COLOR` support.
- Test suite (`npm test`, built on `node:test`) and a GitHub Actions workflow.
- `LICENSE` and this changelog; `prepublishOnly` and a `files` list for publishing.

### Changed
- Minimum Node version lowered from 20 to 18 thanks to the fallback watcher.
- Default ignores now also cover `.DS_Store`, `*.swp` and `*~`.
- `--ignore` patterns are globs (a plain folder name still works as before).

## 1.1.0

### Added
- Debounced runs (`--debounce`), default ignores (`--ignore`, `--no-default-ignore`), `--help` and `--version`.
- The previous run is stopped before a new one starts, including everything it spawned.
- Live output streaming, with exit code and duration reported for every run.
- Friendly errors for bad flags and missing paths.
- Multi-word commands no longer need quotes.

### Changed
- Source split into `cli/`, `core/`, `utils/` and `types/`.
- Removed the unused `yoctocolors` dependencies; declared `@types/node`.
- `dist/` is no longer committed; `npm install` builds it.

### Fixed
- Output of a failing command was discarded.
- An invalid path crashed with a raw stack trace.
- Signal and error handlers were registered after the watcher started.

## 1.0.0

- Initial release.