import { useEffect, useState } from 'react'
import { Divider, Tooltip } from 'antd'
import { cyan, green, volcano } from '@ant-design/colors'

const eveTimeFormatter = new Intl.DateTimeFormat(
    undefined,
    { timeZone: 'GMT', dateStyle: 'short', timeStyle: 'short', hourCycle: 'h24',  },
);
const localTimeFormatter = new Intl.DateTimeFormat(
    undefined,
    { timeStyle: 'short', dateStyle: 'short', hourCycle: 'h24',  },
);

const makeCurrentTimes = () => {
    const now = Date.now()
    return {
        EVE: eveTimeFormatter.format(now),
        LOCAL: localTimeFormatter.format(now),
    };
}
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

/**
 * For use with @ant-design/colors arrays.
 */
const colorIndices = {
    tip: 8,
    text: 4,
    border: -2,
} as const;

/**
 * Utility to show a live clock with the current EVE and local date/times. If the document becomes
 * hidden (ie user tabs to another in the same window), pauses the live updates, and resumes when
 * the document becomes visible.
 */
const Clock = () => {
    const [currentTimes, setCurrentTimes] = useState(makeCurrentTimes);

    useEffect(() => {
        const clock = makeManagedInterval(() => setCurrentTimes(makeCurrentTimes()));

        const ac = new AbortController();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                clock.enable();
            } else {
                clock.disable()
            }
        }, { signal: ac.signal });

        clock.enable();

        return () => {
            clock.disable()
            ac.abort();
        }
    }, []);

    const borderColor = volcano.at(colorIndices.border);
    return (
        <div className='clock' style={{ borderColor }}>
            <Tooltip color={green[colorIndices.tip]} title='Current EVE Time'>
                <span style={{ color: green[colorIndices.text] }}>
                    {currentTimes.EVE}
                </span>
            </Tooltip>
            <Divider type='vertical' variant='solid' style={{ borderColor }} />
            <Tooltip color={cyan[colorIndices.tip]} title='Current Local Time'>
                <span style={{ color: cyan[colorIndices.text] }}>
                    {currentTimes.LOCAL}
                </span>
            </Tooltip>
        </div>
    );
}

export { Clock };
