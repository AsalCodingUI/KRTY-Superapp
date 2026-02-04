"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { CalendarContextValue, ViewMode } from './types';
import { getNextPeriod, getPreviousPeriod } from './utils';

const CalendarContext = createContext<CalendarContextValue | undefined>(undefined);

interface CalendarProviderProps {
    children: ReactNode;
    initialDate?: Date;
    initialView?: ViewMode;
}

export function CalendarProvider({
    children,
    initialDate = new Date(),
    initialView = 'week',
}: CalendarProviderProps) {
    const [currentDate, setCurrentDate] = useState<Date>(initialDate);
    const [viewMode, setViewMode] = useState<ViewMode>(initialView);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const goToToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const goToNext = useCallback(() => {
        setCurrentDate((prev) => getNextPeriod(prev, viewMode));
    }, [viewMode]);

    const goToPrevious = useCallback(() => {
        setCurrentDate((prev) => getPreviousPeriod(prev, viewMode));
    }, [viewMode]);

    const value: CalendarContextValue = {
        currentDate,
        setCurrentDate,
        viewMode,
        setViewMode,
        selectedDate,
        setSelectedDate,
        goToToday,
        goToNext,
        goToPrevious,
    };

    return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarContext() {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendarContext must be used within CalendarProvider');
    }
    return context;
}
