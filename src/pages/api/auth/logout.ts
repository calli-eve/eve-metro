import { NextApiResponse } from 'next'
import { SESSION_KEY } from '../../../const'
import { insertAuditLogEvent } from '../../../data/audit'
import { revokeToken } from '../../../data/eveAuthClient'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'

export default publicHandler().post<ExtendedRequest<any>, NextApiResponse>(async (req, res) => {
    const session = req.session.get(SESSION_KEY)
    if (session === undefined) {
        req.session.destroy()
        res.status(200).end()
        return
    }

    await insertAuditLogEvent({
        timestamp: undefined,
        type: 'auth',
        action: 'logout',
        user_id: session.character.CharacterID,
        meta: JSON.stringify(session.character)
    })

    await revokeToken(session)
    req.session.destroy()
    res.status(200).end()
})
