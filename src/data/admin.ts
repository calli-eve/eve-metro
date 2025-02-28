import knex from '../../knex/knex'
import { DateTime } from 'luxon'
import * as R from 'ramda'
import { AllowedEntity } from '../pages/api/admin/allowed'
import { Session } from '../types/types'
import {
    getAllWalletWatchers,
    insertPaymentsLogEntry,
    PaymentsLogEntry,
    setPaymentsProcessed,
    updateWalletWatcherSecret,
    updateWalletWatcherStatus
} from './wallet'
import { decryptSessionString, encryptSessionString } from '../utils'
import { sendCustomerLostEveMail, sendTopupEmailToUser } from './eveMailClient'
import { getWalletJournal, renewToken } from './esiClient'
import { MONTHLY_FEE } from '../const'

export const ALLOWED_ENTITY_TABLE = 'allowed_entity'

export const allAllowedEntities = (): Promise<AllowedEntity[]> => {
    return knex(ALLOWED_ENTITY_TABLE)
}

export const insertAllowedEntity = (allowedEntity: AllowedEntity): Promise<void> => {
    return knex(ALLOWED_ENTITY_TABLE)
        .insert({
            entity_id: allowedEntity.entity_id,
            level: allowedEntity.level,
            type: allowedEntity.type,
            valid_untill: allowedEntity.valid_untill
        })
        .onConflict('entity_id')
        .ignore()
}

export const insertAllowedEntityBatch = (
    allowedEntityBatch: AllowedEntity[]
): Promise<number[]> => {
    return knex(ALLOWED_ENTITY_TABLE)
        .insert(allowedEntityBatch)
        .returning('entity_id')
        .onConflict('entity_id')
        .ignore()
}

export const deleteAllowedEntity = (entity_id: number): Promise<void> => {
    return knex(ALLOWED_ENTITY_TABLE).where({ entity_id }).del()
}

export const findAllowedEntity = (session: Session): Promise<AllowedEntity[]> => {
    return knex(ALLOWED_ENTITY_TABLE)
        .where({ entity_id: session.character.CharacterID })
        .orWhere({ entity_id: session.character.corporation_id ?? 0 })
        .orWhere({ entity_id: session.character.alliance_id ?? 0 })
}

export const findMultipleAllowedEntities = (entity_id_list: number[]): Promise<AllowedEntity[]> => {
    return knex(ALLOWED_ENTITY_TABLE).whereIn('entity_id', entity_id_list)
}

export const updateExpiryForAllowedEntity = async (entity_id: number, valid_untill: string) => {
    return knex(ALLOWED_ENTITY_TABLE).where({ entity_id }).update({ valid_untill })
}

export const purgeExpiredEntities = async (): Promise<void> => {
    const dateNow = DateTime.utc().toSQL()
    const entriesToPurge: AllowedEntity[] = await knex(ALLOWED_ENTITY_TABLE).where(
        'valid_untill',
        '<',
        dateNow
    )
    if (entriesToPurge.length === 0) return
    for (const entry of entriesToPurge) {
        await sendCustomerLostEveMail(entry.entity_id)
    }
    return knex(ALLOWED_ENTITY_TABLE).where('valid_untill', '<', dateNow).del()
}

export const createAllowedEntities = async (): Promise<void> => {
    const walletWacherCharacters = await getAllWalletWatchers()
    for (let i = 0; i < walletWacherCharacters.length; i++) {
        const walletWacher = walletWacherCharacters[i]
        const session: Session = decryptSessionString(walletWacher.secret)
        try {
            const newSession = await renewSessionToken(session)
            await processOneWallet(newSession)
            await updateWalletWatcherStatus(
                session.character.CharacterID,
                `SUCCESS at ${DateTime.utc().toISO()}`
            )
        } catch (e) {
            console.log(e)
            await updateWalletWatcherStatus(
                session.character.CharacterID,
                `FAILED at ${DateTime.utc().toISO()}`
            )
        }
    }
}

const renewSessionToken = async (session: Session): Promise<Session> => {
    const renewedToken = await renewToken(session)
    const newSession: Session = {
        ...session,
        authorization: {
            ...session.authorization,
            access_token: renewedToken.data.access_token
        }
    }
    const encryptedSessionString = encryptSessionString(newSession)

    await updateWalletWatcherSecret(session.character.CharacterID, encryptedSessionString)
    return newSession
}

const processOneWallet = async (session: Session) => {
    const { pages, data } = await getWalletJournal(session, 1)
    const pagesToProcess: number[] = R.drop(2, [...Array(pages).keys()])
    const restOfThePages = (
        await Promise.all(
            pagesToProcess.map(async (page) => (await getWalletJournal(session, page)).data)
        )
    ).flat()
    const allPages = [...data, ...restOfThePages]
    const filteredWalletEntries = allPages.filter((j) => j.ref_type === 'player_donation')
    const paymentLogEntries: PaymentsLogEntry[] = filteredWalletEntries.map((j) => {
        return {
            id: j.id,
            receiving_id: session.character.CharacterID,
            paying_id: j.first_party_id,
            amount: j.amount,
            date: j.date,
            journal_entry: JSON.stringify(j),
            processed: true,
            processed_date: DateTime.utc().toSQL()
        }
    })

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
            .toSQL()
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
        const currentValidUntill = DateTime.fromJSDate(entity.valid_untill)
        const monthsToAdd = Math.floor(logEntry.amount / MONTHLY_FEE)
        
        console.log(`Processing payment for ${entity.entity_id}:`)
        console.log(`  Amount: ${logEntry.amount} ISK`)
        console.log(`  Current subscription valid until: ${currentValidUntill.toISO()}`)
        console.log(`  Adding ${monthsToAdd} months (${logEntry.amount} / ${MONTHLY_FEE})`)
        
        const newValidUntill =
            currentValidUntill < dateNow
                ? dateNow.plus({ months: monthsToAdd })
                : currentValidUntill.plus({ months: monthsToAdd })
                
        console.log(`  New subscription valid until: ${newValidUntill.toISO()}`)
        
        await updateExpiryForAllowedEntity(entity.entity_id, newValidUntill.toSQL())
        await setPaymentsProcessed([logEntry.id], DateTime.utc().toSQL())
        
        try {
            await sendTopupEmailToUser(entity.entity_id)
            console.log(`  Sent topup email to ${entity.entity_id}`)
        } catch (e) {
            console.log(`  Failed to send topup email to ${entity.entity_id}:`, e)
        }
    }
}