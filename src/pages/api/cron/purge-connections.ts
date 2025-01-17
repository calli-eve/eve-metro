import { NextApiRequest, NextApiResponse } from 'next'
import { purgeOldConnections } from '../../../data/trig'
import { publicHandler } from '../../../middleware/request-handler'

export default publicHandler().get<NextApiRequest, NextApiResponse>(async (_, res) => {
    await purgeOldConnections()
    res.status(200).end()
})
