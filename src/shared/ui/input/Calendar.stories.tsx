import { Calendar } from '@/shared/ui/input/Calendar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

const meta = {
    title: 'Input/Calendar',
    component: Calendar,
    tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => {
        const [date, setDate] = useState<Date | undefined>(new Date());
        return (
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
            />
        )
    }
};

export const MultiMonth: Story = {
    render: () => {
        const [date, setDate] = useState<Date | undefined>(new Date());
        return (
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                numberOfMonths={2}
            />
        )
    }
};
