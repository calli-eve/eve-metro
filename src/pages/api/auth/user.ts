import { NextApiResponse } from 'next'
import { SESSION_KEY } from '../../../const'
import { findAllowedEntity } from '../../../data/admin'
import { getCharacter } from '../../../data/eveAuthClient'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'
import { Session } from '../../../types/types'
import { AllowedEntity } from '../admin/allowed'

const ADMIN_CHARACTER_IDS = JSON.parse(process.env.ADMIN_CHARACTER_IDS)

export const maxEntityLevel = (allowedEntity: AllowedEntity[]) =>
    allowedEntity.length > 0 ? Math.max(...allowedEntity.map((a) => a.level)) : 0

export default publicHandler().post<ExtendedRequest<void>, NextApiResponse>(async (req, res) => {
    const session = req.session.get(SESSION_KEY)
    if (!session) return res.status(403).end()
    const characterResponse = await getCharacter(session.character.CharacterID)
    const allowedEntity = await findAllowedEntity(session)
    const newSession: Session = {
        character: {
            CharacterID: session.character.CharacterID,
            CharacterName: characterResponse.data.name,
            corporation_id: characterResponse.data.corporation_id,
            alliance_id: characterResponse.data.alliance_id,
            admin: ADMIN_CHARACTER_IDS.some((userId) => userId === session.character.CharacterID),
            level: maxEntityLevel(allowedEntity),
            subUntill: allowedEntity.find((a) => a.type === 'Character')?.valid_untill
        },
        authorization: {
            ...session.authorization
        }
    }

    req.session.set(SESSION_KEY, newSession)
    await req.session.save()

    return res.status(200).json(newSession.character)
})
