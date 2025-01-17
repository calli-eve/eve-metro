import { NextApiResponse } from 'next'
import { SESSION_KEY } from '../../../const'
import { insertAuditLogEvent } from '../../../data/audit'
import { resetExpired, setExpired } from '../../../data/trig'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'
import { TrigConnection } from '../../../types/types'

export default publicHandler()
    .post<ExtendedRequest<TrigConnection>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session?.character?.level < 1) return res.status(403).end()
        const updated = await setExpired(
            {
                ...req.body
            },
            session.character.CharacterID
        )
        if (!updated) return res.status(409).end()
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'connections',
            action: 'report_expired',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({ req: req.body })
        })
        res.status(200).end()
    })
    .delete<ExtendedRequest<TrigConnection>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session?.character?.level < 3) return res.status(403).end()
        await resetExpired({
            ...req.body
        })
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'connections',
            action: 'reset_expired',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({ req: req.body })
        })
        res.status(200).end()
    })
