import { describe, expect, it } from 'vitest'
import {
    calculateSLAPercentage,
    calculateWorkQualityPercentage,
    getScoreColor,
    getScoreLabel,
    mapPercentageToScore,
    SLA_PERCENTAGES,
    type Milestone
} from './kpi-calculations'

describe('kpi-calculations', () => {
    describe('SLA_PERCENTAGES', () => {
        it('has correct percentage values', () => {
            expect(SLA_PERCENTAGES['Faster']).toBe(120)
            expect(SLA_PERCENTAGES['On Time']).toBe(100)
            expect(SLA_PERCENTAGES['Delay']).toBe(80)
        })
    })

    describe('calculateSLAPercentage', () => {
        it('returns 0 for empty milestones', () => {
            expect(calculateSLAPercentage([])).toBe(0)
        })

        it('calculates 100% when all targets are met exactly', () => {
            const milestones: Milestone[] = [
                { name: 'M1', weight: 50, result: 'On Time', realAchieve: 5000, targetPercentage: 100 },
                { name: 'M2', weight: 50, result: 'On Time', realAchieve: 5000, targetPercentage: 100 }
            ]
            expect(calculateSLAPercentage(milestones)).toBe(100)
        })

        it('calculates above 100% when exceeding targets', () => {
            const milestones: Milestone[] = [
                { name: 'M1', weight: 100, result: 'Faster', realAchieve: 12000, targetPercentage: 100 }
            ]
            expect(calculateSLAPercentage(milestones)).toBe(120)
        })

        it('calculates below 100% for delays', () => {
            const milestones: Milestone[] = [
                { name: 'M1', weight: 100, result: 'Delay', realAchieve: 8000, targetPercentage: 100 }
            ]
            expect(calculateSLAPercentage(milestones)).toBe(80)
        })
    })

    describe('mapPercentageToScore', () => {
        it('returns 5 for >= 100%', () => {
            expect(mapPercentageToScore(100)).toBe(5)
            expect(mapPercentageToScore(120)).toBe(5)
        })

        it('returns 4 for >= 92%', () => {
            expect(mapPercentageToScore(92)).toBe(4)
            expect(mapPercentageToScore(99)).toBe(4)
        })

        it('returns 3 for >= 84%', () => {
            expect(mapPercentageToScore(84)).toBe(3)
            expect(mapPercentageToScore(91)).toBe(3)
        })

        it('returns 2 for >= 76%', () => {
            expect(mapPercentageToScore(76)).toBe(2)
            expect(mapPercentageToScore(83)).toBe(2)
        })

        it('returns 1 for < 76%', () => {
            expect(mapPercentageToScore(75)).toBe(1)
            expect(mapPercentageToScore(50)).toBe(1)
        })
    })

    describe('getScoreLabel', () => {
        it('returns correct labels for each score', () => {
            expect(getScoreLabel(5)).toBe('Outstanding')
            expect(getScoreLabel(4)).toBe('Exceeds Expectation')
            expect(getScoreLabel(3)).toBe('Meets Expectation')
            expect(getScoreLabel(2)).toBe('Below Expectation')
            expect(getScoreLabel(1)).toBe('Needs Improvement')
        })

        it('returns Unknown for invalid scores', () => {
            expect(getScoreLabel(0)).toBe('Unknown')
            expect(getScoreLabel(6)).toBe('Unknown')
        })
    })

    describe('getScoreColor', () => {
        it('returns color classes for each score', () => {
            expect(getScoreColor(5)).toContain('purple')
            expect(getScoreColor(4)).toContain('blue')
            expect(getScoreColor(3)).toContain('green')
            expect(getScoreColor(2)).toContain('yellow')
            expect(getScoreColor(1)).toContain('red')
        })

        it('returns default color for invalid scores', () => {
            expect(getScoreColor(0)).toContain('green')
        })
    })

    describe('calculateWorkQualityPercentage', () => {
        it('returns 0 for empty array', () => {
            expect(calculateWorkQualityPercentage([])).toBe(0)
        })

        it('returns 100 when all achieved', () => {
            const competencies = [
                { isAchieved: true },
                { isAchieved: true },
                { isAchieved: true }
            ]
            expect(calculateWorkQualityPercentage(competencies)).toBe(100)
        })

        it('returns 0 when none achieved', () => {
            const competencies = [
                { isAchieved: false },
                { isAchieved: false }
            ]
            expect(calculateWorkQualityPercentage(competencies)).toBe(0)
        })

        it('calculates partial percentage correctly', () => {
            const competencies = [
                { isAchieved: true },
                { isAchieved: false },
                { isAchieved: true },
                { isAchieved: false }
            ]
            expect(calculateWorkQualityPercentage(competencies)).toBe(50)
        })
    })
})
