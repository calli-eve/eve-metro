import { NextApiResponse } from 'next'
import { SESSION_KEY } from '../../../const'
import { getSalariesForPeriod } from '../../../data/wallet'
import { ExtendedRequest, protectedHandler } from '../../../middleware/request-handler'

export default protectedHandler().post<
    ExtendedRequest<{ selectedPeriod: number }>,
    NextApiResponse
>(async (req, res) => {
    const session = req.session?.get(SESSION_KEY)
    if (session.character.level < 3) return res.status(403).end()
    const period = req.body.selectedPeriod
    const allTime = await getSalariesForPeriod(period)
    res.status(200).json(allTime)
})
