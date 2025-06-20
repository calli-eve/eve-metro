import { useCallback, useState } from 'react'
import { Button, Checkbox } from 'antd'
import { SimpleSystem } from '../../types/types'

interface StaticEmpireSystemsRouteOptimizerProps {
    selectedSystem?: SimpleSystem
}

const StaticEmpireSystemsRouteOptimizer = ({
    selectedSystem
}: StaticEmpireSystemsRouteOptimizerProps) => {
    const [shouldSetInGameDestination, setShouldSetInGameDestination] = useState(false)
    const toggleSetInGameDestination = useCallback((e) => {
        setShouldSetInGameDestination((current) => !current)
    }, [])

    const [isRouting, setIsRouting] = useState(false)
    const triggerRouteOptimization = useCallback(() => {
        if (isRouting) return

        setIsRouting(true)
        console.log(
            `Attempting to optimize route for scanning ${selectedSystem?.solarSystemName} with 'shouldSetInGameDestination' set to ${shouldSetInGameDestination}`
        )
        setIsRouting(false)
    }, [selectedSystem, shouldSetInGameDestination])

    return (
        <>
            <Button onClick={triggerRouteOptimization}>Optimize Static Empire Systems Route</Button>
            <Checkbox
                onChange={toggleSetInGameDestination}
                value={shouldSetInGameDestination}
                style={{ alignSelf: 'flex-start', color: '#FFFFFF' }}>
                Set In-Game Destination
            </Checkbox>
        </>
    )
}

export default StaticEmpireSystemsRouteOptimizer
