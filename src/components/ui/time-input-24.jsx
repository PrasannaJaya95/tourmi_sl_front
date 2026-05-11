import { forwardRef, useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Locale-independent **24-hour** time input.
 *
 * Drop-in replacement for `<Input type="time" />`. Native HTML5 time inputs
 * respect the browser's locale (Chrome on `en-US` shows 12h with AM/PM, on
 * `en-GB` shows 24h). We render our own text field so customers always see
 * `HH:MM` regardless of where they are.
 *
 * Value contract is identical to the native input: `HH:MM` 24-hour string
 * (e.g. `"21:23"`) or empty string. Calls `onChange({ target: { value } })`
 * so existing form handlers keep working unchanged.
 */

const pad = (n) => String(n).padStart(2, '0');

/** Coerce freeform user input toward `HH:MM`. Doesn't insist on validity — caller validates on blur. */
function normalizeTyping(raw) {
    let s = String(raw ?? '').replace(/[^\d:]/g, '');
    // Auto-insert colon when user types 4 digits without one (e.g. "1230" -> "12:30")
    if (!s.includes(':') && s.length >= 3) {
        s = s.slice(0, -2) + ':' + s.slice(-2);
    }
    if (s.length > 5) s = s.slice(0, 5);
    return s;
}

/** Clamp anything close to a time to a valid `HH:MM` (24h). Returns `''` if hopeless. */
function clampToValid(raw) {
    const s = String(raw ?? '');
    if (!s) return '';
    const m = s.match(/^(\d{1,2})[:](\d{1,2})$/);
    if (!m) return '';
    const hh = Math.min(23, Math.max(0, Number(m[1]) || 0));
    const mm = Math.min(59, Math.max(0, Number(m[2]) || 0));
    return `${pad(hh)}:${pad(mm)}`;
}

export const TimeInput24 = forwardRef(function TimeInput24(
    { value = '', onChange, disabled, className, id, ...rest },
    ref
) {
    const [draft, setDraft] = useState(value || '');

    useEffect(() => {
        setDraft(value || '');
    }, [value]);

    const commit = (raw) => {
        const cleaned = clampToValid(normalizeTyping(raw));
        if (cleaned !== (value || '')) {
            onChange?.({ target: { value: cleaned } });
        }
        setDraft(cleaned);
    };

    return (
        <div className="flex items-center gap-1">
            <Input
                ref={ref}
                id={id}
                type="text"
                inputMode="numeric"
                placeholder="HH:MM"
                maxLength={5}
                value={draft}
                disabled={disabled}
                onChange={(e) => setDraft(normalizeTyping(e.target.value))}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        commit(e.currentTarget.value);
                    }
                }}
                className={cn('font-mono tabular-nums', className)}
                {...rest}
            />
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={disabled}
                        className="shrink-0"
                        aria-label="Pick time"
                    >
                        <Clock className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                    <TimePickerGrid value={value} onPick={commit} />
                </PopoverContent>
            </Popover>
        </div>
    );
});

function TimePickerGrid({ value, onPick }) {
    const m = String(value || '').match(/^(\d{1,2}):(\d{1,2})$/);
    const currentH = m ? Math.min(23, Number(m[1])) : 0;
    const currentM = m ? Math.min(59, Number(m[2])) : 0;

    return (
        <div className="grid grid-cols-2 gap-2 w-44">
            <Column label="Hour">
                {Array.from({ length: 24 }, (_, h) => (
                    <button
                        key={h}
                        type="button"
                        className={cn(
                            'block w-full px-2 py-1 text-sm font-mono tabular-nums rounded transition-colors hover:bg-accent',
                            h === currentH && 'bg-primary text-primary-foreground font-bold hover:bg-primary'
                        )}
                        onClick={() => onPick(`${pad(h)}:${pad(currentM)}`)}
                    >
                        {pad(h)}
                    </button>
                ))}
            </Column>
            <Column label="Min">
                {Array.from({ length: 60 }, (_, mm) => (
                    <button
                        key={mm}
                        type="button"
                        className={cn(
                            'block w-full px-2 py-1 text-sm font-mono tabular-nums rounded transition-colors hover:bg-accent',
                            mm === currentM && 'bg-primary text-primary-foreground font-bold hover:bg-primary'
                        )}
                        onClick={() => onPick(`${pad(currentH)}:${pad(mm)}`)}
                    >
                        {pad(mm)}
                    </button>
                ))}
            </Column>
        </div>
    );
}

function Column({ label, children }) {
    return (
        <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center mb-1.5">
                {label}
            </div>
            <div className="h-48 overflow-y-auto rounded-md border border-border bg-secondary/20 p-1">
                {children}
            </div>
        </div>
    );
}

export default TimeInput24;
