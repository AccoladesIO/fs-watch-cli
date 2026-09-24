import assert from 'node:assert/strict';
import test from 'node:test';
import { createPathFilter, DEFAULT_IGNORES } from '../src/core/ignore';

const filter = (over: Partial<Parameters<typeof createPathFilter>[0]> = {}) =>
    createPathFilter({ include: [], ignore: [], ext: [], ...over });

test('a plain name ignores that folder at any depth, but not look-alikes', () => {
    const f = filter({ ignore: ['node_modules'] });
    assert.equal(f.accepts('node_modules/x.js'), false);
    assert.equal(f.accepts('a/node_modules/x.js'), false);
    assert.equal(f.accepts('node_modules_backup/x.js'), true);
});

test('a wildcard without a slash matches any path segment', () => {
    const f = filter({ ignore: ['*.log'] });
    assert.equal(f.accepts('a/b/app.log'), false);
    assert.equal(f.accepts('a/b/app.txt'), true);
});

test('a pattern with a slash is anchored to the watch root and covers children', () => {
    const f = filter({ ignore: ['src/generated'] });
    assert.equal(f.isIgnored('src/generated'), true);
    assert.equal(f.accepts('src/generated/a.ts'), false);
    assert.equal(f.accepts('lib/src/generated/a.ts'), true);
});

test('anchored globs use ** across folders', () => {
    const f = filter({ ignore: ['src/**/*.tmp'] });
    assert.equal(f.accepts('src/a.tmp'), false);
    assert.equal(f.accepts('src/x/y.tmp'), false);
    assert.equal(f.accepts('src/x/y.ts'), true);
});

test('include restricts what triggers a run', () => {
    const f = filter({ include: ['src/**/*.ts'] });
    assert.equal(f.accepts('src/a/b.ts'), true);
    assert.equal(f.accepts('lib/b.ts'), false);
});

test('ext is case-insensitive and rejects extensionless paths', () => {
    const f = filter({ ext: ['ts'] });
    assert.equal(f.accepts('A.TS'), true);
    assert.equal(f.accepts('a.js'), false);
    assert.equal(f.accepts('Makefile'), false);
});

test('ignore wins over include', () => {
    const f = filter({ include: ['*.ts'], ignore: ['legacy'] });
    assert.equal(f.accepts('legacy/old.ts'), false);
});

test('Windows-style separators are normalised', () => {
    const f = filter({ ignore: ['src/generated'] });
    assert.equal(f.accepts('src\\generated\\a.ts'), false);
});

test('default ignores cover dependencies, build output and editor scratch files', () => {
    const f = filter({ ignore: DEFAULT_IGNORES });
    for (const path of ['.git/HEAD', 'dist/index.js', 'node_modules/x/y.js', 'notes.swp', 'draft.txt~', '.DS_Store']) {
        assert.equal(f.accepts(path), false, path);
    }
    assert.equal(f.accepts('src/index.ts'), true);
});