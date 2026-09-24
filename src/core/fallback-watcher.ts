import { Dirent, FSWatcher, readdirSync, statSync, watch } from 'fs';
import { join, relative, resolve, sep } from 'path';
import { Logger } from '../utils/logger';
import { PathFilter } from './ignore';


export interface FallbackOptions {
    root: string;
    filter: PathFilter;
    log: Logger;
    onChange(relativePath: string): void;
    onError(err: Error): void;
}

export interface FallbackWatcher {
    close(): void;
}

/**
 * Recursive watching for platforms where `fs.watch(..., { recursive: true })`
 * is unavailable (e.g. Node 18 on Linux). It walks the tree, attaches one
 * non-recursive watcher per directory, and keeps that set in sync as folders
 * are created and deleted. Ignored folders are never descended into.
 */
export function startFallbackWatcher(options: FallbackOptions): FallbackWatcher {
    const { filter, log, onChange, onError } = options;
    const root = resolve(options.root);
    const watchers = new Map<string, FSWatcher>();
    let closed = false;

    const toRelative = (path: string): string => relative(root, path).split(sep).join('/');

    const listDirectory = (dir: string): Dirent[] => {
        try {
            return readdirSync(dir, { withFileTypes: true });
        } catch {
            return [];
        }
    };

    const removeDirectory = (dir: string): void => {
        for (const [path, watcher] of watchers) {
            if (path === dir || path.startsWith(dir + sep)) {
                watcher.close();
                watchers.delete(path);
            }
        }
    };

    const addDirectory = (dir: string, announce: boolean): void => {
        if (closed || watchers.has(dir)) return;
        const rel = toRelative(dir);
        if (rel && filter.isIgnored(rel)) return;

        let watcher: FSWatcher;
        try {
            watcher = watch(dir, { encoding: 'utf8' }, (event, name) => handleEvent(dir, event, name));
        } catch (err) {
            const error = err as NodeJS.ErrnoException;
            const hint = error.code === 'ENOSPC' || error.code === 'EMFILE'
                ? ' (too many watchers - raise fs.inotify.max_user_watches or ignore large folders)'
                : '';
            onError(new Error(`Could not watch ${dir}: ${error.message}${hint}`));
            return;
        }
        watcher.on('error', (err) => {
            removeDirectory(dir);
            if (dir === root) onError(err);
        });
        watchers.set(dir, watcher);

        for (const entry of listDirectory(dir)) {
            const child = join(dir, entry.name);
            if (entry.isDirectory()) {
                addDirectory(child, announce);
            } else if (announce && filter.accepts(toRelative(child))) {
                onChange(toRelative(child));
            }
        }
    };

    function handleEvent(dir: string, event: string, name: string | null): void {
        if (closed || !name) return;
        const full = join(dir, name);
        const rel = toRelative(full);
        if (filter.isIgnored(rel)) return;

        if (event === 'rename') {
            let isDirectory = false;
            try {
                isDirectory = statSync(full).isDirectory();
            } catch {
                removeDirectory(full);
            }
            if (isDirectory) addDirectory(full, true);
        }
        if (filter.accepts(rel)) onChange(rel);
    }

    addDirectory(root, false);
    log.debug(`Fallback watcher: watching ${watchers.size} director${watchers.size === 1 ? 'y' : 'ies'} under ${options.root}`);

    return {
        close: () => {
            closed = true;
            watchers.forEach((watcher) => watcher.close());
            watchers.clear();
        },
    };
}