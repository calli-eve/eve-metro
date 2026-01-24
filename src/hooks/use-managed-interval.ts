import { useEffect, useMemo } from 'react'


/**
 * Creates a managed setInterval which can be enabled, paused, or vice versa. By default, it is
 * disabled until manually enabled.
 */
const makeManagedInterval = (fn: Function, delay: number) => {
    let interval = null;
    let enabled = false;

    /**
     * If we have an existing interval, clears it.
     */
    const pause = () => {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    };

    /**
     * If enabled, runs and sets the interval.
     */
    const resume = () => {
        if (enabled && !interval) {
            fn();
            interval = setInterval(() => { fn(); }, delay)
        }
    };

    /**
     * Pauses and disables the interval.
     */
    const disable = () => {
        pause();
        enabled = false
    };

    /**
     * Enables and resumes the interval.
     */
    const enable = () => {
        enabled = true;
        resume();
    };

    return {
        /**
         * Whether the managed interval is enabled. If false, no actions will trigger
         * even when unpaused.
         */
        get enabled() { return enabled; },

        /**
         * Whether the managed interval is currently paused.
         */
        get paused() { return interval === null; },

        disable,
        enable,
        pause,
        resume,
    };
};

export const useManagedInterval = (fn: Function, delay: number) => {
    const managedInterval = useMemo(() => makeManagedInterval(fn, delay), [fn, delay]);

    useEffect(() => {
        const ac = new AbortController();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                managedInterval.resume();
            } else {
                managedInterval.pause()
            }
        }, { signal: ac.signal });

        managedInterval.resume();

        return () => {
            managedInterval.pause()
            ac.abort();
        }
    }, [managedInterval]);

    return { managedInterval };
}