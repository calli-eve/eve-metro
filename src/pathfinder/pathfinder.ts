import Graph from 'node-dijkstra'
import { getEveScoutNodes } from './eve-scout-nodes'
import { RouteSystem, ShipSize, SystemNode, SystemId, SystemEdge } from '../types/types'
import { getStaticNodes } from './static-nodes'
import { canShipPassMassTest } from '../utils'
import { getTrigMapNodes } from './trig-nodes'

export interface CalculateRouteInput {
    startSystemId: number
    endSystemId: number
    avoidSystemIds: number[]
    useEveScout: boolean
    shipSize: ShipSize
    preferSafe: boolean
    avoidWhsReportedExpired: boolean
}

const mergeNodes = (nodesMapsArray: Map<SystemId, SystemNode>[]): Map<SystemId, SystemNode> => {
    const total = new Map(nodesMapsArray[0])
    nodesMapsArray.forEach((nodeMap, i) => {
        if (i === 0) return
        nodeMap.forEach((node) => {
            if (total.has(node.systemId)) {
                const existingNode = total.get(node.systemId)
                total.set(node.systemId, {
                    ...existingNode,
                    systemEdges: [...existingNode.systemEdges, ...node.systemEdges]
                })
            } else {
                total.set(node.systemId, node)
            }
        })
    })
    return total
}

const calculateNodeWeight = (edge: SystemEdge, input: CalculateRouteInput): number => {
    let weight = 1
    if (input.preferSafe && edge.solarSystemSecDst < 0.45) weight = weight + 100
    return weight
}

export const calculateRoute = async (
    calculateRouteInput: CalculateRouteInput
): Promise<RouteSystem[]> => {
    const { startSystemId, endSystemId, useEveScout, avoidSystemIds, shipSize } =
        calculateRouteInput
    const staticNodes = getStaticNodes()
    const eveScoutNodes = useEveScout ? await getEveScoutNodes() : new Map()
    const trigNodes = await getTrigMapNodes(calculateRouteInput.avoidWhsReportedExpired)
    const mergedNodes = mergeNodes([staticNodes, eveScoutNodes, trigNodes])
    const graph = new Graph()
    mergedNodes.forEach((node) => {
        if (!canShipPassMassTest(node.shipSize, shipSize)) return
        const neighbors = {}
        node.systemEdges.forEach((edge) => {
            if (canShipPassMassTest(edge.shipSize, shipSize))
                neighbors[edge.solarSystemIdDst] = calculateNodeWeight(edge, calculateRouteInput)
        })
        graph.addNode(`${node.systemId}`, neighbors)
    })
    const optimalRoute = graph.path(`${startSystemId}`, `${endSystemId}`, {
        avoid: [...avoidSystemIds].map((i) => `${i}`)
    }) as string[]
    if (optimalRoute === null) return []
    const systemRoute = optimalRoute.map((systemId, index) => {
        const current = mergedNodes.get(parseInt(systemId))
        const next =
            index < optimalRoute.length
                ? mergedNodes.get(parseInt(optimalRoute[index + 1]))
                : undefined
        const currentEdge = current.systemEdges.find((e) => e.solarSystemIdDst === next?.systemId)
        return {
            currentSystemId: current.systemId,
            currentSystemName: current.systemName,
            currentSystemSecurity: current.systemSecurityStatus,
            thankYou: currentEdge?.creatorName,
            massCritical: currentEdge?.wormholeMass === 'critical',
            lifeCritical: currentEdge?.wormholeEol === 'critical',
            nextSystemName: next?.systemName,
            nextSystemSig: next?.systemId
                ? current.systemEdges.find((edge) => edge.solarSystemIdDst === next.systemId)
                      ?.signatureDst
                : undefined
        }
    })
    return systemRoute
}
