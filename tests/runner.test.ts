import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import test from 'node:test';
import { CommandRunner } from '../src/core/runner';
import { RunMode } from '../src/types';
import { makeTempDir, recordingLogger, removeDir, silentLogger, sleep, waitFor } from './helpers';

const WORKER = join(__dirname, 'fixtures', 'worker.js');
const WORKER_COMMAND = `"${process.execPath}" "${WORKER}"`;
const RUN_MS = 1000;

async function trace(mode: RunMode, count: number, gapMs: number, expected: string): Promise<string> {
    const dir = makeTempDir();
    const out = join(dir, 'out.txt');
    writeFileSync(out, '');
    process.env.STYE_TEST_OUT = out;
    process.env.STYE_TEST_MS = String(RUN_MS);
    const runner = new CommandRunner({ command: WORKER_COMMAND, mode, killTimeoutMs: 1000, log: silentLogger });
    try {
        for (let i = 0; i < count; i++) {
            await runner.trigger();
            if (i < count - 1) await sleep(gapMs);
        }
        await waitFor(() => readFileSync(out, 'utf8').length >= expected.length, 8000, `trace "${expected}"`);
        await sleep(250); 
        return readFileSync(out, 'utf8');
    } finally {
        await runner.stop();
        removeDir(dir);
    }
}

test('restart mode stops the previous run: two starts, one finish', async () => {
    assert.equal(await trace('restart', 2, 500, 'ssf'), 'ssf');
});

test('concurrent mode lets earlier runs finish: two starts, two finishes', async () => {
    assert.equal(await trace('concurrent', 2, 500, 'ssff'), 'ssff');
});

test('queue mode coalesces triggers made during a run into one rerun', async () => {
    assert.equal(await trace('queue', 3, 300, 'sfsf'), 'sfsf');
});

test('stop() kills the running command and refuses later triggers', async () => {
    const dir = makeTempDir();
    const out = join(dir, 'out.txt');
    writeFileSync(out, '');
    process.env.STYE_TEST_OUT = out;
    process.env.STYE_TEST_MS = '600';
    const runner = new CommandRunner({ command: WORKER_COMMAND, mode: 'restart', killTimeoutMs: 1000, log: silentLogger });
    try {
        await runner.trigger();
        await waitFor(() => readFileSync(out, 'utf8') === 's', 5000, 'the run to start');
        await runner.stop();
        await runner.trigger();
        await sleep(900);
        assert.equal(readFileSync(out, 'utf8'), 's');
    } finally {
        removeDir(dir);
    }
});

test('reports exit codes: success and failure', async () => {
    const log = recordingLogger();
    const runner = new CommandRunner({
        command: `"${process.execPath}" -e "process.exit(3)"`,
        mode: 'concurrent',
        killTimeoutMs: 1000,
        log,
    });
    await runner.trigger();
    await waitFor(() => (log.calls.failure ?? []).length === 1, 5000, 'a failure report');
    assert.match(log.calls.failure[0], /exit code 3/);

    const ok = recordingLogger();
    const okRunner = new CommandRunner({
        command: `"${process.execPath}" -e "0"`,
        mode: 'concurrent',
        killTimeoutMs: 1000,
        log: ok,
    });
    await okRunner.trigger();
    await waitFor(() => (ok.calls.success ?? []).length === 1, 5000, 'a success report');
    assert.match(ok.calls.success[0], /exit code 0/);
});