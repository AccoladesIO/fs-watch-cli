import assert from 'node:assert/strict';
import test from 'node:test';
import { globToRegExp, splitPatterns } from '../src/utils/glob';

const cases: Array<[glob: string, path: string, expected: boolean]> = [
    ['*.ts', 'a.ts', true],
    ['*.ts', 'a/b.ts', false],
    ['**/*.ts', 'a/b/c.ts', true],
    ['**/*.ts', 'c.ts', true],
    ['src/**', 'src/a/b', true],
    ['a?c', 'abc', true],
    ['a?c', 'a/c', false],
    ['[abc].js', 'b.js', true],
    ['[!abc].js', 'd.js', true],
    ['[!abc].js', 'a.js', false],
    ['*.{js,ts}', 'x.ts', true],
    ['*.{js,ts}', 'x.css', false],
    ['file.name', 'fileXname', false],
    ['a+b', 'a+b', true],
];

for (const [glob, path, expected] of cases) {
    test(`glob "${glob}" ${expected ? 'matches' : 'does not match'} "${path}"`, () => {
        assert.equal(globToRegExp(glob).test(path), expected);
    });
}

test('splitPatterns splits on top-level commas only', () => {
    assert.deepEqual(splitPatterns('a,b,{c,d}'), ['a', 'b', '{c,d}']);
    assert.deepEqual(splitPatterns(' a , ,b '), ['a', 'b']);
});

test('a malformed pattern raises a UsageError', () => {
    assert.throws(() => globToRegExp('{a'), { name: 'UsageError', message: /Invalid pattern/ });
});