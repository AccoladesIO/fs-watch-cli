export type RunMode = 'restart' | 'queue' | 'concurrent';
export type LogLevel = 'quiet' | 'normal' | 'verbose';

export const RUN_MODES: readonly RunMode[] = ['restart', 'queue', 'concurrent'];


export interface UserSettings {
    watch?: string[];
    command?: string;
    include?: string[];
    ext?: string[];
    ignore?: string[];
    defaultIgnore?: boolean;
    debounce?: number;
    mode?: RunMode;
    killTimeout?: number;
    quiet?: boolean;
    verbose?: boolean;
    timestamps?: boolean;
    color?: boolean;
    keys?: boolean;
    fallback?: boolean;
}

export interface Options {
    watch: string[];
    command: string;
    include: string[];
    ext: string[];
    ignore: string[];
    debounceMs: number;
    mode: RunMode;
    killTimeoutMs: number;
    logLevel: LogLevel;
    timestamps: boolean;
    color: boolean;
    keys: boolean;
    fallback: boolean;
}

export type ParseResult =
    | { kind: 'help' }
    | { kind: 'version' }
    | { kind: 'run'; settings: UserSettings; configPath?: string };