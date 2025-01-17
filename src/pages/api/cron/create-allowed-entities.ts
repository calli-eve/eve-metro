import { NextApiRequest, NextApiResponse } from 'next'

import { createAllowedEntities } from '../../../data/admin'
import { publicHandler } from '../../../middleware/request-handler'

export default publicHandler().get<NextApiRequest, NextApiResponse>(async (_, res) => {
    await createAllowedEntities()
    res.status(200).end()
})
