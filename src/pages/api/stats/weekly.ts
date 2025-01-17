import { NextApiResponse } from 'next'
import { weeklyScanningSpread } from '../../../data/stats'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'

export default publicHandler().get<ExtendedRequest<unknown>, NextApiResponse>(async (req, res) => {
    const weekly = await weeklyScanningSpread()
    res.status(200).json(weekly)
})
