import { securityStatusColor } from '../../utils'
const PathRow = ({ system, systemData, index }) => {
    return (
        <div className="flex-row PathRow">
            <div className={'flex-row'}>
                <div
                    style={{
                        marginRight: '1rem',
                        width: '1rem'
                    }}>
                    {index}:
                </div>
                <a
                    target="_blank"
                    rel="noreferrer"
                    title={`Click to copyt ${system.currentSystemName} to clipboard`}
                    style={{
                        color: `${securityStatusColor(system)}`,
                        minWidth: '7rem',
                        marginRight: '1rem'
                    }}
                    onClick={() => {
                        navigator.clipboard.writeText(`${system.currentSystemName}`)
                    }}>
                    {`${system.currentSystemName}`}
                    <span style={{ color: 'white' }}>
                        {system.nextSystemSig ? `--->${system.nextSystemSig.toUpperCase()}` : ''}
                    </span>
                </a>
                <div></div>
                <a
                    className={'flex-row'}
                    title="(Ship kills/Pod kills/Ship jumps/NPC kills) past hour"
                    href={`https://zkillboard.com/system/${system.currentSystemId}/`}
                    rel="noreferrer"
                    target="_blank">
                    (
                    <div>
                        {systemData && systemData.esiKills ? systemData.esiKills.ship_kills : 0}/
                    </div>
                    <div>
                        {systemData && systemData.esiKills ? systemData.esiKills.pod_kills : 0}/
                    </div>
                    <div>
                        {systemData && systemData.esiJumps ? systemData.esiJumps.ship_jumps : 0}/
                    </div>
                    <div>
                        {systemData && systemData.esiKills ? systemData.esiKills.npc_kills : 0}
                    </div>
                    )
                </a>
                <div style={{ marginLeft: '1rem', color: 'red' }}>
                    {system?.massCritical || system?.lifeCritical ? (
                        <div className="Critical">CRITICAL</div>
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PathRow
