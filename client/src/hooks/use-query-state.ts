import { useState, useCallback, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';

/**
 * A hook to manage state via URL query parameters.
 * Synchronizes a value with a specific key in the URL search string.
 * 
 * @param key The query parameter key (e.g., "tab")
 * @param defaultValue The initial value if the parameter is missing
 * @returns [value, setValue] similar to useState
 */
export function useQueryState<T extends string>(key: string, defaultValue: T) {
    const [location, setLocation] = useLocation();
    const searchString = useSearch();

    // Parse current value from search string
    const getQueryValue = useCallback(() => {
        const params = new URLSearchParams(searchString);
        return (params.get(key) as T) || defaultValue;
    }, [searchString, key, defaultValue]);

    const [value, setInternalValue] = useState<T>(getQueryValue());

    // Keep internal state in sync with URL changes (e.g., back button)
    useEffect(() => {
        const newValue = getQueryValue();
        if (newValue !== value) {
            setInternalValue(newValue);
        }
    }, [searchString, getQueryValue, value]);

    const setValue = useCallback((newValue: string) => {
        const params = new URLSearchParams(window.location.search);

        if (newValue === defaultValue) {
            params.delete(key);
        } else {
            params.set(key, newValue);
        }

        const newSearch = params.toString();
        const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;

        // Update URL via wouter
        setInternalValue(newValue as T);
        setLocation(newPath);
    }, [key, defaultValue, setLocation]);

    return [value, setValue] as [T, (newValue: string) => void];
}

