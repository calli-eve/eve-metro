import { useEffect } from 'react'

const ONE_MINUTE = 60000;

/**
 * Creates a managed setInterval which can be enabled or disabled at will.
 */
const makeManagedInterval = (fn: Function) => {
    let interval = null;

    return {
        enable: () => {
            if (!interval) {
                fn();
                interval = setInterval(() => { fn(); }, ONE_MINUTE)
            }
        },
        disable: () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        }
    };
};

export const useManagedInterval = (fn: Function) => {
    useEffect(() => {
        const managedInterval = makeManagedInterval(fn);

        const ac = new AbortController();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                managedInterval.enable();
            } else {
                managedInterval.disable()
            }
        }, { signal: ac.signal });

        managedInterval.enable();

        return () => {
            managedInterval.disable()
            ac.abort();
        }
    }, []);
}