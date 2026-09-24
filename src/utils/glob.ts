import { UsageError } from "./errors";

export function globToRegExp(glob: string): RegExp {
    let source = '';
    let braceDepth = 0;

    for (let i = 0; i < glob.length; i++) {
        const char = glob[i];
        switch (char) {
            case '*':
                if (glob[i + 1] === '*') {
                    i++;
                    if (glob[i + 1] === '/') {
                        i++;
                        source += '(?:.*/)?'; 
                    } else {
                        source += '.*';
                    }
                } else {
                    source += '[^/]*';
                }
                break;
            case '?':
                source += '[^/]';
                break;
            case '[': {
                const end = glob.indexOf(']', i + 2);
                if (end === -1) {
                    source += '\\[';
                } else {
                    let body = glob.slice(i + 1, end).replace(/\\/g, '\\\\');
                    if (body.startsWith('!')) body = `^${body.slice(1)}`;
                    source += `[${body}]`;
                    i = end;
                }
                break;
            }
            case '{':
                braceDepth++;
                source += '(?:';
                break;
            case '}':
                if (braceDepth > 0) {
                    braceDepth--;
                    source += ')';
                } else {
                    source += '\\}';
                }
                break;
            case ',':
                source += braceDepth > 0 ? '|' : ',';
                break;
            default:
                source += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }

    try {
        return new RegExp(`^${source}$`);
    } catch {
        throw new UsageError(`Invalid pattern: "${glob}"`);
    }
}

export function compileGlob(glob: string): (path: string) => boolean {
    const regex = globToRegExp(glob);
    return (path) => regex.test(path);
}

export function splitPatterns(value: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let current = '';
    for (const char of value) {
        if (char === '{') depth++;
        if (char === '}' && depth > 0) depth--;
        if (char === ',' && depth === 0) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);
    return parts.map((part) => part.trim()).filter(Boolean);
}