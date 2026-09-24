import assert from 'node:assert/strict';
import test from 'node:test';
import { debounce } from '../src/core/debounce';
import { sleep } from './helpers';

test('a burst of calls runs the function once, after the quiet period', async () => {
    let calls = 0;
    const trigger = debounce(() => calls++, 60);
    trigger();
    trigger();
    trigger();
    await sleep(20);
    assert.equal(calls, 0);
    await sleep(150);
    assert.equal(calls, 1);
});

test('cancel() drops the pending call', async () => {
    let calls = 0;
    const trigger = debounce(() => calls++, 30);
    trigger();
    trigger.cancel();
    await sleep(120);
    assert.equal(calls, 0);
});

test('it can fire again once it has settled', async () => {
    let calls = 0;
    const trigger = debounce(() => calls++, 30);
    trigger();
    await sleep(120);
    trigger();
    await sleep(120);
    assert.equal(calls, 2);
});