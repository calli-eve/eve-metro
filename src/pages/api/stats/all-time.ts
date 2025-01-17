import { NextApiResponse } from 'next'
import { SESSION_KEY } from '../../../const'
import { countAllTimeScanners } from '../../../data/stats'
import { ExtendedRequest, protectedHandler } from '../../../middleware/request-handler'

export default protectedHandler().get<ExtendedRequest<unknown>, NextApiResponse>(
    async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session.character.level < 3) return res.status(403).end()
        const allTime = await countAllTimeScanners()
        res.status(200).json(allTime)
    }
)
