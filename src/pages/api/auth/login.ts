import { exchangeCodeForToken, verifyToken, getCharacter } from '../../../data/eveAuthClient'
import { NextApiResponse } from 'next'
import { Session } from '../../../types/types'
import { SESSION_KEY } from '../../../const'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'
import { findAllowedEntity } from '../../../data/admin'
import { insertAuditLogEvent } from '../../../data/audit'
import { maxEntityLevel } from './user'

const ADMIN_CHARACTER_IDS = JSON.parse(process.env.ADMIN_CHARACTER_IDS)

export default publicHandler().post<ExtendedRequest<{ code: string }>, NextApiResponse>(
    async (req, res) => {
        const code: string = req.body.code
        const tokenResponse = await exchangeCodeForToken(code)
        const verificationResponse = await verifyToken(tokenResponse.data)
        const characterResponse = await getCharacter(verificationResponse.data.CharacterID)

        const session: Session = {
            character: {
                CharacterID: verificationResponse.data.CharacterID,
                CharacterName: verificationResponse.data.CharacterName,
                corporation_id: characterResponse.data.corporation_id,
                alliance_id: characterResponse.data.alliance_id,
                admin: ADMIN_CHARACTER_IDS.some(
                    (userId) => userId === verificationResponse.data.CharacterID
                ),
                level: 0
            },
            authorization: tokenResponse.data
        }

        const allowedEntity = await findAllowedEntity(session)

        const authorizedSession: Session = {
            ...session,
            character: {
                ...session.character,
                level: maxEntityLevel(allowedEntity),
                subUntill: allowedEntity.find((a) => a.type === 'Character')?.valid_untill
            }
        }

        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'auth',
            action: 'login',
            user_id: session.character.CharacterID,
            meta: JSON.stringify(session.character)
        })

        req.session.set(SESSION_KEY, authorizedSession)
        await req.session.save()
        res.status(200).json(characterResponse.data)
    }
)
