import chalk from 'chalk';
import { LogLevel } from '../types';

export interface Logger {
    debug(message: string): void;
    info(message: string): void;
    change(files: string[]): void;
    running(command: string): void;
    success(message: string): void;
    failure(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    clear(): void;
}

export interface LoggerOptions {
    level: LogLevel;
    timestamps: boolean;
    color: boolean;
}

const MAX_FILES_SHOWN = 3;

function summarise(files: string[]): string {
    const shown = files.slice(0, MAX_FILES_SHOWN).join(', ');
    const extra = files.length - MAX_FILES_SHOWN;
    return extra > 0 ? `${shown} (+${extra} more)` : shown;
}

export function createLogger({ level, timestamps, color }: LoggerOptions): Logger {
    const paint = new chalk.Instance({ level: color && !process.env.NO_COLOR ? chalk.level : 0 });
    const stamp = (): string => (timestamps ? paint.gray(`[${new Date().toTimeString().slice(0, 8)}] `) : '');
    const out = (text: string): void => console.log(stamp() + text);
    const err = (text: string): void => console.error(stamp() + text);
    const chatty = level !== 'quiet';

    return {
        debug: (message) => { if (level === 'verbose') out(paint.gray(`[debug] ${message}`)); },
        info: (message) => { if (chatty) out(paint.blue(message)); },
        change: (files) => { if (chatty) out(paint.green(`[Change detected]: ${summarise(files)}`)); },
        running: (command) => { if (chatty) out(paint.yellow(`[Running]: ${command}`)); },
        success: (message) => { if (chatty) out(paint.green(`[Done]: ${message}`)); },
        failure: (message) => err(paint.red(`[Failed]: ${message}`)),
        warn: (message) => { if (chatty) err(paint.yellow(`[Warning]: ${message}`)); },
        error: (message) => err(paint.red(`[Error]: ${message}`)),
        clear: () => { if (process.stdout.isTTY) process.stdout.write('\x1B[2J\x1B[3J\x1B[H'); },
    };
}