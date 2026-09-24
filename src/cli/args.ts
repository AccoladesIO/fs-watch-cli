import { RunMode, RUN_MODES, ParseResult, UserSettings } from "../types";
import { UsageError } from "../utils/errors";
import { splitPatterns } from "../utils/glob";



function parseMs(flag: string, value: string): number {
    if (!/^\d+$/.test(value)) {
        throw new UsageError(`${flag} expects a whole number of milliseconds, got "${value}".`);
    }
    return Number(value);
}

function parseMode(value: string): RunMode {
    if (!RUN_MODES.includes(value as RunMode)) {
        throw new UsageError(`--mode must be one of: ${RUN_MODES.join(', ')} (got "${value}").`);
    }
    return value as RunMode;
}

/**
 * Grammar:
 *   fs-watch-cli [options] <path> <command...>        classic form
 *   fs-watch-cli [options] -w <dir> [-w <dir>] <command...>
 *   fs-watch-cli [options] -- <command...>            paths come from --watch or the config file
 *
 * Options must come first. Anything after them (or after "--") is the command.
 * The result only contains what the user actually typed; defaults and config
 * values are merged later by resolveOptions().
 * @throws UsageError on invalid input.
 */
export function parseArgs(argv: string[]): ParseResult {
    const settings: UserSettings = {};
    let configPath: string | undefined;
    let sawSeparator = false;

    let i = 0;
    for (; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--') {
            sawSeparator = true;
            i++;
            break;
        }
        if (!arg.startsWith('-') || arg === '-') break; 

        const eq = arg.indexOf('=');
        const flag = eq === -1 ? arg : arg.slice(0, eq);
        const inline = eq === -1 ? undefined : arg.slice(eq + 1);
        const takeValue = (): string => {
            const value = inline ?? argv[++i];
            if (value === undefined) throw new UsageError(`Option ${flag} needs a value.`);
            return value;
        };

        switch (flag) {
            case '-h':
            case '--help':
                return { kind: 'help' };
            case '-v':
            case '--version':
                return { kind: 'version' };
            case '-w':
            case '--watch':
                (settings.watch ??= []).push(takeValue());
                break;
            case '-e':
            case '--ext':
                (settings.ext ??= []).push(...splitPatterns(takeValue()));
                break;
            case '--include':
                (settings.include ??= []).push(...splitPatterns(takeValue()));
                break;
            case '--ignore':
                (settings.ignore ??= []).push(...splitPatterns(takeValue()));
                break;
            case '--no-default-ignore':
                settings.defaultIgnore = false;
                break;
            case '-d':
            case '--debounce':
                settings.debounce = parseMs(flag, takeValue());
                break;
            case '-m':
            case '--mode':
                settings.mode = parseMode(takeValue());
                break;
            case '--kill-timeout':
                settings.killTimeout = parseMs(flag, takeValue());
                break;
            case '-q':
            case '--quiet':
                settings.quiet = true;
                settings.verbose = false;
                break;
            case '--verbose':
                settings.verbose = true;
                settings.quiet = false;
                break;
            case '--timestamps':
                settings.timestamps = true;
                break;
            case '--no-color':
                settings.color = false;
                break;
            case '--no-keys':
                settings.keys = false;
                break;
            case '--fallback':
                settings.fallback = true;
                break;
            case '-c':
            case '--config':
                configPath = takeValue();
                break;
            default:
                throw new UsageError(`Unknown option: ${flag}`);
        }
    }

    const rest = argv.slice(i);
    let command = '';
    if (sawSeparator || settings.watch?.length) {
        command = rest.join(' ');
    } else if (rest.length > 0) {
        settings.watch = [rest[0]];
        command = rest.slice(1).join(' ');
    }
    if (command.trim()) settings.command = command.trim();

    return { kind: 'run', settings, configPath };
}