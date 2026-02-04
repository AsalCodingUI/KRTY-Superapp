"use client";

import { cx } from '@/shared/lib/utils';

interface RSVPButtonsProps {
    value?: 'yes' | 'no' | 'maybe';
    onChange: (value: 'yes' | 'no' | 'maybe') => void;
    disabled?: boolean;
}

export function RSVPButtons({ value, onChange, disabled = false }: RSVPButtonsProps) {
    return (
        <div className="space-y-2">
            <h4 className="text-sm font-semibold text-content">Going?</h4>
            <div className="flex gap-2">
                <button
                    onClick={() => onChange('yes')}
                    disabled={disabled}
                    className={cx(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        "border disabled:opacity-50 disabled:cursor-not-allowed",
                        value === 'yes'
                            ? "bg-surface-brand text-primary-fg border-primary"
                            : "bg-surface text-content border-border-border hover:bg-muted"
                    )}
                >
                    Yes
                </button>
                <button
                    onClick={() => onChange('no')}
                    disabled={disabled}
                    className={cx(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        "border disabled:opacity-50 disabled:cursor-not-allowed",
                        value === 'no'
                            ? "bg-surface text-content border-border-border ring-2 ring-border"
                            : "bg-surface text-content border-border-border hover:bg-muted"
                    )}
                >
                    No
                </button>
                <button
                    onClick={() => onChange('maybe')}
                    disabled={disabled}
                    className={cx(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        "border disabled:opacity-50 disabled:cursor-not-allowed",
                        value === 'maybe'
                            ? "bg-surface text-content border-border-border ring-2 ring-border"
                            : "bg-surface text-content border-border-border hover:bg-muted"
                    )}
                >
                    Maybe
                </button>
            </div>
        </div>
    );
}
