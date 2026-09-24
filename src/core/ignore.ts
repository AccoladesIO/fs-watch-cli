import { extname } from 'path';
import { compileGlob } from '../utils/glob';

export const DEFAULT_IGNORES = ['node_modules', '.git', 'dist', '.DS_Store', '*.swp', '*~'];

export interface PathFilterConfig {
    include: string[];
    ignore: string[];
    ext: string[];
}

export interface PathFilter {
    isIgnored(relativePath: string): boolean;
    accepts(relativePath: string): boolean;
}

function normalise(value: string): string {
    return value.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/\/+$/, '');
}

export function createPatternMatcher(patterns: string[]): (relativePath: string) => boolean {
    const compiled = patterns
        .map(normalise)
        .filter(Boolean)
        .map((pattern) => ({ anchored: pattern.includes('/'), test: compileGlob(pattern) }));

    return (relativePath) => {
        const segments = normalise(relativePath).split('/');
        return compiled.some(({ anchored, test }) =>
            anchored
                ? segments.some((_, i) => test(segments.slice(0, i + 1).join('/')))
                : segments.some(test),
        );
    };
}

export function createPathFilter(config: PathFilterConfig): PathFilter {
    const ignored = createPatternMatcher(config.ignore);
    const included = config.include.length > 0 ? createPatternMatcher(config.include) : () => true;
    const extensions = new Set(config.ext);

    return {
        isIgnored: ignored,
        accepts: (relativePath) => {
            if (ignored(relativePath)) return false;
            if (!included(relativePath)) return false;
            if (extensions.size > 0 && !extensions.has(extname(relativePath).slice(1).toLowerCase())) return false;
            return true;
        },
    };
}