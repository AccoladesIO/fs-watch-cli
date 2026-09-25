import { readFileSync } from 'fs';
import { join } from 'path';
import { DEFAULT_DEBOUNCE_MS, DEFAULT_KILL_TIMEOUT_MS } from './config';

export const HELP_TEXT = `stye - run a command whenever files change

Usage:
  stye [options] <path> <command...>
  stye [options] -w <path> [-w <path>...] <command...>
  stye [options] -- <command...>        (paths/command from the config file)

Watching:
  -w, --watch <path>     File or folder to watch; repeat for several
  -e, --ext <list>       Only react to these extensions, e.g. ts,js
      --include <glob>   Only react to matching paths (repeatable)
      --ignore <glob>    Never react to matching paths (repeatable)
      --no-default-ignore  Also watch node_modules, .git, dist, editor temp files
      --fallback         Use the built-in directory walker instead of native recursive watching

Running:
  -d, --debounce <ms>    Quiet period after the last change before running (default ${DEFAULT_DEBOUNCE_MS})
  -m, --mode <mode>      restart (default) | queue | concurrent
      --kill-timeout <ms>  Wait this long after SIGTERM before SIGKILL (default ${DEFAULT_KILL_TIMEOUT_MS})

Output:
  -q, --quiet            Only errors and failed runs
      --verbose          Extra diagnostic output
      --timestamps       Prefix log lines with the time
      --no-color         Disable colours (NO_COLOR is honoured too)
      --no-keys          Disable the r / c / q shortcuts

Other:
  -c, --config <file>    Read settings from a JSON file
  -h, --help             Show this help
  -v, --version          Show the version

Globs support *, **, ?, [abc] and {a,b}. Without a "/" a pattern matches any path
segment ("*.log"); with a "/" it is anchored to the watched folder ("src/**/*.tmp").

Keys while running: r = rerun now, c = clear screen, q = quit.

Examples:
  stye ./src "npm run build"
  stye -w src -w tests -e ts --mode queue npm test
  stye --ignore "*.{log,tmp}" . node server.js`;

export function readVersion(): string {
    try {
        const raw = readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8');
        return String(JSON.parse(raw).version);
    } catch {
        return 'unknown';
    }
}