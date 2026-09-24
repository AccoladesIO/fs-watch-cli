import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Logger } from '../src/utils/logger';

const noop = (): void => undefined;

export const silentLogger: Logger = {
    debug: noop, info: noop, change: noop, running: noop, success: noop,
    failure: noop, warn: noop, error: noop, clear: noop,
};

export function recordingLogger(): Logger & { calls: Record<string, string[]> } {
    const calls: Record<string, string[]> = {};
    const record = (name: string) => (message: unknown): void => {
        (calls[name] ??= []).push(Array.isArray(message) ? message.join(', ') : String(message));
    };
    const logger = { calls } as Logger & { calls: Record<string, string[]> };
    for (const name of ['debug', 'info', 'change', 'running', 'success', 'failure', 'warn', 'error'] as const) {
        logger[name] = record(name);
    }
    logger.clear = noop;
    return logger;
}

export const makeTempDir = (): string => mkdtempSync(join(tmpdir(), 'fs-watch-test-'));
export const removeDir = (dir: string): void => rmSync(dir, { recursive: true, force: true });
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitFor(condition: () => boolean, timeoutMs = 4000, label = 'condition'): Promise<void> {
    const started = Date.now();
    while (!condition()) {
        if (Date.now() - started > timeoutMs) throw new Error(`Timed out waiting for ${label}`);
        await sleep(20);
    }
}