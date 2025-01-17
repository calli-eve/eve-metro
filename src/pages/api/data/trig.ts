import * as R from 'ramda'
import { NextApiResponse } from 'next'
import * as crypto from 'crypto-js'
import {
    getTrigSystemColor,
    HIGHSEC_GREEN,
    JSPACE_BLUE,
    LOWSEC_YELLOW,
    NODE_POSITIONS,
    NULLSEC_RED,
    SESSION_KEY,
    TRIG_SYSTEM_IDS
} from '../../../const'
import { getAllConnections, getAllSystems, getSystemFromDatabase } from '../../../data/db'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'
import {
    HashedSystemId,
    PochvenConnectionInput,
    SystemId,
    TrigConnection
} from '../../../types/types'
import {
    allTrigConnections,
    deleteTrigConnection,
    getTrigConnectionById,
    insertTrigConnection,
    setTrigConnectionCritical,
    updateTrigConnection
} from '../../../data/trig'
import { insertAuditLogEvent } from '../../../data/audit'

const rootSystem = (systemId) => {
    return {
        ...NODE_POSITIONS[systemId],
        fixed: { x: true, y: true },
        physics: true,
        color: getTrigSystemColor(systemId)
    }
}

const hashExteranlSystemId = (realId: SystemId | HashedSystemId): string => {
    return crypto.SHA512(`${realId}`).toString(crypto.enc.Base64)
}

const processConnectionsToNodes = (
    whConnections: TrigConnection[],
    obfuscateOutput: boolean,
    filterOutPilots: boolean
) => {
    const grouped = R.groupBy(R.prop('externalSystemId'))(whConnections)
    return Object.keys(grouped)
        .filter((id) => !TRIG_SYSTEM_IDS.some((t) => t === parseInt(id)))
        .map((externalSystemId) => {
            const color = `${connectionTypeColor(grouped[externalSystemId])}F2`
            return {
                label: obfuscateOutput ? '' : grouped[externalSystemId][0].externalSystemName,
                id: obfuscateOutput
                    ? hashExteranlSystemId(grouped[externalSystemId][0].externalSystemId)
                    : grouped[externalSystemId][0].externalSystemId,
                color,
                physics: true,
                edges: obfuscateOutput
                    ? []
                    : filterOutPilotsIfCustomer(
                          grouped[externalSystemId].map((node) => {
                              return whConnections.find(
                                  (edge) =>
                                      edge.pochvenSystemId === node.pochvenSystemId &&
                                      edge.externalSystemId === node.externalSystemId
                              )
                          }),
                          filterOutPilots
                      )
            }
        })
}

const processConnectionsToEdges = (connection: TrigConnection, obfuscateOutput: boolean) => {
    return {
        from: obfuscateOutput
            ? hashExteranlSystemId(connection.externalSystemId)
            : connection.externalSystemId,
        to: connection.pochvenSystemId,
        ext: true
    }
}

const filterOutPilotsIfCustomer = (
    trigConnections: TrigConnection[],
    filterOut: boolean
): TrigConnection[] => {
    if (filterOut)
        return trigConnections.map((t) => {
            return {
                ...t,
                creator: undefined
            }
        })
    return trigConnections
}

export const connectionTypeColor = (trigConnection: TrigConnection[]) => {
    const connection = trigConnection[0]
    const { security } = getSystemFromDatabase(connection.externalSystemId)
    if (connection.externalSystemName.match(/J[0-9]{1,6}$/)) return JSPACE_BLUE
    if (security >= 0.45) return HIGHSEC_GREEN
    else if (security > 0.0 && security < 0.5) return LOWSEC_YELLOW
    else return NULLSEC_RED
}

export const getTrigGraph = async (obfuscateOutput: boolean, filterOutPilots: boolean) => {
    const whConnections = await allTrigConnections()

    const trigEdges = getAllConnections()
        .filter((edge) => {
            return TRIG_SYSTEM_IDS.some((id) => id === edge.fromSolarSystemID)
        })
        .map((edge) => {
            return {
                from: edge.fromSolarSystemID,
                to: edge.toSolarSystemID
            }
        })

    const trigNodes = getAllSystems()
        .filter((system) => {
            return TRIG_SYSTEM_IDS.some((id) => id === system.solarSystemId)
        })
        .map((node) => {
            return {
                label: node.solarSystemName,
                id: node.solarSystemId,
                ...rootSystem(node.solarSystemId),
                edges: obfuscateOutput
                    ? []
                    : filterOutPilotsIfCustomer(
                          whConnections.filter(
                              (edge) =>
                                  edge.pochvenSystemId === node.solarSystemId ||
                                  edge.externalSystemId === node.solarSystemId
                          ),
                          filterOutPilots
                      )
            }
        })
    return {
        nodes: [
            ...trigNodes,
            ...processConnectionsToNodes(whConnections, obfuscateOutput, filterOutPilots)
        ],
        edges: [
            ...trigEdges,
            ...whConnections.map((c) => processConnectionsToEdges(c, obfuscateOutput))
        ],
        connections: obfuscateOutput
            ? []
            : filterOutPilotsIfCustomer(whConnections, filterOutPilots)
    }
}

export default publicHandler()
    .get<ExtendedRequest<void>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        const obfuscateOutput = (session && session?.character?.level < 1) ?? true
        const filterOutPilots = (session && session?.character?.level < 3) ?? true
        const graph = await getTrigGraph(obfuscateOutput, filterOutPilots)
        res.status(200).json(graph)
    })
    .delete<ExtendedRequest<PochvenConnectionInput>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session?.character?.level < 3) return res.status(403).end()
        const { connectionId } = req.body
        const result = await deleteTrigConnection(connectionId)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'connections',
            action: 'delete_connection',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({ req: req.body, result })
        })
        res.status(200).end()
    })
    .post<ExtendedRequest<TrigConnection>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session?.character?.level < 3) return res.status(403).end()
        const result = await insertTrigConnection({
            ...req.body,
            creator: session.character.CharacterID
        })
        if (result === 'Already exists') return res.status(409).json({ error: 'Already exists' })
        const graph = await getTrigGraph(false, false)
        if (!graph.nodes.some((n) => n.id === req.body.pochvenSystemId)) {
            return res.status(406)
        }
        if (TRIG_SYSTEM_IDS.some((s) => s === req.body.pochvenSystemId))
            await insertAuditLogEvent({
                timestamp: undefined,
                type: 'connections',
                action: 'insert_connection',
                user_id: session.character.CharacterID,
                meta: JSON.stringify({ req: req.body })
            })
        res.status(200).end()
    })
    .put<ExtendedRequest<PochvenConnectionInput>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session?.character?.level < 3) return res.status(403).end()
        await setTrigConnectionCritical(req.body.connectionId)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'connections',
            action: 'set_to_crit',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({ id: req.body.connectionId })
        })
        return res.status(200).end()
    })
    .patch<ExtendedRequest<TrigConnection>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session?.character?.level < 3) return res.status(403).end()
        const connctionToUpdate = await getTrigConnectionById(req.body.id)
        await updateTrigConnection(req.body)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'connections',
            action: 'update_connection',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({ new: req.body, old: connctionToUpdate })
        })
        res.status(200).end()
    })
