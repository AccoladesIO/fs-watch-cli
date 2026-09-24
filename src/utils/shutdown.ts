import { Logger } from './logger';

export function registerShutdown(
    cleanup: () => Promise<void> | void,
    log: Logger,
): (exitCode: number) => Promise<void> {
    let shuttingDown = false;

    const shutdown = async (exitCode: number): Promise<void> => {
        if (shuttingDown) {
            process.exit(exitCode); 
        }
        shuttingDown = true;
        try {
            await cleanup();
        } catch (err) {
            log.error(`Cleanup failed: ${(err as Error).message}`);
        }
        process.exit(exitCode);
    };

    const onSignal = (): void => {
        if (process.stdout.isTTY) process.stdout.write('\n'); 
        log.info('Stopping file watcher...');
        void shutdown(0);
    };
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);

    process.on('uncaughtException', (err: Error) => {
        log.error(`Uncaught exception: ${err.stack ?? err.message}`);
        void shutdown(1);
    });
    process.on('unhandledRejection', (reason: unknown) => {
        log.error(`Unhandled rejection: ${reason instanceof Error ? reason.stack : String(reason)}`);
        void shutdown(1);
    });

    return shutdown;
}