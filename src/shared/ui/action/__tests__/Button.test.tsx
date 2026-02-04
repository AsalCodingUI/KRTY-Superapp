import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../Button'

describe('Button', () => {
    describe('Rendering', () => {
        it('renders children correctly', () => {
            render(<Button>Click me</Button>)
            expect(screen.getByText('Click me')).toBeInTheDocument()
        })

        it('renders with custom className', () => {
            render(<Button className="custom-class">Button</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('custom-class')
        })
    })

    describe('Variants', () => {
        it('renders primary variant', () => {
            render(<Button variant="primary">Primary</Button>)
            const button = screen.getByText('Primary')
            expect(button).toBeInTheDocument()
        })

        it('renders secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>)
            const button = screen.getByText('Secondary')
            expect(button).toBeInTheDocument()
        })

        it('renders destructive variant', () => {
            render(<Button variant="destructive">Delete</Button>)
            const button = screen.getByText('Delete')
            expect(button).toBeInTheDocument()
        })
    })

    describe('Sizes', () => {
        it('renders default size', () => {
            render(<Button size="default">Default</Button>)
            expect(screen.getByText('Default')).toBeInTheDocument()
        })

        it('renders small size', () => {
            render(<Button size="sm">Small</Button>)
            expect(screen.getByText('Small')).toBeInTheDocument()
        })

        it('renders extra small size', () => {
            render(<Button size="xs">Extra Small</Button>)
            expect(screen.getByText('Extra Small')).toBeInTheDocument()
        })
    })

    describe('Loading State', () => {
        it('shows loading spinner when isLoading is true', () => {
            render(<Button isLoading>Save</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('aria-busy', 'true')
        })

        it('shows custom loading text', () => {
            render(<Button isLoading loadingText="Saving...">Save</Button>)
            // loadingText is rendered both in sr-only and visible span
            const button = screen.getByRole('button')
            expect(button).toHaveTextContent('Saving...')
        })

        it('disables button when loading', () => {
            render(<Button isLoading>Save</Button>)
            const button = screen.getByRole('button')
            expect(button).toBeDisabled()
        })

        it('adds aria-busy attribute when loading', () => {
            render(<Button isLoading>Save</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('aria-busy', 'true')
        })
    })

    describe('Disabled State', () => {
        it('disables button when disabled prop is true', () => {
            render(<Button disabled>Disabled</Button>)
            const button = screen.getByRole('button')
            expect(button).toBeDisabled()
        })

        it('does not call onClick when disabled', async () => {
            const handleClick = vi.fn()
            const user = userEvent.setup()

            render(<Button disabled onClick={handleClick}>Disabled</Button>)
            const button = screen.getByRole('button')

            await user.click(button)
            expect(handleClick).not.toHaveBeenCalled()
        })
    })

    describe('Interactions', () => {
        it('calls onClick when clicked', async () => {
            const handleClick = vi.fn()
            const user = userEvent.setup()

            render(<Button onClick={handleClick}>Click me</Button>)
            const button = screen.getByRole('button')

            await user.click(button)
            expect(handleClick).toHaveBeenCalledTimes(1)
        })

        it('can be focused with keyboard', async () => {
            const user = userEvent.setup()

            render(<Button>Focus me</Button>)
            const button = screen.getByRole('button')

            await user.tab()
            expect(button).toHaveFocus()
        })

        it('can be activated with Enter key', async () => {
            const handleClick = vi.fn()
            const user = userEvent.setup()

            render(<Button onClick={handleClick}>Press Enter</Button>)
            const button = screen.getByRole('button')

            button.focus()
            await user.keyboard('{Enter}')
            expect(handleClick).toHaveBeenCalled()
        })

        it('can be activated with Space key', async () => {
            const handleClick = vi.fn()
            const user = userEvent.setup()

            render(<Button onClick={handleClick}>Press Space</Button>)
            const button = screen.getByRole('button')

            button.focus()
            await user.keyboard(' ')
            expect(handleClick).toHaveBeenCalled()
        })
    })

    describe('Accessibility', () => {
        it('has button role', () => {
            render(<Button>Accessible</Button>)
            expect(screen.getByRole('button')).toBeInTheDocument()
        })

        it('announces loading state to screen readers', () => {
            render(<Button isLoading>Save</Button>)
            const button = screen.getByRole('button')
            // Loading text is in sr-only span
            expect(button).toHaveAttribute('aria-busy', 'true')
        })

        it('has proper disabled state for screen readers', () => {
            render(<Button disabled>Disabled</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('disabled')
        })
    })
})
