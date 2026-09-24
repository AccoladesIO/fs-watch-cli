import { statSync, watch } from 'fs';
import { join } from 'path';
import { UsageError } from '../utils/errors';
import { Logger } from '../utils/logger';
import { startFallbackWatcher } from './fallback-watcher';
import { PathFilter } from './ignore';

export interface ActiveWatcher {
    close(): void;
}

export interface WatcherOptions {
    targets: string[];
    filter: PathFilter;
    log: Logger;
    forceFallback?: boolean;
    onChange(file: string): void;
    onError(err: Error): void;
}

/**
 * Starts one watcher per target and returns a handle that closes them all.
 * @throws UsageError when a target is missing or cannot be watched.
 */
export function startWatchers(options: WatcherOptions): ActiveWatcher {
    const active: ActiveWatcher[] = [];
    try {
        for (const target of options.targets) active.push(startWatcher(target, options));
    } catch (err) {
        active.forEach((watcher) => watcher.close());
        throw err;
    }
    return { close: () => active.forEach((watcher) => watcher.close()) };
}

function startWatcher(target: string, options: WatcherOptions): ActiveWatcher {
    const { filter, log, onChange, onError } = options;

    let isDirectory: boolean;
    try {
        isDirectory = statSync(target).isDirectory();
    } catch {
        throw new UsageError(`Path does not exist: ${target}`);
    }

    if (!isDirectory) {
        const watcher = watchOrThrow(target, false, () => onChange(target));
        watcher.on('error', onError);
        log.debug(`Watching file ${target}`);
        return { close: () => watcher.close() };
    }

    const emit = (relativePath: string): void => onChange(join(target, relativePath));

    if (!options.forceFallback) {
        try {
            const watcher = watch(target, { recursive: true, encoding: 'utf8' }, (_event, name) => {
                if (name && filter.accepts(name)) emit(name);
            });
            watcher.on('error', onError);
            log.debug(`Watching ${target} (native recursive)`);
            return { close: () => watcher.close() };
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code !== 'ERR_FEATURE_UNAVAILABLE_ON_PLATFORM') {
                throw new UsageError(`Could not watch ${target}: ${(err as Error).message}`);
            }
            log.debug('Native recursive watching is unavailable here - using the fallback watcher.');
        }
    }

    return startFallbackWatcher({ root: target, filter, log, onChange: emit, onError });
}

function watchOrThrow(target: string, recursive: boolean, listener: () => void) {
    try {
        return watch(target, { recursive }, listener);
    } catch (err) {
        throw new UsageError(`Could not watch ${target}: ${(err as Error).message}`);
    }
}