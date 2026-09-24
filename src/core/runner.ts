import { ChildProcess, spawn } from 'child_process';
import { RunMode } from '../types';
import { Logger } from '../utils/logger';

const IS_WINDOWS = process.platform === 'win32';

export interface RunnerOptions {
    command: string;
    mode: RunMode;
    killTimeoutMs: number;
    log: Logger;
}

function formatDuration(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function killTree(pid: number, signal: NodeJS.Signals): void {
    try {
        if (IS_WINDOWS) {
            spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' }).on('error', () => undefined);
        } else {
            process.kill(-pid, signal);
        }
    } catch(err){
        if ((err as NodeJS.ErrnoException).code !== 'ESRCH') throw err;
    }
}

/**
 * Runs the user's command according to the configured mode:
 *  - restart:    stop the previous run, then start a new one (default; ideal for servers)
 *  - queue:      let the current run finish, then run once more if anything changed meanwhile
 *  - concurrent: start a new run immediately, leaving earlier ones alone
 */
export class CommandRunner {
    private readonly children = new Set<ChildProcess>();
    private readonly stoppedByUs = new WeakSet<ChildProcess>();
    private rerunPending = false;
    private stopped = false;
    private queue: Promise<void> = Promise.resolve();

    constructor(private readonly options: RunnerOptions) { }

    trigger(): Promise<void> {
        if (this.stopped) return Promise.resolve();
        const { mode, log } = this.options;

        if (mode === 'concurrent') {
            this.launch();
            return Promise.resolve();
        }

        if (mode === 'queue') {
            if (this.children.size > 0) {
                this.rerunPending = true;
                log.info('Run in progress - will run again once it finishes.');
            } else {
                this.launch();
            }
            return Promise.resolve();
        }

        return this.enqueue(async () => {
            if (this.children.size > 0) log.info('Previous run still active - restarting.');
            await this.terminateAll();
            if (!this.stopped) this.launch();
        });
    }

    stop(): Promise<void> {
        this.stopped = true;
        this.rerunPending = false;
        return this.enqueue(() => this.terminateAll());
    }

    private enqueue(step: () => Promise<void>): Promise<void> {
        this.queue = this.queue.then(step).catch((err: Error) => this.options.log.error(err.message));
        return this.queue;
    }

    private launch(): void {
        const { command, log } = this.options;
        const started = Date.now();
        log.running(command);

        const child = spawn(command, {
            shell: true,
            stdio: ['ignore', 'inherit', 'inherit'],
            detached: !IS_WINDOWS, 
        });
        this.children.add(child);
        log.debug(`Started pid ${child.pid ?? '?'}`);

        child.once('error', (err) => {
            log.error(`Could not start command: ${err.message}`);
            this.settle(child);
        });

        child.once('exit', (code, signal) => {
            const stopped = this.stoppedByUs.has(child);
            if (!stopped) {
                const took = formatDuration(Date.now() - started);
                if (code === 0) log.success(`exit code 0 in ${took}`);
                else log.failure(signal ? `killed by ${signal} after ${took}` : `exit code ${code} in ${took}`);
            }
            this.settle(child);
        });
    }

    private settle(child: ChildProcess): void {
        this.children.delete(child);
        if (this.rerunPending && this.children.size === 0 && !this.stopped) {
            this.rerunPending = false;
            this.launch();
        }
    }

    private terminateAll(): Promise<void> {
        return Promise.all([...this.children].map((child) => this.terminate(child))).then(() => undefined);
    }

    private terminate(child: ChildProcess): Promise<void> {
        const pid = child.pid;
        if (pid === undefined) return Promise.resolve();
        const { killTimeoutMs, log } = this.options;

        return new Promise((resolve) => {
            this.stoppedByUs.add(child);
            const force = setTimeout(() => {
                log.warn(`pid ${pid} ignored SIGTERM for ${killTimeoutMs}ms - sending SIGKILL.`);
                killTree(pid, 'SIGKILL');
            }, killTimeoutMs);
            child.once('exit', () => {
                clearTimeout(force);
                resolve();
            });
            log.debug(`Sending SIGTERM to pid ${pid}`);
            killTree(pid, 'SIGTERM');
        });
    }
}