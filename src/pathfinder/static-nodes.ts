import { EdgeSource, ShipSize, SystemId, SystemNode } from '../types/types'
import { readFileSync, writeFile } from 'fs'

export interface EveStaticEdges {
    fromSolarSystemID: number
    toSolarSystemID: number
}

export interface EveStaticSystem {
    solarSystemName: string
    security: number
    regionID: number
}

export interface SystemWithEdges {
    [systemId: string]: EveStaticEdges[]
}

const groupBy = (items, key) =>
    items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: [...(result[item[key]] || []), item]
        }),
        {}
    )

const calculateShipSizeBySecurityStatus = (securityStatus: number): ShipSize => {
    if (securityStatus >= 0.45) return 'Freighter'
    else return 'Capital'
}

export const generateStaticData = () => {
    const db = require('better-sqlite3')('sqlite-latest.sqlite')
    const result: EveStaticEdges[] = db
        .prepare('select fromSolarSystemID, toSolarSystemID FROM mapSolarSystemJumps')
        .all()
    const edges: SystemWithEdges = groupBy(result, 'fromSolarSystemID')
    const nodesMap: Map<SystemId, SystemNode> = new Map()

    Object.keys(edges).forEach((systemId) => {
        const { security, solarSystemName }: EveStaticSystem = db
            .prepare(
                'select solarSystemName, security from mapSolarSystems where solarSystemID = ?'
            )
            .get(systemId)
        nodesMap.set(parseInt(systemId), {
            systemId: parseInt(systemId),
            systemName: solarSystemName,
            systemSecurityStatus: security,
            shipSize: calculateShipSizeBySecurityStatus(security),
            systemEdges: edges[systemId].map((edge) => {
                const edgeSystem: EveStaticSystem = db
                    .prepare(
                        'select solarSystemName, security from mapSolarSystems where solarSystemID = ?'
                    )
                    .get(edge.toSolarSystemID)
                return {
                    solarSystemIdDst: edge.toSolarSystemID,
                    solarSystemNameDst: edgeSystem.solarSystemName,
                    solarSystemSecDst: edgeSystem.security,
                    edgeSource: EdgeSource['k-space'],
                    shipSize: calculateShipSizeBySecurityStatus(edgeSystem.security)
                }
            })
        })
    })
    writeFile(
        './src/__files__/static-graph.json',
        JSON.stringify(Array.from(nodesMap.entries())),
        (err) => {
            if (err) console.log(err)
            else {
                console.log('File written successfully\n')
            }
        }
    )
}

export function getStaticNodes(): Map<SystemId, SystemNode> {
    const staticGraphJson = JSON.parse(
        readFileSync('./src/__files__/static-graph.json', { encoding: 'utf8', flag: 'r' })
    )
    const staticGraph = new Map<SystemId, SystemNode>()
    staticGraphJson.forEach((tuple) => staticGraph.set(tuple[0] as number, tuple[1] as SystemNode))
    return staticGraph
}
