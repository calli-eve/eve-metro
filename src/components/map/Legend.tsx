import { useContext } from 'react'
import { Button } from 'antd'
import {
    HIGHSEC_GREEN,
    JSPACE_BLUE,
    LOWSEC_YELLOW,
    NULLSEC_RED,
    PERUN_COLOR,
    SVAROG_COLOR,
    VELES_COLOR
} from '../../const'
import { TrigData } from '../../state/TrigDataContainer'

const Legend = () => {
    const trigStorage = useContext(TrigData)
    const audio = new Audio('/boing.mp3')
    const onBoing = () => {
        audio.play()
        trigStorage.boingTrigData()
    }
    return (
        <div
            className="legend"
            style={{
                display: 'flex',
                flexDirection: 'column',
                zIndex: '10' as unknown as number
            }}>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '0.4rem' }}>
                <div className="oval" style={{ backgroundColor: PERUN_COLOR }}>
                    Perun Krai
                </div>
                <div className="oval" style={{ backgroundColor: VELES_COLOR }}>
                    Veles Krai
                </div>
                <div className="oval" style={{ backgroundColor: SVAROG_COLOR }}>
                    Svarog Krai
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '0.4rem' }}>
                <div className="round" style={{ backgroundColor: HIGHSEC_GREEN }}>
                    HS
                </div>
                <div className="round" style={{ backgroundColor: LOWSEC_YELLOW }}>
                    LS
                </div>
                <div className="round" style={{ backgroundColor: NULLSEC_RED }}>
                    NS
                </div>
                <div className="round" style={{ backgroundColor: JSPACE_BLUE }}>
                    J-Space
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '1rem' }}>
                <div className="oval" style={{ backgroundColor: 'gray' }}>
                    - - - Reported as expired
                </div>
                <Button onClick={onBoing} style={{ borderRadius: '6px', marginLeft: '0.2rem' }}>
                    Boing
                </Button>
                {trigStorage.boingCount > 0 ? (
                    <div
                        className="oval"
                        style={{
                            backgroundColor: 'rainbow',
                            border: '1px white solid',
                            marginLeft: '0.4rem'
                        }}>
                        {' '}
                        Boings: {trigStorage.boingCount}
                    </div>
                ) : (
                    <></>
                )}
            </div>

            <style jsx>{`
                .oval {
                    display: flex;
                    align-items: center;
                    margin: 0 0.2rem;
                    padding: 0.2rem 0.6rem;
                    border-radius: 6px;
                }
                .round {
                    display: flex;
                    align-items: center;
                    margin: 0 0.2rem;
                    padding: 0.2rem 0.6rem;
                    border-radius: 24px;
                }
                .legend {
                    position: fixed;
                    left: 1rem;
                    max-height: 2rem;
                }
            `}</style>
        </div>
    )
}

export default Legend
