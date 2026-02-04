"use client";

import { cx } from '@/shared/lib/utils';
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import { eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, isToday, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { useCalendarContext } from './calendar-context';
import { getWeekEnd, getWeekStart } from './utils';

export function MiniCalendar() {
    const { currentDate, setCurrentDate, setSelectedDate } = useCalendarContext();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const viewStart = getWeekStart(monthStart);
    const viewEnd = getWeekEnd(monthEnd);

    const days = eachDayOfInterval({ start: viewStart, end: viewEnd });

    const goToPreviousMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const handleDayClick = (day: Date) => {
        setCurrentDate(day);
        setSelectedDate(day);
    };

    return (
        <div className="">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-content">
                    {format(currentDate, 'MMMM yyyy', { locale: id })}
                </h3>
                <div className="flex items-center gap-1">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-1 hover:bg-muted rounded transition-colors"
                    >
                        <RiArrowLeftSLine className="w-4 h-4" />
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="p-1 hover:bg-muted rounded transition-colors"
                    >
                        <RiArrowRightSLine className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-content-muted py-1"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    const isSelected = isSameDay(day, currentDate);

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => handleDayClick(day)}
                            className={cx(
                                'aspect-square flex items-center justify-center text-xs rounded-md transition-colors',
                                !isCurrentMonth && 'text-content-muted',
                                isCurrentMonth && !isTodayDate && !isSelected && 'hover:bg-muted',
                                isTodayDate && !isSelected && 'bg-surface-brand text-primary-fg font-semibold',
                                isSelected && !isTodayDate && 'bg-accent font-medium',
                                isSelected && isTodayDate && 'bg-surface-brand text-primary-fg font-semibold'
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
