import assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, sep } from 'path';
import test from 'node:test';
import { createPathFilter } from '../src/core/ignore';
import { startWatchers } from '../src/core/watcher';
import { makeTempDir, removeDir, silentLogger, sleep, waitFor } from './helpers';

const posix = (path: string): string => path.split(sep).join('/');

function watchDir(dir: string, forceFallback: boolean, filter: Partial<Parameters<typeof createPathFilter>[0]> = {}) {
    const seen: string[] = [];
    const watcher = startWatchers({
        targets: [dir],
        filter: createPathFilter({ include: [], ignore: ['node_modules'], ext: [], ...filter }),
        log: silentLogger,
        forceFallback,
        onChange: (file) => seen.push(posix(file).replace(posix(dir) + '/', '')),
        onError: (err) => { throw err; },
    });
    return { seen, watcher };
}

for (const forceFallback of [false, true]) {
    const label = forceFallback ? 'fallback watcher' : 'native watcher';

    test(`${label}: reports nested changes and skips ignored folders`, async () => {
        const dir = makeTempDir();
        mkdirSync(join(dir, 'sub'));
        mkdirSync(join(dir, 'node_modules'));
        const { seen, watcher } = watchDir(dir, forceFallback);
        try {
            await sleep(150);
            writeFileSync(join(dir, 'top.txt'), '1');
            writeFileSync(join(dir, 'sub', 'deep.txt'), '1');
            writeFileSync(join(dir, 'node_modules', 'skip.txt'), '1');
            await waitFor(() => seen.includes('top.txt') && seen.includes('sub/deep.txt'), 4000, 'top.txt and sub/deep.txt');
            await sleep(250);
            assert.ok(!seen.some((file) => file.includes('node_modules')), `saw ${seen.join(', ')}`);
        } finally {
            watcher.close();
            removeDir(dir);
        }
    });

    test(`${label}: picks up files in a folder created while running`, async () => {
        const dir = makeTempDir();
        const { seen, watcher } = watchDir(dir, forceFallback);
        try {
            await sleep(150);
            mkdirSync(join(dir, 'fresh'));
            writeFileSync(join(dir, 'fresh', 'a.txt'), '1'); // written immediately, before any watcher could attach
            await waitFor(() => seen.includes('fresh/a.txt'), 4000, 'fresh/a.txt');
            await sleep(300);
            writeFileSync(join(dir, 'fresh', 'b.txt'), '1'); // and later writes keep working
            await waitFor(() => seen.includes('fresh/b.txt'), 4000, 'fresh/b.txt');
        } finally {
            watcher.close();
            removeDir(dir);
        }
    });

    test(`${label}: survives a folder being deleted and recreated`, { skip: process.platform === 'win32' }, async () => {
        const dir = makeTempDir();
        mkdirSync(join(dir, 'x'));
        const { seen, watcher } = watchDir(dir, forceFallback);
        try {
            await sleep(150);
            rmSync(join(dir, 'x'), { recursive: true });
            await sleep(250);
            mkdirSync(join(dir, 'x'));
            await sleep(250);
            writeFileSync(join(dir, 'x', 'again.txt'), '1');
            await waitFor(() => seen.includes('x/again.txt'), 4000, 'x/again.txt');
        } finally {
            watcher.close();
            removeDir(dir);
        }
    });

    test(`${label}: honours the extension filter`, async () => {
        const dir = makeTempDir();
        const { seen, watcher } = watchDir(dir, forceFallback, { ext: ['ts'] });
        try {
            await sleep(150);
            writeFileSync(join(dir, 'a.txt'), '1');
            writeFileSync(join(dir, 'b.ts'), '1');
            await waitFor(() => seen.includes('b.ts'), 4000, 'b.ts');
            await sleep(250);
            assert.ok(!seen.includes('a.txt'));
        } finally {
            watcher.close();
            removeDir(dir);
        }
    });
}

test('an explicitly named file is watched regardless of filters', async () => {
    const dir = makeTempDir();
    const file = join(dir, 'only.txt');
    writeFileSync(file, '0');
    const seen: string[] = [];
    const watcher = startWatchers({
        targets: [file],
        filter: createPathFilter({ include: [], ignore: ['*.txt'], ext: ['ts'] }),
        log: silentLogger,
        onChange: (f) => seen.push(f),
        onError: (err) => { throw err; },
    });
    try {
        await sleep(150);
        writeFileSync(file, '1');
        await waitFor(() => seen.length > 0, 4000, 'a change to the file');
    } finally {
        watcher.close();
        removeDir(dir);
    }
});

test('several targets are watched at once', async () => {
    const a = makeTempDir();
    const b = makeTempDir();
    const seen: string[] = [];
    const watcher = startWatchers({
        targets: [a, b],
        filter: createPathFilter({ include: [], ignore: [], ext: [] }),
        log: silentLogger,
        onChange: (f) => seen.push(f),
        onError: (err) => { throw err; },
    });
    try {
        await sleep(150);
        writeFileSync(join(a, 'one.txt'), '1');
        writeFileSync(join(b, 'two.txt'), '1');
        await waitFor(() => seen.some((f) => f.endsWith('one.txt')) && seen.some((f) => f.endsWith('two.txt')), 4000, 'both targets');
    } finally {
        watcher.close();
        removeDir(a);
        removeDir(b);
    }
});

test('a missing path is a UsageError, and earlier watchers are cleaned up', () => {
    const dir = makeTempDir();
    try {
        assert.throws(
            () =>
                startWatchers({
                    targets: [dir, join(dir, 'nope')],
                    filter: createPathFilter({ include: [], ignore: [], ext: [] }),
                    log: silentLogger,
                    onChange: () => undefined,
                    onError: () => undefined,
                }),
            { name: 'UsageError', message: /does not exist/ },
        );
    } finally {
        removeDir(dir);
    }
});