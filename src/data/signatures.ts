import { DateTime } from 'luxon'
import { knex } from '../../knex/knex'
import { PochvenSignatureInput, PochvenSignatureOutput } from '../types/sigs'

const TRIG_SIGNATURES_TABLE = 'trig_signatures'

export const allTrigSignatures = (): Promise<PochvenSignatureOutput[]> => {
    return knex(TRIG_SIGNATURES_TABLE)
}

export const allTrigSignaturesForSystem = (systemId: number): Promise<PochvenSignatureOutput[]> => {
    return knex(TRIG_SIGNATURES_TABLE).where({ systemId })
}

export const insertTrigSignatures = async (
    systemId: number,
    trigSignatures: PochvenSignatureInput[]
): Promise<void> => {
    const oldSigs = await allTrigSignaturesForSystem(systemId)
    const newSigs = trigSignatures.filter((i) => !oldSigs.some((o) => o.sig === i.sig))
    const expiredSigs = oldSigs.filter((i) => !trigSignatures.some((o) => o.sig === i.sig))
    await deleteSignatureBatch(systemId, expiredSigs)
    return knex(TRIG_SIGNATURES_TABLE).insert(
        newSigs.map((t) => {
            return {
                ...t,
                createdTime: DateTime.utc().toSQL(),
                systemId
            }
        })
    )
}

export const deleteAllSignaturesFromSystem = (systemId: number): Promise<void> => {
    return knex(TRIG_SIGNATURES_TABLE).where({ systemId }).del()
}

export const deleteSignatureBatch = (
    systemId: number,
    trigSignatures: PochvenSignatureInput[]
): Promise<void> => {
    return knex(TRIG_SIGNATURES_TABLE)
        .where({ systemId })
        .whereIn(
            'sig',
            trigSignatures.map((s) => s.sig)
        )
        .del()
}

export const deleteTrigSignature = (
    systemId: number,
    signature: PochvenSignatureInput
): Promise<void> => {
    return knex(TRIG_SIGNATURES_TABLE).where({ systemId }).where({ sig: signature.sig }).del()
}
