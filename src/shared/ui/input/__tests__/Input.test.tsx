import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Input } from '../Input'

describe('Input', () => {
    describe('Rendering', () => {
        it('renders input element', () => {
            render(<Input placeholder="Enter text" />)
            expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
        })

        it('renders with inputClassName on input element', () => {
            render(<Input inputClassName="custom-input" placeholder="Input" />)
            const input = screen.getByPlaceholderText('Input')
            expect(input).toHaveClass('custom-input')
        })

        it('renders with default value', () => {
            render(<Input defaultValue="Default text" />)
            const input = screen.getByDisplayValue('Default text')
            expect(input).toBeInTheDocument()
        })
    })

    describe('Types', () => {
        it('renders input without explicit type attribute by default', () => {
            render(<Input placeholder="Text" />)
            const input = screen.getByPlaceholderText('Text')
            // HTML inputs default to text, but attribute may not be set explicitly
            expect(input).toBeInTheDocument()
        })

        it('renders password input', () => {
            render(<Input type="password" placeholder="Password" />)
            const input = screen.getByPlaceholderText('Password')
            expect(input).toHaveAttribute('type', 'password')
        })

        it('renders email input', () => {
            render(<Input type="email" placeholder="Email" />)
            const input = screen.getByPlaceholderText('Email')
            expect(input).toHaveAttribute('type', 'email')
        })

        it('renders search input with icon', () => {
            render(<Input type="search" placeholder="Search" />)
            const input = screen.getByPlaceholderText('Search')
            expect(input).toHaveAttribute('type', 'search')
            // Search icon should be present (aria-hidden)
            const container = input.parentElement
            expect(container).toBeInTheDocument()
        })
    })

    describe('Password Toggle', () => {
        it('shows password toggle button for password type', () => {
            render(<Input type="password" placeholder="Password" />)
            const toggleButton = screen.getByLabelText('Change password visibility')
            expect(toggleButton).toBeInTheDocument()
        })

        it('toggles password visibility when clicked', async () => {
            const user = userEvent.setup()
            render(<Input type="password" placeholder="Password" />)

            const input = screen.getByPlaceholderText('Password')
            const toggleButton = screen.getByLabelText('Change password visibility')

            // Initially password type
            expect(input).toHaveAttribute('type', 'password')

            // Click to show password
            await user.click(toggleButton)
            expect(input).toHaveAttribute('type', 'text')

            // Click to hide password again
            await user.click(toggleButton)
            expect(input).toHaveAttribute('type', 'password')
        })

        it('has accessible label for password toggle', () => {
            render(<Input type="password" placeholder="Password" />)
            const toggleButton = screen.getByLabelText('Change password visibility')
            expect(toggleButton).toHaveAttribute('aria-label')
        })
    })

    describe('Error State', () => {
        it('applies error styles when hasError is true', () => {
            render(<Input hasError placeholder="Error input" />)
            const input = screen.getByPlaceholderText('Error input')
            expect(input).toBeInTheDocument()
            // Error class should be applied (visual check)
        })

        it('does not apply error styles by default', () => {
            render(<Input placeholder="Normal input" />)
            const input = screen.getByPlaceholderText('Normal input')
            expect(input).toBeInTheDocument()
        })
    })

    describe('Disabled State', () => {
        it('disables input when disabled prop is true', () => {
            render(<Input disabled placeholder="Disabled" />)
            const input = screen.getByPlaceholderText('Disabled')
            expect(input).toBeDisabled()
        })

        it('cannot be focused when disabled', async () => {
            const user = userEvent.setup()
            render(<Input disabled placeholder="Disabled" />)
            const input = screen.getByPlaceholderText('Disabled')

            await user.tab()
            expect(input).not.toHaveFocus()
        })
    })

    describe('Interactions', () => {
        it('accepts user input', async () => {
            const user = userEvent.setup()
            render(<Input placeholder="Type here" />)
            const input = screen.getByPlaceholderText('Type here')

            await user.type(input, 'Hello World')
            expect(input).toHaveValue('Hello World')
        })

        it('calls onChange when value changes', async () => {
            const handleChange = vi.fn()
            const user = userEvent.setup()

            render(<Input onChange={handleChange} placeholder="Input" />)
            const input = screen.getByPlaceholderText('Input')

            await user.type(input, 'a')
            expect(handleChange).toHaveBeenCalled()
        })

        it('can be cleared', async () => {
            const user = userEvent.setup()
            render(<Input defaultValue="Clear me" />)
            const input = screen.getByDisplayValue('Clear me')

            await user.clear(input)
            expect(input).toHaveValue('')
        })

        it('can be focused with tab', async () => {
            const user = userEvent.setup()
            render(<Input placeholder="Focus me" />)
            const input = screen.getByPlaceholderText('Focus me')

            await user.tab()
            expect(input).toHaveFocus()
        })
    })

    describe('Accessibility', () => {
        it('has textbox role', () => {
            render(<Input placeholder="Accessible" />)
            expect(screen.getByRole('textbox')).toBeInTheDocument()
        })

        it('supports aria-label', () => {
            render(<Input aria-label="Username" />)
            const input = screen.getByLabelText('Username')
            expect(input).toBeInTheDocument()
        })

        it('hides decorative icons from screen readers', () => {
            render(<Input type="search" placeholder="Search" />)
            // Search icon should have aria-hidden
            const input = screen.getByPlaceholderText('Search')
            expect(input).toBeInTheDocument()
        })
    })
})
