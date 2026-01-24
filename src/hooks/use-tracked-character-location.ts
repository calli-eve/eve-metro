import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import queryString from 'query-string'
import Router from 'next/router'
import { getCurrentLocation } from '../data/esiClient'
import { useManagedInterval } from './use-managed-interval';

const eveSSOLogin = () => {
    const ssoUrl = `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/v2/oauth/authorize/?`
    const state = Math.random().toString(36).substring(1)
    const request = {
        response_type: 'code',
        redirect_uri: `${process.env.NEXT_PUBLIC_DOMAIN}/redirect`,
        client_id: process.env.NEXT_PUBLIC_EVE_SSO_ID,
        scope: 'esi-location.read_location.v1',
        state
    }

    const stringified = queryString.stringify(request)
    sessionStorage.setItem('savedState', state)
    sessionStorage.setItem('trackingLogin', 'true')
    Router.push(`${ssoUrl}${stringified}`)
};

/**
 * Hook to trigger start/stop of tracking an EVE user to show their position location and, if
 * in Pochven, highlight the system.
 */
export const useTrackedCharacterLocation = () => {
    const [trackedCharacter, setTrackedCharacter] = useState<any>(null);
    const [trackedLocation, setTrackedLocation] = useState<number | null>(null);

    const stopTracking = useCallback(() => {
        setTrackedCharacter(null);
        setTrackedLocation(null);
        localStorage.removeItem('trackingSession');
    }, []);

    /**
     * Only allow one active request at a time to get the current location.
     */
    const currentFetch = useRef(false);
    const getCurrentCharacterLocation = useCallback(() => {
        if (trackedCharacter && !currentFetch.current) {
            currentFetch.current = true;
            getCurrentLocation(trackedCharacter)
                .then((location) => {
                    if (location) setTrackedLocation(location.solar_system_id);
                })
                .catch((error) => {
                    console.error('Error fetching location:', error);
                    stopTracking();
                })
                .finally(() => { currentFetch.current = false; })
        }
    }, [trackedCharacter, stopTracking]);

    /**
     * Every 10 seconds, check for the current character location as long as the interval is
     * enabled and not paused, and no requests are already active.
     */
    const { managedInterval } = useManagedInterval(getCurrentCharacterLocation, 10000);

    useEffect(() => {
        // Check for stored tracking session
        const storedSession = localStorage.getItem('trackingSession');
        if (storedSession) {
            try {
                const session = JSON.parse(storedSession);
                setTrackedCharacter(session);
            } catch (error) {
                console.error('Error parsing stored session:', error);
                stopTracking();
            }
        }
    }, [stopTracking]);

    useEffect(() => {
        if (trackedCharacter) {
            managedInterval.enable();
        }
        else {
            managedInterval.disable();
        }

        /**
         * If we are tracking a character on unmount, disable the location fetch interval.
         */
        return () => {
            if (trackedCharacter) managedInterval.disable();
        }
    }, [managedInterval, trackedCharacter]);

    return {
        trackedCharacter,
        trackedLocation,
        onTrackCharacterClick: eveSSOLogin,
        onUntrackCharacterClick: stopTracking,
    }
};