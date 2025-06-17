#!/usr/bin/env node
/**
 * @fileoverview A CLI tool for watching file system changes and executing a specified command upon changes.
 * 
 * This script uses Node.js `fs.watch` to monitor changes in a specified directory or file path.
 * When a change is detected, it executes a user-provided command using the `child_process.exec` method.
 * 
 * Features:
 * - Recursive file watching.
 * - Customizable command execution on file changes.
 * - Graceful handling of process termination signals (SIGINT, SIGTERM).
 * - Error handling for uncaught exceptions and file watching errors.
 * 
 * Usage:
 * ```
 * fs-watch-cli <path-to-watch> <commandToExecute>
 * ```
 * 
 * Example:
 * ```
 * fs-watch-cli ./src "npm run build"
 * ```
 * 
 * Dependencies:
 * - `fs` for file system watching.
 * - `child_process` for executing commands.
 * - `chalk` for colored console output.
 * 
 * @module fs-watch-cli
 */

import { watch } from 'fs';
import { exec } from 'child_process';
import chalk from 'chalk';

/**
 * Represents the CLI arguments passed to the program.
 */
interface CLIArguments {
    targetLocation: string;
    commandToExecute: string;
}

/**
 * Parses and validates the CLI arguments.
 * @returns {CLIArguments} The parsed arguments.
 * @throws Will throw an error if arguments are invalid.
 */
function parseArguments(): CLIArguments {
    const targetLocation = process.argv[2];
    const commandToExecute = process.argv[3];

    if (!targetLocation || !commandToExecute) {
        console.log("Usage: fs-watch-cli <path-to-watch> <commandToExecute>");
        process.exit(1);
    }

    return { targetLocation, commandToExecute };
}

const args: CLIArguments = parseArguments();

console.log(chalk.green(`Watching for changes in: ${args.targetLocation}`));
console.log(chalk.yellow(`Command to run on change: ${args.commandToExecute}`));

watch(args.targetLocation, { recursive: true, encoding: 'utf8' }, (_eventType: string, filename: string | null) => {
    if (filename) {
        console.log(chalk.green(`[Change detected]: ${filename}`));
        console.log(chalk.yellow(`[Running]: ${args.commandToExecute}`));
        exec(args.commandToExecute, (err: Error | null, stdout: string, stderr: string) => {
            if (err) {
                console.error(chalk.red(`[Error]: ${err.message}`));
                return;
            }
            console.log(chalk.green(`[Output]: ${stdout}`));
            if (stderr && stderr.trim()) {
                console.error(chalk.red(`[Error Output]: ${stderr.trim()}`));
            }
            console.log(chalk.green(`[Done]`));
        });
    }
})
    .on('error', (err: Error) => {
        console.error(chalk.red(`Error watching file: ${err.message}`));
        process.exit(1);
    });

process.stdin.resume();
process.on('SIGINT', () => {
    console.log(chalk.blue('\nStopping file watcher...'));
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log(chalk.blue('\nStopping file watcher...'));
    process.exit(0);
});
process.on('uncaughtException', (err: Error) => {
    console.error(chalk.red(`Uncaught Exception: ${err.message}`));
    process.exit(1);
});