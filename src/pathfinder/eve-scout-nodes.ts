import axios from 'axios'
import { THERA_SYSTEM_ID, TURNUR_SYSTEM_ID } from '../const'
import { getSystemFromDatabase } from '../data/db'
import { EdgeSource, SystemEdge, SystemId, SystemNode } from '../types/types'
import { calculateShipSizeByWh } from '../utils'

export interface EveScoutConnection {
    id: string
    created_at: Date
    created_by_id: number
    created_by_name: string
    updated_at: Date
    updated_by_id: number
    updated_by_name: string
    completed_at: Date
    completed_by_id: number
    completed_by_name: string
    completed: boolean
    wh_exits_outward: boolean
    wh_type: string
    max_ship_size: MaxShipSize
    expires_at: Date
    remaining_hours: number
    signature_type: SignatureType
    out_system_id: number
    out_system_name: OutSystemName
    out_signature: string
    in_system_id: number
    in_system_class: string
    in_system_name: string
    in_region_id: number
    in_region_name: string
    in_signature: string
}

export enum MaxShipSize {
    Capital = 'capital',
    Large = 'large',
    Medium = 'medium',
    Xlarge = 'xlarge'
}

export enum OutSystemName {
    Thera = 'Thera',
    Turnur = 'Turnur'
}

export enum SignatureType {
    Wormhole = 'wormhole'
}

export const fetchEveScoutData = () =>
    axios.get<EveScoutConnection[]>(process.env.EVE_SCOUT_API_URL)

export const mapEveScoutDataToNodes = (data: EveScoutConnection[]): Map<SystemId, SystemNode> => {
    const eveScoutNodes: Map<SystemId, SystemNode> = new Map(
        data.map((wormhole): [SystemId, SystemNode] => {
            const system = getSystemFromDatabase(wormhole.in_system_id)
            const size = calculateShipSizeByWh([wormhole.in_system_name, wormhole.wh_type])
            return [
                wormhole.in_system_id,
                {
                    systemId: wormhole.in_system_id,
                    systemName: wormhole.in_system_name,
                    systemSecurityStatus: system.security,
                    shipSize: size,
                    systemEdges: [
                        {
                            solarSystemIdDst: wormhole.out_system_id,
                            solarSystemNameDst: wormhole.out_system_name,
                            solarSystemSecDst:
                                wormhole.out_system_id === TURNUR_SYSTEM_ID ? 0.387 : -0.99,
                            shipSize: size,
                            edgeSource: EdgeSource['eve-scout'],
                            signatureSrc: wormhole.wh_exits_outward
                                ? wormhole.in_signature
                                : wormhole.out_signature,
                            signatureDst: wormhole.wh_exits_outward
                                ? wormhole.out_signature
                                : wormhole.in_signature
                        }
                    ]
                }
            ]
        })
    )

    const theraSystemEdges = data
        .filter((w) => w.out_system_id === THERA_SYSTEM_ID)
        .map((wormhole): SystemEdge => {
            const system = getSystemFromDatabase(wormhole.out_system_id)
            return {
                solarSystemIdDst: wormhole.in_system_id,
                solarSystemNameDst: wormhole.in_system_name,
                solarSystemSecDst: system.security,
                shipSize: calculateShipSizeByWh([wormhole.in_system_name, wormhole.wh_type]),
                edgeSource: EdgeSource['eve-scout'],
                signatureSrc: wormhole.wh_exits_outward
                    ? wormhole.out_signature
                    : wormhole.in_signature,
                signatureDst: wormhole.wh_exits_outward
                    ? wormhole.in_signature
                    : wormhole.out_signature,
                wormholeTypeSrc: wormhole.wh_exits_outward ? wormhole.wh_type : 'K162',
                wormholeTypeDst: wormhole.wh_exits_outward ? 'K162' : wormhole.wh_type,
                wormholeMass: 'stable',
                wormholeEol: wormhole.remaining_hours > 2 ? 'stable' : 'critical'
            }
        })

    const turnurSystemEdges = data
        .filter((w) => w.out_system_id === TURNUR_SYSTEM_ID)
        .map((wormhole): SystemEdge => {
            const system = getSystemFromDatabase(wormhole.out_system_id)
            return {
                solarSystemIdDst: wormhole.in_system_id,
                solarSystemNameDst: wormhole.in_system_name,
                solarSystemSecDst: system.security,
                shipSize: calculateShipSizeByWh([wormhole.in_system_name, wormhole.wh_type]),
                edgeSource: EdgeSource['eve-scout'],
                signatureSrc: wormhole.wh_exits_outward
                    ? wormhole.out_signature
                    : wormhole.in_signature,
                signatureDst: wormhole.wh_exits_outward
                    ? wormhole.in_signature
                    : wormhole.out_signature,
                wormholeTypeSrc: wormhole.wh_exits_outward ? wormhole.wh_type : 'K162',
                wormholeTypeDst: wormhole.wh_exits_outward ? 'K162' : wormhole.wh_type,
                wormholeMass: 'stable',
                wormholeEol: wormhole.remaining_hours > 2 ? 'stable' : 'critical'
            }
        })

    const theraNode: SystemNode = {
        systemId: THERA_SYSTEM_ID,
        systemName: 'Thera',
        systemSecurityStatus: -0.99,
        shipSize: 'Freighter',
        systemEdges: theraSystemEdges
    }

    const turnurNode: SystemNode = {
        systemId: TURNUR_SYSTEM_ID,
        systemName: 'Turnur',
        systemSecurityStatus: 0.387,
        shipSize: 'Freighter',
        systemEdges: turnurSystemEdges
    }

    eveScoutNodes.set(THERA_SYSTEM_ID, theraNode)
    eveScoutNodes.set(TURNUR_SYSTEM_ID, turnurNode)

    return eveScoutNodes
}
export async function getEveScoutNodes(): Promise<Map<SystemId, SystemNode>> {
    const { data } = await fetchEveScoutData()
    return mapEveScoutDataToNodes(data)
}
