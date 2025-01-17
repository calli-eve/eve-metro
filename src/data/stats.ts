import knex from '../../knex/knex'
import { DateTime } from 'luxon'

const AUDIT_LOG_TABLE = 'audit_log'

export interface ScannerStats {
    user_id: number
    count: string
}

export const countAllTimeScanners = (): Promise<ScannerStats[]> => {
    return knex(AUDIT_LOG_TABLE)
        .select('user_id')
        .count('user_id')
        .where({ action: 'insert_connection' })
        .groupBy('user_id')
        .orderBy('count', 'desc')
}

export const countScannersForPeriod = (
    startDate: string,
    endDate: string
): Promise<ScannerStats[]> => {
    return knex(AUDIT_LOG_TABLE)
        .select('user_id')
        .count('user_id')
        .where({ action: 'insert_connection' })
        .whereBetween('timestamp', [startDate, endDate])
        .groupBy('user_id')
        .orderBy('count', 'desc')
}

export const totalScanned = (): Promise<ScannerStats[]> => {
    return knex(AUDIT_LOG_TABLE).count('timestamp as total').first()
}

export const weeklyScanningSpread = (): Promise<ScannerStats[]> => {
    return knex(AUDIT_LOG_TABLE)
        .select(knex.raw('extract(ISODOW from timestamp) as value, count(timestamp)'))
        .where('timestamp', '>', DateTime.now().minus({ months: 1 }).toISO())
        .whereIn('action', ['insert_connection', 'delete_connection'])
        .groupBy('value')
        .orderBy('value')
}

export const dailyScanningSpread = (): Promise<ScannerStats[]> => {
    return knex(AUDIT_LOG_TABLE)
        .select(knex.raw('extract(HOUR from timestamp) as value, count(timestamp)'))
        .where('timestamp', '>', DateTime.now().minus({ months: 1 }).toISO())
        .whereIn('action', ['insert_connection', 'delete_connection'])
        .groupBy('value')
        .orderBy('value')
}
