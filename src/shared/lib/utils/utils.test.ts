import { describe, expect, it } from 'vitest'
import { cx, percentageFormatter, usNumberformatter } from './cn'

describe('cx', () => {
    it('merges class names correctly', () => {
        expect(cx('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
    })

    it('handles conditional classes', () => {
        expect(cx('text-red-500', false && 'bg-blue-500', true && 'font-bold')).toBe('text-red-500 font-bold')
    })

    it('merges tailwind classes (overrides)', () => {
        // padding-8 overrides padding-4
        expect(cx('p-4', 'p-8')).toBe('p-8')
    })
})

describe('formatters', () => {
    it('formats numbers correctly', () => {
        expect(usNumberformatter(12345.678, 2)).toBe('12,345.68')
    })

    it('formats percentage correctly', () => {
        expect(percentageFormatter(12.34, 1)).toBe('12.3%')
    })
})
