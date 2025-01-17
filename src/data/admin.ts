import knex from '../../knex/knex'
import { DateTime } from 'luxon'
import * as R from 'ramda'
import { AllowedEntity } from '../pages/api/admin/allowed'
import { Session } from '../types/types'
import { insertTodo, TodoItem } from './todo'
import {
    getAllWalletWatchers,
    insertPaymentsLogEntry,
    PaymentsLogEntry,
    setPaymentsProcessed,
    updateWalletWatcherSecret,
    updateWalletWatcherStatus
} from './wallet'
import { decryptSessionString, encryptSessionString } from '../utils'
import { sendACLEmailToUser, sendTopupEmailToUser } from './eveMailClient'
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
    const todoInput: TodoItem[] = entriesToPurge.map((e) => {
        return {
            id: undefined,
            entity_id: e.entity_id,
            type: e.type,
            action: 'remove'
        }
    })
    await insertTodo(todoInput)
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

    const newLogEntryIds = await insertPaymentsLogEntry(paymentLogEntries)

    const newLogEntries = paymentLogEntries.filter((log) =>
        newLogEntryIds.some((id) => parseInt(id) === log.id)
    )

    const newEntriesOverMonthlyThreshold = newLogEntries.filter((p) => p.amount >= MONTHLY_FEE)
    if (newEntriesOverMonthlyThreshold.length === 0) return

    await processNewUsers(newEntriesOverMonthlyThreshold)
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
    const insertedEntries = await insertAllowedEntityBatch(allowedEntriesToInsert)

    if (insertedEntries.length > 0) {
        await insertTodo(
            insertedEntries.map((id) => {
                return {
                    id: undefined,
                    entity_id: id,
                    type: 'Character',
                    action: 'add'
                }
            })
        )
        for (const id in insertedEntries) {
            try {
                await sendACLEmailToUser(parseInt(id))
            } catch (e) {
                console.log(e)
                console.log('failed sending sending topup evemail')
            }
        }
        insertedEntries.forEach((entry) => {})
    }
}

const processExistingUsers = async (logEntries: PaymentsLogEntry[]): Promise<void> => {
    for (const i in logEntries) {
        const logEntry = logEntries[i]
        const currentEntryArray = await findMultipleAllowedEntities([logEntry.paying_id])
        if (currentEntryArray.length === 0) {
            console.log('payment processing failed', logEntry)
            return
        }
        const entity = currentEntryArray[0]
        const dateNow = DateTime.utc()
        const currentValidUntill = DateTime.fromJSDate(entity.valid_untill)
        const monthsToAdd = Math.floor(logEntry.amount / MONTHLY_FEE)
        const newValidUntill =
            currentValidUntill < dateNow
                ? dateNow.plus({ months: monthsToAdd })
                : currentValidUntill.plus({ months: monthsToAdd })
        await updateExpiryForAllowedEntity(entity.entity_id, newValidUntill.toSQL())
        await setPaymentsProcessed([logEntry.id], DateTime.utc().toSQL())
        try {
            sendTopupEmailToUser({
                id: undefined,
                entity_id: entity.entity_id,
                type: 'Character',
                action: 'add'
            })
        } catch (e) {
            console.log(e)
            console.log('failed sending sending topup evemail')
        }
    }
}
