import { useContext } from 'react'
import { Session } from '../../state/SessionContainer'
import Salaries from './Salaries'
import ScanSpread from './ScanSpread'
import Total from './Total'
import ScanStats from './ScanStats'

const Stats = () => {
    const session = useContext(Session)
    return (
        <>
            <Total />
            <ScanSpread />
            {session?.character?.level === 3 && (
                <>
                    <Salaries />
                    <ScanStats />
                </>
            )}
        </>
    )
}

export default Stats
