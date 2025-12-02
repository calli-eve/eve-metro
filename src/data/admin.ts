import { knex } from '../../knex/knex'
import { DateTime } from 'luxon'
import * as R from 'ramda'
import { AllowedEntity } from '../pages/api/admin/allowed'
import { Session } from '../types/types'
import {
    getAllWalletWatchers,
    PaymentsLogEntry,
    processPaymentLogEntries,
    updateWalletWatcherSecret,
    updateWalletWatcherStatus
} from './wallet'
import { decryptSessionString, encryptSessionString } from '../utils'
import { sendCustomerLostEveMail, sendTopupEmailToUser } from './eveMailClient'
import { getWalletJournal, renewToken } from './esiClient'

export const ALLOWED_ENTITY_TABLE = 'allowed_entity'

export const allAllowedEntities = (): Promise<AllowedEntity[]> => {
    return knex(ALLOWED_ENTITY_TABLE)
}

export const insertAllowedEntity = (allowedEntity: AllowedEntity) => {
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
    if (allowedEntityBatch.length === 0) {
        return Promise.resolve([])
    }
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
    await processPaymentLogEntries(paymentLogEntries)
}