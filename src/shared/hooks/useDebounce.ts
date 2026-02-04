import { useCallback, useEffect, useState } from "react"

/**
 * Custom hook for debouncing a value.
 * Useful for search inputs to avoid excessive API calls.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState("")
 * const debouncedSearch = useDebounce(searchTerm, 500)
 * 
 * useEffect(() => {
 *   // This runs 500ms after the user stops typing
 *   fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

/**
 * Custom hook for creating debounced callbacks.
 * Useful when you need to debounce a function, not a value.
 * 
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns A debounced version of the callback
 * 
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback((query: string) => {
 *   fetchResults(query)
 * }, 500)
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => ReturnType<T>>(
    callback: T,
    delay: number = 300
): (...args: Parameters<T>) => void {
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

    return useCallback(
        (...args: Parameters<T>) => {
            if (timeoutId) {
                clearTimeout(timeoutId)
            }

            const id = setTimeout(() => {
                callback(...args)
            }, delay)

            setTimeoutId(id)
        },
        [callback, delay, timeoutId]
    )
}
