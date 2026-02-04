import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock optional dependencies that are not needed for UI component testing
vi.mock('@upstash/ratelimit', () => ({
    Ratelimit: vi.fn(),
}))

vi.mock('@upstash/redis', () => ({
    Redis: vi.fn(),
}))

vi.mock('next/server', () => {
    return {
        NextRequest: class {
            constructor(input: any, _init: any) { this.url = input }
            url: string
            headers = new Map()
            method = 'GET'
        },
        NextResponse: {
            json: (body: any, init: any) => ({ body, ...init, headers: new Headers() }),
            redirect: vi.fn(),
        }
    }
})

