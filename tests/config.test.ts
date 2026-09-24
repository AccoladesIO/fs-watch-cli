import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import test from 'node:test';
import { loadConfig, resolveOptions } from '../src/cli/config';
import { makeTempDir, removeDir } from './helpers';

function withDir(files: Record<string, string>, body: (dir: string) => void): void {
    const dir = makeTempDir();
    try {
        for (const [name, content] of Object.entries(files)) {
            mkdirSync(join(dir, name, '..'), { recursive: true });
            writeFileSync(join(dir, name), content);
        }
        body(dir);
    } finally {
        removeDir(dir);
    }
}

test('loads fs-watch.config.json and normalises a string to an array', () => {
    withDir({ 'fs-watch.config.json': '{"$schema":"x","watch":"src","command":"npm test","debounce":50}' }, (dir) => {
        assert.deepEqual(loadConfig(dir), { watch: ['src'], command: 'npm test', debounce: 50 });
    });
});

test('falls back to the "fsWatch" key in package.json', () => {
    withDir({ 'package.json': '{"name":"x","fsWatch":{"mode":"queue"}}' }, (dir) => {
        assert.deepEqual(loadConfig(dir), { mode: 'queue' });
    });
});

test('a package.json without the key, or broken, is not an error', () => {
    withDir({ 'package.json': '{"name":"x"}' }, (dir) => assert.deepEqual(loadConfig(dir), {}));
    withDir({ 'package.json': '{ nope' }, (dir) => assert.deepEqual(loadConfig(dir), {}));
});

test('--config points at an explicit file and must exist', () => {
    withDir({ 'custom.json': '{"ext":["ts"]}' }, (dir) => {
        assert.deepEqual(loadConfig(dir, 'custom.json'), { ext: ['ts'] });
        assert.throws(() => loadConfig(dir, 'missing.json'), { name: 'UsageError', message: /not found/ });
    });
});

test('a broken explicit config file names the file', () => {
    withDir({ 'fs-watch.config.json': '{ nope' }, (dir) => {
        assert.throws(() => loadConfig(dir), { name: 'UsageError', message: /fs-watch\.config\.json/ });
    });
});

test('unknown keys and wrong types are rejected with the key name', () => {
    const load = (json: string) => withDir({ 'fs-watch.config.json': json }, (dir) => loadConfig(dir));
    assert.throws(() => load('{"colour":true}'), { name: 'UsageError', message: /unknown setting "colour"/ });
    assert.throws(() => load('{"debounce":-1}'), { name: 'UsageError', message: /"debounce"/ });
    assert.throws(() => load('{"mode":"fast"}'), { name: 'UsageError', message: /one of: restart/ });
    assert.throws(() => load('{"keys":"yes"}'), { name: 'UsageError', message: /true or false/ });
    assert.throws(() => load('[1]'), { name: 'UsageError', message: /JSON object/ });
});

test('resolveOptions applies defaults', () => {
    const o = resolveOptions({ watch: ['src'], command: 'npm test' }, {});
    assert.equal(o.debounceMs, 300);
    assert.equal(o.mode, 'restart');
    assert.equal(o.killTimeoutMs, 3000);
    assert.equal(o.logLevel, 'normal');
    assert.equal(o.keys, true);
    assert.ok(o.ignore.includes('node_modules'));
});

test('CLI beats config per key, and arrays are replaced, not merged', () => {
    const o = resolveOptions(
        { debounce: 10, ext: ['ts'] },
        { watch: ['src'], command: 'npm test', debounce: 999, ext: ['js', 'css'], mode: 'queue' },
    );
    assert.equal(o.debounceMs, 10);
    assert.deepEqual(o.ext, ['ts']);
    assert.equal(o.mode, 'queue');
});

test('extensions are normalised and default ignores can be switched off', () => {
    const o = resolveOptions({ watch: ['.'], command: 'x', ext: ['.TS', 'js'], defaultIgnore: false, ignore: ['tmp'] }, {});
    assert.deepEqual(o.ext, ['ts', 'js']);
    assert.deepEqual(o.ignore, ['tmp']);
});

test('missing watch, missing command and quiet+verbose are usage errors', () => {
    assert.throws(() => resolveOptions({ command: 'x' }, {}), { name: 'UsageError', message: /Nothing to watch/ });
    assert.throws(() => resolveOptions({ watch: ['.'] }, {}), { name: 'UsageError', message: /No command/ });
    assert.throws(() => resolveOptions({ watch: ['.'], command: 'x', quiet: true, verbose: true }, {}), {
        name: 'UsageError',
        message: /cannot both/,
    });
});

test('a CLI --quiet overrides verbose from the config file', () => {
    const o = resolveOptions({ watch: ['.'], command: 'x', quiet: true, verbose: false }, { verbose: true });
    assert.equal(o.logLevel, 'quiet');
});