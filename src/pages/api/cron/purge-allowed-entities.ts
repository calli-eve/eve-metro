import { NextApiRequest, NextApiResponse } from 'next'
import { purgeExpiredEntities } from '../../../data/admin'
import { publicHandler } from '../../../middleware/request-handler'

export default publicHandler().get<NextApiRequest, NextApiResponse>(async (_, res) => {
    await purgeExpiredEntities()
    res.status(200).end()
})
