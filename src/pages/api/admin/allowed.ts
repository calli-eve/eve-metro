import { SESSION_KEY } from '../../../const'
import { NextApiResponse } from 'next'
import { ExtendedRequest, adminHandler } from '../../../middleware/request-handler'
import { allAllowedEntities, deleteAllowedEntity, insertAllowedEntity } from '../../../data/admin'
import { insertAuditLogEvent } from '../../../data/audit'

export type EntityType = 'Corporation' | 'Alliance' | 'Character'
export interface AllowedEntity {
    type: EntityType
    entity_id: number
    level: number
    valid_untill?: string
}

export default adminHandler()
    .get<ExtendedRequest<undefined>, NextApiResponse>(async (req, res) => {
        const session = req.session.get(SESSION_KEY)

        if (session === undefined) {
            return res.status(403).end()
        }
        const allowed = await allAllowedEntities()
        return res.status(200).json(allowed)
    })
    .post<ExtendedRequest<AllowedEntity>, NextApiResponse>(async (req, res) => {
        await insertAllowedEntity(req.body)
        const session = req.session.get(SESSION_KEY)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'admin',
            action: 'insert_allowed',
            user_id: session.character.CharacterID,
            meta: JSON.stringify(req.body)
        })
        res.status(200).end()
    })
    .delete<ExtendedRequest<AllowedEntity>, NextApiResponse>(async (req, res) => {
        const { entity_id } = req.body
        await deleteAllowedEntity(entity_id)
        const session = req.session.get(SESSION_KEY)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'admin',
            action: 'remove_allowed',
            user_id: session.character.CharacterID,
            meta: JSON.stringify(req.body)
        })
        res.status(200).end()
    })
