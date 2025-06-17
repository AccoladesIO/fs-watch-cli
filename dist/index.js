#!/usr/bin/env node
"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
/**
 * Parses and validates the CLI arguments.
 * @returns {CLIArguments} The parsed arguments.
 * @throws Will throw an error if arguments are invalid.
 */
function parseArguments() {
    const targetLocation = process.argv[2];
    const commandToExecute = process.argv[3];
    if (!targetLocation || !commandToExecute) {
        console.log("Usage: fs-watch-cli <path-to-watch> <commandToExecute>");
        process.exit(1);
    }
    return { targetLocation, commandToExecute };
}
const args = parseArguments();
console.log(chalk_1.default.green(`Watching for changes in: ${args.targetLocation}`));
console.log(chalk_1.default.yellow(`Command to run on change: ${args.commandToExecute}`));
(0, fs_1.watch)(args.targetLocation, { recursive: true, encoding: 'utf8' }, (_eventType, filename) => {
    if (filename) {
        console.log(chalk_1.default.green(`[Change detected]: ${filename}`));
        console.log(chalk_1.default.yellow(`[Running]: ${args.commandToExecute}`));
        (0, child_process_1.exec)(args.commandToExecute, (err, stdout, stderr) => {
            if (err) {
                console.error(chalk_1.default.red(`[Error]: ${err.message}`));
                return;
            }
            console.log(chalk_1.default.green(`[Output]: ${stdout}`));
            if (stderr && stderr.trim()) {
                console.error(chalk_1.default.red(`[Error Output]: ${stderr.trim()}`));
            }
            console.log(chalk_1.default.green(`[Done]`));
        });
    }
})
    .on('error', (err) => {
    console.error(chalk_1.default.red(`Error watching file: ${err.message}`));
    process.exit(1);
});
process.stdin.resume();
process.on('SIGINT', () => {
    console.log(chalk_1.default.blue('\nStopping file watcher...'));
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log(chalk_1.default.blue('\nStopping file watcher...'));
    process.exit(0);
});
process.on('uncaughtException', (err) => {
    console.error(chalk_1.default.red(`Uncaught Exception: ${err.message}`));
    process.exit(1);
});
