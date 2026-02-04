import { SingleDatePicker } from '@/shared/ui/input/DatePicker';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

const meta = {
    title: 'Input/DatePicker',
    component: SingleDatePicker,
    tags: ['autodocs'],
} satisfies Meta<typeof SingleDatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: () => {
        const [date, setDate] = useState<Date | undefined>(new Date());
        return (
            <SingleDatePicker
                value={date}
                onChange={setDate}
            />
        )
    }
};

export const WithTime: Story = {
    render: () => {
        const [date, setDate] = useState<Date | undefined>(new Date());
        return (
            <SingleDatePicker
                showTimePicker
                value={date}
                onChange={setDate}
            />
        )
    }
};

export const WithPresets: Story = {
    render: () => {
        const [date, setDate] = useState<Date | undefined>(new Date());
        return (
            <SingleDatePicker
                value={date}
                onChange={setDate}
                presets={[
                    {
                        label: 'Tomorrow',
                        date: new Date(new Date().setDate(new Date().getDate() + 1))
                    },
                    {
                        label: 'Next Week',
                        date: new Date(new Date().setDate(new Date().getDate() + 7))
                    }
                ]}
            />
        )
    }
};
