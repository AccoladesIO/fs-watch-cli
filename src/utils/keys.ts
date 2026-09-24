export interface KeyHandlers {
    rerun(): void;
    clear(): void;
    quit(): void;
}


export function enableKeys(handlers: KeyHandlers): () => void {
    const stdin = process.stdin;
    if (!stdin.isTTY) return () => undefined;

    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();

    const onData = (key: string): void => {
        switch (key) {
            case 'r':
            case 'R':
                handlers.rerun();
                break;
            case 'c':
            case 'C':
                handlers.clear();
                break;
            case 'q':
            case 'Q':
            case '\u0003':
                handlers.quit();
                break;
            default:
                break;
        }
    };
    stdin.on('data', onData);

    return () => {
        stdin.off('data', onData);
        stdin.setRawMode(false);
        stdin.pause();
    };
}