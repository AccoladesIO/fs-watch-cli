import assert from 'node:assert/strict';
import test from 'node:test';
import { parseArgs } from '../src/cli/args';
import { UserSettings } from '../src/types';

function settingsOf(argv: string[]): UserSettings {
    const result = parseArgs(argv);
    assert.equal(result.kind, 'run');
    return result.kind === 'run' ? result.settings : {};
}

test('classic form: <path> "<command>"', () => {
    assert.deepEqual(settingsOf(['./src', 'npm run build']), { watch: ['./src'], command: 'npm run build' });
});

test('an unquoted multi-word command is joined, not truncated', () => {
    assert.deepEqual(settingsOf(['.', 'npm', 'test']), { watch: ['.'], command: 'npm test' });
});

test('options before the path are parsed, including = syntax', () => {
    const s = settingsOf(['-d', '100', '-e', 'ts,js', '--ignore', 'coverage', '--mode=queue', '.', 'x']);
    assert.equal(s.debounce, 100);
    assert.deepEqual(s.ext, ['ts', 'js']);
    assert.deepEqual(s.ignore, ['coverage']);
    assert.equal(s.mode, 'queue');
});

test('repeated --watch collects paths and every positional becomes the command', () => {
    assert.deepEqual(settingsOf(['-w', 'a', '-w', 'b', 'npm', 'test']), { watch: ['a', 'b'], command: 'npm test' });
});

test('"--" makes everything after it the command', () => {
    assert.deepEqual(settingsOf(['--', 'echo', 'hi']), { command: 'echo hi' });
});

test('a lone path leaves the command to the config file', () => {
    assert.deepEqual(settingsOf(['./src']), { watch: ['./src'] });
    assert.deepEqual(settingsOf([]), {});
});

test('brace globs survive comma splitting', () => {
    assert.deepEqual(settingsOf(['--ignore', '*.{log,tmp},cache', '.', 'x']).ignore, ['*.{log,tmp}', 'cache']);
});

test('--quiet and --verbose override each other; last one wins', () => {
    const s = settingsOf(['--verbose', '-q', '.', 'x']);
    assert.equal(s.quiet, true);
    assert.equal(s.verbose, false);
});

test('--config and boolean switches', () => {
    const result = parseArgs(['-c', 'my.json', '--no-color', '--no-keys', '--fallback', '--timestamps', '.', 'x']);
    assert.equal(result.kind === 'run' && result.configPath, 'my.json');
    assert.deepEqual(result.kind === 'run' && result.settings, {
        color: false, keys: false, fallback: true, timestamps: true, watch: ['.'], command: 'x',
    });
});

test('help and version short-circuit', () => {
    assert.equal(parseArgs(['-h']).kind, 'help');
    assert.equal(parseArgs(['--version']).kind, 'version');
});

test('bad input raises a UsageError with a useful message', () => {
    assert.throws(() => parseArgs(['--nope']), { name: 'UsageError', message: /Unknown option: --nope/ });
    assert.throws(() => parseArgs(['--debounce']), { name: 'UsageError', message: /needs a value/ });
    assert.throws(() => parseArgs(['--debounce', 'abc']), { name: 'UsageError', message: /whole number/ });
    assert.throws(() => parseArgs(['--mode', 'sideways']), { name: 'UsageError', message: /restart, queue, concurrent/ });
});