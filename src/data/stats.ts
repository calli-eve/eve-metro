import { knex } from '../../knex/knex'
import { DateTime } from 'luxon'

const AUDIT_LOG_TABLE = 'audit_log'

export interface ScannerStats {
    user_id: number
    count: string
}

export interface ScanningSpread { 
    value: number
    count: number
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

export const totalScanned = (): Promise<number> => {
    return knex(AUDIT_LOG_TABLE).count('timestamp as total').first().then((result) => {
        return parseInt(result.total as string)
    })
}

type RawSpreadResult = {
    value: string;
    count: string;
}

export const weeklyScanningSpread = async (): Promise<ScanningSpread[]> => {
    const results: RawSpreadResult[] = await knex(AUDIT_LOG_TABLE)
        .select(knex.raw('CAST(extract(ISODOW from timestamp) AS text) as value, CAST(count(timestamp) AS text) as count'))
        .where('timestamp', '>', DateTime.now().minus({ months: 1 }).toISO())
        .whereIn('action', ['insert_connection'])
        .groupBy(knex.raw('extract(ISODOW from timestamp)'))
        .orderBy('value')

    return results.map((row) => ({
        value: parseInt(row.value),
        count: parseInt(row.count)
    }))
}

export const dailyScanningSpread = async (): Promise<ScanningSpread[]> => {
    const results: RawSpreadResult[] = await knex(AUDIT_LOG_TABLE)
        .select(knex.raw('CAST(extract(HOUR from timestamp) AS text) as value, CAST(count(timestamp) AS text) as count'))
        .where('timestamp', '>', DateTime.now().minus({ months: 1 }).toISO())
        .whereIn('action', ['insert_connection'])
        .groupBy(knex.raw('extract(HOUR from timestamp)'))
        .orderBy('value')

    return results.map((row) => ({
        value: parseInt(row.value),
        count: parseInt(row.count)
    }))
}
