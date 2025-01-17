import { NextApiRequest, NextApiResponse } from 'next'
import { getSov } from '../../../data/esiClient'
import cache from '../../../middleware/cache'
import { publicHandler } from '../../../middleware/request-handler'

export default publicHandler()
    .use(cache('60 minutes'))
    .get<NextApiRequest, NextApiResponse>(async (_, res) => {
        const sov = await getSov()
        res.status(200).json(sov)
    })
