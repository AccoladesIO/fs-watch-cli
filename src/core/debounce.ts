export interface Debounced {
    (): void;
    cancel(): void;
}

export function debounce(fn: () => void, waitMs: number): Debounced {
    let timer: NodeJS.Timeout | undefined;

    const debounced = (() => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            timer = undefined;
            fn();
        }, waitMs);
    }) as Debounced;

    debounced.cancel = () => {
        if (timer) clearTimeout(timer);
        timer = undefined;
    };

    return debounced;
}