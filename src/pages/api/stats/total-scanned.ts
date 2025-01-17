import { NextApiResponse } from 'next'
import { totalScanned } from '../../../data/stats'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'

export default publicHandler().get<ExtendedRequest<unknown>, NextApiResponse>(async (req, res) => {
    const total = await totalScanned()
    res.status(200).json(total)
})
