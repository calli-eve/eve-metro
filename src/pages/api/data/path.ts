import { NextApiResponse } from 'next'
import { SESSION_KEY } from '../../../const'
import { insertAuditLogEvent } from '../../../data/audit'
import { ExtendedRequest, protectedHandler } from '../../../middleware/request-handler'
import { calculateRoute, CalculateRouteInput } from '../../../pathfinder/pathfinder'

export default protectedHandler().post<ExtendedRequest<CalculateRouteInput>, NextApiResponse>(
    async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session.character.level < 2) return res.status(403).end()
        const result = await calculateRoute(req.body)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'path',
            action: 'calculate_route',
            user_id: session.character.CharacterID,
            meta: JSON.stringify(req.body)
        })
        res.status(200).json(result)
    }
)
