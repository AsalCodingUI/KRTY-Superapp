import { describe, expect, it } from 'vitest'
import { hasOnlyOneValueForKey } from './chartUtils'

describe('chartUtils', () => {
    describe('hasOnlyOneValueForKey', () => {
        it('returns false when multiple items have the key', () => {
            const data = [{ id: 1, type: 'A' }, { id: 2, type: 'A' }]
            expect(hasOnlyOneValueForKey(data, 'type')).toBe(false)
        })

        it('returns true when key is present in only one item', () => {
            const data = [{ id: 1, type: 'A' }, { id: 2 }]
            expect(hasOnlyOneValueForKey(data, 'type')).toBe(true)
        })

        it('returns true for single item', () => {
            const data = [{ id: 1, type: 'A' }]
            expect(hasOnlyOneValueForKey(data, 'type')).toBe(true)
        })

        it('returns true for empty array', () => {
            const data: any[] = []
            expect(hasOnlyOneValueForKey(data, 'type')).toBe(true)
        })
    })
})
