import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ErrorBoundary } from './ErrorBoundary';

const meta: Meta<typeof ErrorBoundary> = {
    title: 'Shared/UI/Structure/ErrorBoundary',
    component: ErrorBoundary,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;



export const Default: Story = {
    args: {
        children: <div>Content loaded successfully</div>,
    },
};

const ThrowError = () => {
    throw new Error("This is a test error!");
    return <div>Unreachable</div>;
}

export const WithError: Story = {
    decorators: [
        (Story) => (
            <div className="h-40 w-full border border-red-200 p-4">
                <Story />
            </div>
        )
    ],
    render: () => (
        <ErrorBoundary>
            <ThrowError />
        </ErrorBoundary>
    )
}
