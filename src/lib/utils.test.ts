import { describe, expect, it } from 'vitest'
import {
    cx,
    formatters,
    getChartColors,
    millionFormatter,
    percentageFormatter,
    usNumberformatter
} from './utils'

describe('utils', () => {
    describe('cx (class merger)', () => {
        it('merges multiple class strings', () => {
            expect(cx('foo', 'bar')).toBe('foo bar')
        })

        it('handles conditional classes', () => {
            expect(cx('base', true && 'active', false && 'disabled')).toBe('base active')
        })

        it('deduplicates Tailwind classes', () => {
            expect(cx('p-4', 'p-8')).toBe('p-8')
        })

        it('handles undefined and null', () => {
            expect(cx('foo', undefined, null, 'bar')).toBe('foo bar')
        })
    })

    describe('usNumberformatter', () => {
        it('formats integers without decimals by default', () => {
            expect(usNumberformatter(1234)).toBe('1,234')
        })

        it('formats with specified decimals', () => {
            expect(usNumberformatter(1234.5678, 2)).toBe('1,234.57')
        })

        it('handles zero', () => {
            expect(usNumberformatter(0)).toBe('0')
        })

        it('handles large numbers', () => {
            expect(usNumberformatter(1000000)).toBe('1,000,000')
        })
    })

    describe('percentageFormatter', () => {
        it('appends % symbol', () => {
            expect(percentageFormatter(85)).toBe('85.0%')
        })

        it('respects decimal places', () => {
            expect(percentageFormatter(85.567, 2)).toBe('85.57%')
        })
    })

    describe('millionFormatter', () => {
        it('appends M suffix', () => {
            expect(millionFormatter(5)).toBe('5.0M')
        })

        it('handles decimal precision', () => {
            expect(millionFormatter(5.678, 2)).toBe('5.68M')
        })
    })

    describe('formatters', () => {
        it('formats currency with USD default', () => {
            expect(formatters.currency(1234.56)).toBe('$1,234.56')
        })

        it('formats currency with custom currency code', () => {
            expect(formatters.currency(1234, 'EUR')).toBe('€1,234.00')
        })

        it('formats unit without currency symbol', () => {
            expect(formatters.unit(1234)).toBe('1,234')
        })
    })

    describe('getChartColors', () => {
        it('returns default 8 colors', () => {
            const colors = getChartColors()
            expect(colors).toHaveLength(8)
            expect(colors[0]).toBe('var(--chart-1)')
        })

        it('returns specified number of colors', () => {
            const colors = getChartColors(3)
            expect(colors).toHaveLength(3)
        })

        it('cycles through colors when count exceeds 8', () => {
            const colors = getChartColors(10)
            expect(colors[8]).toBe('var(--chart-1)')
            expect(colors[9]).toBe('var(--chart-2)')
        })
    })
})
