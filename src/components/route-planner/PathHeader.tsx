import { HIGHSEC_GREEN, JSPACE_BLUE, LOWSEC_YELLOW, NULLSEC_RED, TRIGLAVIAN_RED } from '../../const'

const PathHeader = () => {
    return (
        <div
            className="flex-row PathRow"
            style={{
                borderBottom: '1px solid white',
                paddingBottom: '0.4rem',
                marginBottom: '0.4rem',
                marginTop: '0.4rem',
                display: 'flex',
                flexDirection: 'column'
            }}>
            <div
                className="Legend"
                style={{
                    fontSize: '1rem',
                    color: 'white'
                }}>
                <p>
                    <span style={{ color: HIGHSEC_GREEN, marginRight: '0.2rem' }}>HS</span>
                    <span style={{ color: LOWSEC_YELLOW, marginRight: '0.2rem' }}>LS</span>
                    <span style={{ color: NULLSEC_RED, marginRight: '0.2rem' }}>NS</span>
                    <span style={{ color: JSPACE_BLUE, marginRight: '0.2rem' }}>J-Space</span>
                    <span style={{ color: TRIGLAVIAN_RED, marginRight: '0.2rem' }}>T-Space</span>
                </p>
            </div>
            <div className={'flex-row'}>
                <div
                    style={{
                        marginRight: '1rem',
                        width: '1rem'
                    }}>
                    #
                </div>
                <a
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        color: 'white',
                        minWidth: '7rem',
                        marginRight: '1rem'
                    }}>
                    <div>{'SYSTEM--->SIG'}</div>
                </a>
                <div title="(SK kills/Pod kills/Ship jumps/NPC kills) past hour">
                    (Stats past hour)
                </div>
                <div style={{ marginLeft: '1rem', color: 'red' }}>Connection status</div>
            </div>
        </div>
    )
}

export default PathHeader
