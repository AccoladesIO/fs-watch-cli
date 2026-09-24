# 📁 fs-watch-cli

> A lightweight CLI that watches files or folders and re-runs a command when something changes. Built with Node.js and TypeScript, with a single runtime dependency (`chalk`).

`fs-watch-cli` is a small nodemon-style tool built to answer one question: *how do file watchers really work under the hood?* Watching, debouncing, glob matching, process-tree control and the recursive-watch fallback are all implemented in this repo on top of native Node.js modules.

## 📦 Installation

Requires **Node.js 18 or newer**.

```bash
git clone https://github.com/your-username/fs-watch-cli
cd fs-watch-cli
npm install      # also builds the project
npm link         # makes `fs-watch-cli` available globally
```

## ⚙️ Usage

```
fs-watch-cli [options] <path> <command...>
fs-watch-cli [options] -w <path> [-w <path>...] <command...>
fs-watch-cli [options] -- <command...>        # paths/command come from the config file
```

Options go **before** the path or command; everything after them is the command. Quote the command if it contains shell characters such as `&&` or `|`.

### Examples

```bash
fs-watch-cli ./src "npm run build"
fs-watch-cli -w src -w tests -e ts,tsx --mode queue npm test
fs-watch-cli --ignore "*.{log,tmp}" . node server.js      # restarts the server on change
fs-watch-cli --verbose --timestamps ./src "npm run build"
```

## 🧰 Options

**Watching**

| Option | Description |
| --- | --- |
| `-w, --watch <path>` | File or folder to watch. Repeat for several |
| `-e, --ext <list>` | Only react to these extensions, e.g. `ts,js` |
| `--include <glob>` | Only react to matching paths (repeatable) |
| `--ignore <glob>` | Never react to matching paths (repeatable) |
| `--no-default-ignore` | Also watch `node_modules`, `.git`, `dist` and editor temp files |
| `--fallback` | Use the built-in directory walker instead of native recursive watching |

**Running**

| Option | Description |
| --- | --- |
| `-d, --debounce <ms>` | Quiet period after the last change before running (default `300`) |
| `-m, --mode <mode>` | `restart` (default), `queue` or `concurrent` |
| `--kill-timeout <ms>` | Wait this long after `SIGTERM` before `SIGKILL` (default `3000`) |

**Output and other**

| Option | Description |
| --- | --- |
| `-q, --quiet` / `--verbose` | Only errors and failed runs / extra diagnostics |
| `--timestamps` | Prefix log lines with the time |
| `--no-color` | Disable colours (`NO_COLOR` is honoured too) |
| `--no-keys` | Disable the interactive shortcuts |
| `-c, --config <file>` | Read settings from a JSON file |
| `-h, --help` / `-v, --version` | Help / version |

### Run modes

- **restart**: a new change stops the previous run (and everything it spawned) and starts a fresh one. Best for servers and dev tools.
- **queue**: a running command is left alone; changes that arrive meanwhile trigger exactly one more run afterwards. Best for builds and tests you don't want interrupted.
- **concurrent**: every change starts a new run immediately.

### Patterns

Globs support `*`, `**`, `?`, `[abc]`, `[!abc]` and `{a,b}`.

- **Without a `/`** the pattern matches any path segment: `node_modules`, `*.log`.
- **With a `/`** it is anchored to the watched folder: `src/generated`, `src/**/*.tmp`. Matching a folder covers everything inside it.
- `--ignore` wins over `--include` and `--ext`. An explicitly named *file* is always watched, whatever the filters say.

### Keys (interactive terminals only)

`r` rerun now · `c` clear screen · `q` or Ctrl+C quit

## 🗂 Config file

Instead of flags, put settings in `fs-watch.config.json` (or under an `"fsWatch"` key in `package.json`, or point at a file with `--config`). Then just run `fs-watch-cli`.

```json
{
  "watch": ["src", "tests"],
  "command": "npm test",
  "ext": ["ts"],
  "ignore": ["src/generated", "*.snap"],
  "debounce": 200,
  "mode": "queue"
}
```

Available keys: `watch`, `command`, `include`, `ext`, `ignore`, `defaultIgnore`, `debounce`, `mode`, `killTimeout`, `quiet`, `verbose`, `timestamps`, `color`, `keys`, `fallback`. Unknown keys are reported by name.

CLI flags override the config file per key (lists are replaced, not merged). If the config supplies the paths, pass the command after `--`: `fs-watch-cli -- npm run lint`.

## 🚀 Behaviour

- **Recursive watching** with a built-in fallback for platforms where `fs.watch` cannot recurse (Node 18 on Linux). The fallback attaches one watcher per folder, follows folders being created or deleted, and never descends into ignored folders.
- **Debounced runs**: a burst of saves triggers one run.
- **Clean process control**: `SIGTERM`, then `SIGKILL` after the kill timeout, applied to the whole process tree (`taskkill /T` on Windows).
- **Live output**: stdout and stderr stream straight to your terminal, colours included, even when the command fails. Each run ends with its exit code and duration.
- **Friendly errors**: bad flags, bad config values or a missing path give a one-line message, not a stack trace.
- **Clean shutdown**: Ctrl+C or `SIGTERM` stops the watchers and any running command.

## 🗂 Project layout

```
src/
├── index.ts                 entry point (wiring only)
├── cli/
│   ├── args.ts              flag parsing
│   ├── config.ts            config file loading, validation, option merging
│   └── help.ts              help text and version
├── core/
│   ├── watcher.ts           native watching, multiple targets
│   ├── fallback-watcher.ts  directory-walking watcher
│   ├── debounce.ts
│   ├── ignore.ts            include / ignore / extension filtering
│   └── runner.ts            restart / queue / concurrent command runner
├── utils/
│   ├── glob.ts              glob to RegExp
│   ├── logger.ts            levels, timestamps, colour
│   ├── keys.ts              interactive shortcuts
│   ├── shutdown.ts          signal and error handling
│   └── errors.ts
└── types/index.ts
tests/                       node:test suites (run with `npm test`)
```

## 🛠 Development

```bash
npm run dev -- ./src "echo changed"   # run from source with ts-node
npm run build                         # compile to dist/
npm test                              # run the test suite
```

## 👥 Contributing

Contributions are welcome. Fork the repo, create a branch, make your change with tests, run `npm test`, and open a pull request describing what changed. See `CHANGELOG.md` for history.

## 📜 License

MIT License © 2025 [Accoladesio]