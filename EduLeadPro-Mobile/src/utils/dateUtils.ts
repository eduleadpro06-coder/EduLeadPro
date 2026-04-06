/**
 * IST Date/Time Utilities
 * Centralized date formatting for the mobile app.
 * All functions explicitly use 'Asia/Kolkata' timezone to ensure
 * consistent IST display regardless of the user's device timezone.
 */

const IST_TIMEZONE = 'Asia/Kolkata';
const IST_LOCALE = 'en-IN';

/**
 * Format a date/time value as a full IST datetime string.
 * Example output: "06 Apr 2026, 05:19 pm"
 */
export const formatIST = (date: Date | string | number | null | undefined): string => {
    if (!date) return '-';
    try {
        return new Intl.DateTimeFormat(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Format only the time portion in IST.
 * Example output: "05:19 pm"
 */
export const formatISTTime = (date: Date | string | number | null | undefined): string => {
    if (!date) return '-';
    try {
        return new Intl.DateTimeFormat(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Format only the date portion in IST.
 * Example output: "06 Apr 2026"
 */
export const formatISTDate = (date: Date | string | number | null | undefined): string => {
    if (!date) return '-';
    try {
        return new Intl.DateTimeFormat(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Format a date as a short readable string (e.g., "Apr 06").
 */
export const formatISTShort = (date: Date | string | number | null | undefined): string => {
    if (!date) return '-';
    try {
        return new Intl.DateTimeFormat(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            month: 'short',
            day: '2-digit',
        }).format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Format a date with day name and full date (e.g., "Mon, April 06, 2026").
 * Used for date picker displays.
 */
export const formatISTFull = (date: Date | string | number | null | undefined): string => {
    if (!date) return '-';
    try {
        return new Intl.DateTimeFormat(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            weekday: 'short',
            month: 'long',
            day: '2-digit',
            year: 'numeric',
        }).format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Format a date as "MMM dd, yyyy" (e.g., "Apr 06, 2026").
 */
export const formatISTMedium = (date: Date | string | number | null | undefined): string => {
    if (!date) return '-';
    try {
        return new Intl.DateTimeFormat(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        }).format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Format date with short month, day, and time (e.g., "Apr 06, 5:19 pm").
 */
export const formatISTDateTimeShort = (date: Date | string | number | null | undefined): string => {
    if (!date) return '-';
    try {
        return new Intl.DateTimeFormat(IST_LOCALE, {
            timeZone: IST_TIMEZONE,
            month: 'short',
            day: '2-digit',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(new Date(date));
    } catch {
        return '-';
    }
};

/**
 * Get current IST date as YYYY-MM-DD string.
 */
export const getISTDateString = (): string => {
    return new Date().toLocaleDateString('en-CA', { timeZone: IST_TIMEZONE });
};
