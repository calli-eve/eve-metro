import { NextApiResponse } from 'next'
import { ExtendedRequest, adminHandler } from '../../../middleware/request-handler'

export default adminHandler().get<ExtendedRequest<undefined>, NextApiResponse>(async (req, res) => {
    const ADMIN_CHARACTER_IDS = JSON.parse(process.env.ADMIN_CHARACTER_IDS)
    return res.status(200).json(ADMIN_CHARACTER_IDS)
})
