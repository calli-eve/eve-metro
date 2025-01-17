import knex from '../../knex/knex'
import { DateTime } from 'luxon'
import { startAndEndDateForPeriod } from '../utils'

import { countScannersForPeriod } from './stats'

const PAYMENTS_LOG_TABLE = 'payments_log'

const WALLET_WATCHER_TABLE = 'wallet_watcher'

export interface PaymentsLogEntry {
    id: number
    receiving_id: number
    paying_id: number
    amount: number
    date: string
    journal_entry: string
    processed?: boolean
    processed_date?: string
}

export interface WalletWathcerEntry {
    character_id: number
    corp_id: number
    created_at?: string
    secret: string
    status?: string
}

export const insertPaymentsLogEntry = (
    paymentsLogEntries: PaymentsLogEntry[]
): Promise<string[]> => {
    return knex(PAYMENTS_LOG_TABLE).insert(paymentsLogEntries, 'id').onConflict('id').ignore()
}

export const getPaymentsLogsPage = (page): Promise<PaymentsLogEntry[]> => {
    return knex(PAYMENTS_LOG_TABLE)
        .limit(10)
        .offset(page * 10)
        .orderBy('date', 'desc')
}

export const setPaymentsProcessed = (paymentsIds: number[], date: string): Promise<void> => {
    return knex(PAYMENTS_LOG_TABLE).whereIn('id', paymentsIds).update({
        processed: true,
        processed_date: date
    })
}

export const getAllWalletWatchers = (): Promise<WalletWathcerEntry[]> => {
    return knex(WALLET_WATCHER_TABLE)
}

export const insertWalletWatcher = (walletWathcer: WalletWathcerEntry): Promise<void> => {
    return knex(WALLET_WATCHER_TABLE).insert(walletWathcer).onConflict('character_id').ignore()
}

export const deleteWalletWatcher = (character_id: number): Promise<void> => {
    return knex(WALLET_WATCHER_TABLE).where({ character_id }).returning('*').del()
}

export const updateWalletWatcherSecret = (character_id: number, secret: string): Promise<void> => {
    return knex(WALLET_WATCHER_TABLE).where({ character_id }).update({ secret })
}

export const updateWalletWatcherStatus = (character_id: number, status: string): Promise<void> => {
    return knex(WALLET_WATCHER_TABLE).where({ character_id }).update({ status })
}

export interface ScannerStatsWithSalary {
    user_id: number
    count: number
    salary: number
}

export interface SalaryData {
    periodIndex: number
    totalSalaries: number
    totalSigsScanned: number
    scansWithSalaries: ScannerStatsWithSalary[]
}

export const getSalariesForPeriod = async (periodIndex: number): Promise<SalaryData> => {
    const { startDateForPeriod, endDateForPeriod } = startAndEndDateForPeriod(periodIndex)
    const paymentsForThePeriod: PaymentsLogEntry[] = await knex(PAYMENTS_LOG_TABLE)
        .whereBetween('date', [startDateForPeriod, endDateForPeriod])
        .orderBy('date', 'desc')

    const scansForPeriod = await countScannersForPeriod(startDateForPeriod, endDateForPeriod)
    const totalIskForPeriod = paymentsForThePeriod.reduce((acc, current) => {
        return acc + current.amount
    }, 0)

    const totalSigsScanned = scansForPeriod.reduce((acc, scan) => {
        return acc + parseInt(scan.count)
    }, 0)
    return {
        periodIndex,
        totalSalaries: totalIskForPeriod,
        totalSigsScanned: totalSigsScanned,
        scansWithSalaries: scansForPeriod.map((scan) => {
            return {
                ...scan,
                count: parseInt(scan.count),
                salary: Math.floor((totalIskForPeriod / totalSigsScanned) * parseInt(scan.count))
            }
        })
    }
}
