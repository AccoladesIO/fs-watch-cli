#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * stye entry point. Contains no logic of its own: it only wires the
 * argument parser, config loader, watchers, debouncer and command runner together.
 */
const args_1 = require("./cli/args");
const config_1 = require("./cli/config");
const help_1 = require("./cli/help");
const debounce_1 = require("./core/debounce");
const ignore_1 = require("./core/ignore");
const runner_1 = require("./core/runner");
const watcher_1 = require("./core/watcher");
const errors_1 = require("./utils/errors");
const keys_1 = require("./utils/keys");
const logger_1 = require("./utils/logger");
const shutdown_1 = require("./utils/shutdown");
function start(options) {
    const log = (0, logger_1.createLogger)({ level: options.logLevel, timestamps: options.timestamps, color: options.color });
    const runner = new runner_1.CommandRunner({
        command: options.command,
        mode: options.mode,
        killTimeoutMs: options.killTimeoutMs,
        log,
    });
    const pendingFiles = new Set();
    const trigger = (0, debounce_1.debounce)(() => {
        log.change([...pendingFiles]);
        pendingFiles.clear();
        void runner.trigger();
    }, options.debounceMs);
    let watcher;
    let restoreTerminal = () => undefined;
    const shutdown = (0, shutdown_1.registerShutdown)(async () => {
        trigger.cancel();
        restoreTerminal();
        watcher?.close();
        await runner.stop();
    }, log);
    watcher = (0, watcher_1.startWatchers)({
        targets: options.watch,
        filter: (0, ignore_1.createPathFilter)({ include: options.include, ignore: options.ignore, ext: options.ext }),
        log,
        forceFallback: options.fallback,
        onChange: (file) => {
            pendingFiles.add(file);
            trigger();
        },
        onError: (err) => {
            log.error(`Watcher error: ${err.message}`);
            void shutdown(1);
        },
    });
    log.info(`Watching for changes in: ${options.watch.join(', ')}`);
    log.info(`Command to run on change: ${options.command} (${options.mode} mode)`);
    if (options.keys) {
        restoreTerminal = (0, keys_1.enableKeys)({
            rerun: () => {
                trigger.cancel();
                pendingFiles.clear();
                log.info('Manual rerun.');
                void runner.trigger();
            },
            clear: () => log.clear(),
            quit: () => void shutdown(0),
        });
        if (process.stdin.isTTY)
            log.info('Keys: r = rerun, c = clear, q = quit.');
    }
}
function main() {
    const bootLog = (0, logger_1.createLogger)({ level: 'normal', timestamps: false, color: true });
    try {
        const parsed = (0, args_1.parseArgs)(process.argv.slice(2));
        if (parsed.kind === 'help')
            return console.log(help_1.HELP_TEXT);
        if (parsed.kind === 'version')
            return console.log((0, help_1.readVersion)());
        const config = (0, config_1.loadConfig)(process.cwd(), parsed.configPath);
        start((0, config_1.resolveOptions)(parsed.settings, config));
    }
    catch (err) {
        if (!(err instanceof errors_1.UsageError))
            throw err;
        bootLog.error(err?.message);
        console.error('Run "stye --help" for usage.');
        process.exitCode = 2;
    }
}
main();
