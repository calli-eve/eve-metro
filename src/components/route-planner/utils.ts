import { Sov } from '../../data/esiClient'
import { CalculateRouteInput } from '../../pathfinder/pathfinder'
import { RouteSystem, SimpleSystem } from '../../types/types'

export const fetchPath = async (input: CalculateRouteInput): Promise<RouteSystem[]> => {
    return fetch('/api/data/path', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        },
        body: JSON.stringify(input)
    }).then((response) => response.json())
}

export const fetchSystems = async (): Promise<SimpleSystem[]> => {
    return await fetch('/api/data/systems').then((response) => response.json())
}

export const fetchSov = async (): Promise<Sov[]> => {
    return await fetch('/api/data/sov').then((response) => response.json())
}

export const wrapperStyle = {
    display: 'inline-block',
    width: '20rem'
}

export const menuStyle = {
    borderRadius: '3px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '2px 0',
    fontSize: '90%',
    position: 'fixed',
    overflow: 'auto',
    maxHeight: '50%',
    zIndex: '100',
    color: 'black'
}
