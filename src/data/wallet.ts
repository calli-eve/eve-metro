import { knex } from '../../knex/knex'
import { DateTime } from 'luxon'
import { startAndEndDateForPeriod } from '../utils'

import { countScannersForPeriod } from './stats'
import { MONTHLY_FEE } from '../const'
import { AllowedEntity } from '../pages/api/admin/allowed'
import { findMultipleAllowedEntities, insertAllowedEntityBatch, updateExpiryForAllowedEntity } from './admin'
import { sendTopupEmailToUser } from './eveMailClient'

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
): Promise<{id: string}[]> => {
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

export const insertWalletWatcher = (walletWathcer: WalletWathcerEntry) => {
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

export const processPaymentLogEntries = async (paymentLogEntries: PaymentsLogEntry[]): Promise<void> => {
    // Get IDs of entries that haven't been processed yet
    const unprocessedEntryIds: {id: string}[] = await insertPaymentsLogEntry(paymentLogEntries)
    console.log(`Inserted ${unprocessedEntryIds.length} new entries:`, unprocessedEntryIds)

    // Filter for entries that ARE in the unprocessed list
    const newLogEntries = paymentLogEntries.filter((log) => {
        const logIdString = log.id.toString()
        const isUnprocessed = unprocessedEntryIds.some(entry => entry.id === logIdString)
        return isUnprocessed
    })

    console.log(`Found ${paymentLogEntries.length} total donations, ${newLogEntries.length} are new`)

    const newEntriesOverMonthlyThreshold = newLogEntries.filter((p) => {
        const isOverThreshold = p.amount >= MONTHLY_FEE
        if (!isOverThreshold) {
            console.log(`Skipping payment ${p.id} from ${p.paying_id}: amount ${p.amount} below threshold ${MONTHLY_FEE}`)
        }
        return isOverThreshold
    })

    if (newEntriesOverMonthlyThreshold.length === 0) {
        console.log('No new payments over monthly threshold found')
        return
    }

    console.log(`Processing ${newEntriesOverMonthlyThreshold.length} payments over threshold`)

    // Process new users first
    await processNewUsers(newEntriesOverMonthlyThreshold)
    // Then process existing users
    await processExistingUsers(newEntriesOverMonthlyThreshold)
}

const processNewUsers = async (logEntries: PaymentsLogEntry[]): Promise<void> => {
    const allowedEntriesToInsert = logEntries.map((e) => {
        const untill = DateTime.utc()
            .plus({
                day: 7
            })
            .toSQL({ includeOffset: false });
        if (!untill) throw new Error('Failed to generate valid_until date');

        const allowedEntity: AllowedEntity = {
            type: 'Character',
            level: 2,
            entity_id: e.paying_id,
            valid_untill: untill
        }
        return allowedEntity
    })
    await insertAllowedEntityBatch(allowedEntriesToInsert)
}

const processExistingUsers = async (logEntries: PaymentsLogEntry[]): Promise<void> => {
    for (const i in logEntries) {
        const logEntry = logEntries[i]
        const currentEntryArray = await findMultipleAllowedEntities([logEntry.paying_id])
        if (currentEntryArray.length === 0) {
            console.log(`Payment processing skipped for ID ${logEntry.paying_id} - no existing entity found`, logEntry)
            continue
        }

        const entity = currentEntryArray[0]
        const dateNow = DateTime.utc()
        const monthsToAdd = Math.floor(logEntry.amount / MONTHLY_FEE)

        console.log(`Processing payment for ${entity.entity_id}:`)
        console.log(`  Amount: ${logEntry.amount} ISK`)
        console.log(`  Current subscription valid until: ${entity.valid_untill}`)
        console.log(`  Adding ${monthsToAdd} months (${logEntry.amount} / ${MONTHLY_FEE})`)

        // Handle case where valid_untill might be null, a Date object, or an ISO string
        // Note: Database returns timestamps as Date objects, but type definition says string
        let newValidUntill: DateTime
        if (!entity.valid_untill) {
            // No existing expiry, start from now
            newValidUntill = dateNow.plus({ months: monthsToAdd })
        } else {
            // Convert valid_untill to DateTime (handle both Date objects and ISO strings)
            const validUntillValue = entity.valid_untill as string | Date
            const currentValidUntill = validUntillValue instanceof Date
                ? DateTime.fromJSDate(validUntillValue)
                : DateTime.fromISO(validUntillValue)

            if (!currentValidUntill.isValid) {
                // Invalid date, start from now
                console.log(`  Warning: Invalid valid_untill date, starting from current date`)
                newValidUntill = dateNow.plus({ months: monthsToAdd })
            } else {
                // Valid date - extend from current date if expired, otherwise extend from expiry
                newValidUntill =
                    currentValidUntill < dateNow
                        ? dateNow.plus({ months: monthsToAdd })
                        : currentValidUntill.plus({ months: monthsToAdd })
            }
        }

        console.log(`  New subscription valid until: ${newValidUntill.toISO()}`)

        const newValidUntillSQL = newValidUntill.toSQL({ includeOffset: false });
        if (!newValidUntillSQL) throw new Error('Failed to generate new valid_until date');

        await updateExpiryForAllowedEntity(entity.entity_id, newValidUntillSQL)

        const processedDate = DateTime.utc().toSQL({ includeOffset: false });
        if (!processedDate) throw new Error('Failed to generate processed date');

        await setPaymentsProcessed([logEntry.id], processedDate)

        try {
            await sendTopupEmailToUser(entity.entity_id)
            console.log(`  Sent topup email to ${entity.entity_id}`)
        } catch (e) {
            console.log(`  Failed to send topup email to ${entity.entity_id}:`, e)
        }
    }
}
