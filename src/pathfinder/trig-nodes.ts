import { getSystemFromDatabase } from '../data/db'
import { getTrigGraph } from '../pages/api/data/trig'
import { EdgeSource, SystemId, SystemNode } from '../types/types'
import { calculateShipSizeByWh } from '../utils'

export async function getTrigMapNodes(
    avoidWhsReportedExpired: boolean
): Promise<Map<SystemId, SystemNode>> {
    const trigMap = new Map<SystemId, SystemNode>()
    const data = await getTrigGraph(undefined, true)

    const connections = avoidWhsReportedExpired
        ? data.connections.filter(
              (c) => !c.already_expired_reports || c.already_expired_reports.length === 0
          )
        : data.connections

    connections.forEach((connection) => {
        const nodePochven: SystemNode = {
            systemId: connection.pochvenSystemId,
            systemName: connection.pochvenSystemName,
            systemSecurityStatus: 0.0,
            shipSize: calculateShipSizeByWh([
                connection.externalWormholeType,
                connection.pochvenWormholeType
            ]),
            systemEdges: [
                {
                    solarSystemIdDst: connection.externalSystemId as number,
                    solarSystemNameDst: connection.externalSystemName,
                    solarSystemSecDst: getSystemFromDatabase(connection.externalSystemId).security,
                    shipSize: calculateShipSizeByWh([
                        connection.externalWormholeType,
                        connection.pochvenWormholeType
                    ]),
                    edgeSource: EdgeSource['trig-map'],
                    signatureSrc: connection.externalSignature,
                    signatureDst: connection.pochvenSignature,
                    wormholeTypeSrc: connection.pochvenWormholeType,
                    wormholeTypeDst: connection.externalWormholeType,
                    wormholeMass: connection.massCritical ? 'critical' : 'stable',
                    wormholeEol: connection.timeCritical ? 'critical' : 'stable',
                    creatorName: undefined,
                    createdTime: connection.createdTime,
                    lastSeenTime: connection.last_seen
                }
            ]
        }
        const nodeExternal: SystemNode = {
            systemId: connection.externalSystemId as number,
            systemName: connection.externalSystemName,
            systemSecurityStatus: 0.0,
            shipSize: calculateShipSizeByWh([
                connection.externalWormholeType,
                connection.pochvenWormholeType
            ]),
            systemEdges: [
                {
                    solarSystemIdDst: connection.pochvenSystemId,
                    solarSystemNameDst: connection.pochvenSystemName,
                    solarSystemSecDst: getSystemFromDatabase(connection.pochvenSystemId).security,
                    shipSize: calculateShipSizeByWh([
                        connection.externalWormholeType,
                        connection.pochvenWormholeType
                    ]),
                    edgeSource: EdgeSource['trig-map'],
                    signatureSrc: connection.pochvenSignature,
                    signatureDst: connection.externalSignature,
                    wormholeTypeSrc: connection.externalWormholeType,
                    wormholeTypeDst: connection.pochvenWormholeType,
                    wormholeMass: connection.massCritical ? 'critical' : 'stable',
                    wormholeEol: connection.timeCritical ? 'critical' : 'stable',
                    creatorName: undefined,
                    createdTime: connection.createdTime,
                    lastSeenTime: connection.last_seen
                }
            ]
        }

        if (trigMap.has(connection.externalSystemId as number)) {
            const existingNode = trigMap.get(connection.externalSystemId as number)
            trigMap.set(connection.externalSystemId as number, {
                ...existingNode,
                systemEdges: [...existingNode.systemEdges, ...nodeExternal.systemEdges]
            })
        } else {
            trigMap.set(connection.externalSystemId as number, nodeExternal)
        }

        if (trigMap.has(connection.pochvenSystemId)) {
            const existingNode = trigMap.get(connection.pochvenSystemId)
            trigMap.set(connection.pochvenSystemId, {
                ...existingNode,
                systemEdges: [...existingNode.systemEdges, ...nodePochven.systemEdges]
            })
        } else {
            trigMap.set(connection.pochvenSystemId, nodePochven)
        }
    })

    return trigMap
}
