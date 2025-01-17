import { DateTime } from 'luxon'
import knex from '../../knex/knex'
import { TrigConnection } from '../types/types'

const TRIG_CONNECTIONS_TABLE = 'trig_connections'

export const allTrigConnections = (): Promise<TrigConnection[]> => {
    return knex(TRIG_CONNECTIONS_TABLE)
}

export const getTrigConnectionById = (id): Promise<TrigConnection[]> => {
    return knex(TRIG_CONNECTIONS_TABLE).where({ id })
}

export const insertTrigConnection = async (
    trigConnection: TrigConnection
): Promise<string | void> => {
    const currentConnectionsInSystem: TrigConnection[] = await knex(TRIG_CONNECTIONS_TABLE).where({
        pochvenSystemId: trigConnection.pochvenSystemId
    })
    if (
        currentConnectionsInSystem.some(
            (t) => t.pochvenSignature === trigConnection.pochvenSignature
        )
    )
        return 'Already exists'
    const trigConnectionWithTimeCrit = {
        ...trigConnection,
        timeCriticalTime: trigConnection.timeCritical ? DateTime.utc().toSQL() : knex.raw('NULL')
    }

    return knex(TRIG_CONNECTIONS_TABLE).insert(trigConnectionWithTimeCrit)
}

export const deleteTrigConnection = (connectionId: number): Promise<TrigConnection[]> => {
    return knex(TRIG_CONNECTIONS_TABLE).where({ id: connectionId }).returning('*').del()
}

export const setTrigConnectionCritical = (id: number): Promise<TrigConnection[]> => {
    return knex(TRIG_CONNECTIONS_TABLE).where({ id }).update({
        timeCriticalTime: DateTime.utc().toSQL(),
        timeCritical: true,
        updated_at: DateTime.utc().toSQL()
    })
}

export const updateTrigConnection = (trigConnection: TrigConnection): Promise<TrigConnection[]> => {
    return knex(TRIG_CONNECTIONS_TABLE)
        .where({ id: trigConnection.id })
        .update({
            pochvenSystemName: trigConnection.pochvenSystemName,
            pochvenSystemId: trigConnection.pochvenSystemId,
            pochvenWormholeType: trigConnection.pochvenWormholeType,
            pochvenSignature: trigConnection.pochvenSignature,
            externalSystemName: trigConnection.externalSystemName,
            externalSystemId: trigConnection.externalSystemId,
            externalWormholeType: trigConnection.externalWormholeType,
            externalSignature: trigConnection.externalSignature,
            massCritical: trigConnection.massCritical,
            timeCritical: trigConnection.timeCritical,
            timeCriticalTime: trigConnection.timeCritical
                ? DateTime.utc().toSQL()
                : knex.raw('NULL'),
            comment: trigConnection.comment,
            updated_at: DateTime.utc().toSQL()
        })
}

export const setLastSeen = (trigConnection: TrigConnection): Promise<TrigConnection[]> => {
    return knex(TRIG_CONNECTIONS_TABLE).where({ id: trigConnection.id }).update({
        last_seen: DateTime.utc().toSQL()
    })
}

export const setExpired = async (
    trigConnection: TrigConnection,
    userId: number
): Promise<boolean> => {
    const newExpiredReport = {
        userId,
        time: DateTime.utc().toSQL()
    }
    const connectionToUpdate = await knex(TRIG_CONNECTIONS_TABLE).where({ id: trigConnection.id })
    const expiredReports = connectionToUpdate[0].already_expired_reports ?? []
    if (expiredReports.some((r) => r.userId === userId)) return false
    await knex(TRIG_CONNECTIONS_TABLE)
        .where({ id: trigConnection.id })
        .update({
            already_expired_reports: JSON.stringify([...expiredReports, newExpiredReport])
        })
    return true
}

export const resetExpired = async (trigConnection: TrigConnection): Promise<boolean> => {
    await knex(TRIG_CONNECTIONS_TABLE).where({ id: trigConnection.id }).update({
        already_expired_reports: null
    })
    return true
}

export const purgeOldConnections = async (): Promise<void> => {
    const dateNowShort = DateTime.utc().minus({ hours: 11, minutes: 30 }).toSQL()
    const dateNowNormal = DateTime.utc().minus({ hours: 15, minutes: 30 }).toSQL()
    const dateNowCritical = DateTime.utc().minus({ hours: 3 }).toSQL()

    return knex(TRIG_CONNECTIONS_TABLE)
        .where('createdTime', '<', dateNowNormal)
        .orWhere('timeCriticalTime', '<', dateNowCritical)
        .orWhere((builder) => {
            builder.where('createdTime', '<', dateNowShort).andWhere('externalWormholeType', 'C729')
        })
        .orWhere((builder) => {
            builder.where('createdTime', '<', dateNowShort).andWhere('pochvenWormholeType', 'C729')
        })
        .del()
}
