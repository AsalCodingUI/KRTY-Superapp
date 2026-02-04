"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import type { RecurrencePattern } from '../types';

interface RecurrenceSelectorProps {
    value?: RecurrencePattern | null;
    onChange: (pattern: RecurrencePattern | null) => void;
    eventStart?: Date;
}

export function RecurrenceSelector({ value, onChange, eventStart }: RecurrenceSelectorProps) {
    const today = eventStart || new Date();
    const dayName = today.toLocaleDateString('id-ID', { weekday: 'long' });
    const dayOfMonth = today.getDate();

    const handleChange = (val: string) => {
        if (val === 'none') {
            onChange(null);
            return;
        }

        const patterns: Record<string, RecurrencePattern> = {
            daily: {
                frequency: 'DAILY',
                interval: 1,
            },
            weekly: {
                frequency: 'WEEKLY',
                interval: 1,
                byWeekDay: [today.getDay()],
            },
            monthly: {
                frequency: 'MONTHLY',
                interval: 1,
                byMonthDay: dayOfMonth,
            },
            yearly: {
                frequency: 'YEARLY',
                interval: 1,
            },
        };

        onChange(patterns[val]);
    };

    const getCurrentValue = () => {
        if (!value) return 'none';

        if (value.frequency === 'DAILY' && value.interval === 1) return 'daily';
        if (value.frequency === 'WEEKLY' && value.interval === 1) return 'weekly';
        if (value.frequency === 'MONTHLY' && value.interval === 1) return 'monthly';
        if (value.frequency === 'YEARLY' && value.interval === 1) return 'yearly';

        return 'custom';
    };

    return (
        <Select value={getCurrentValue()} onValueChange={handleChange}>
            <SelectTrigger>
                <SelectValue placeholder="Does not repeat" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly on {dayName}</SelectItem>
                <SelectItem value="monthly">Monthly on day {dayOfMonth}</SelectItem>
                <SelectItem value="yearly">Annually</SelectItem>
                {value && getCurrentValue() === 'custom' && (
                    <SelectItem value="custom">Custom</SelectItem>
                )}
            </SelectContent>
        </Select>
    );
}
