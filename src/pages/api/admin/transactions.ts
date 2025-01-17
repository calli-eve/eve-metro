import { NextApiResponse } from 'next'
import { getPaymentsLogsPage } from '../../../data/wallet'
import { ExtendedRequest, adminHandler } from '../../../middleware/request-handler'

export default adminHandler().post<ExtendedRequest<{ page: number }>, NextApiResponse>(
    async (req, res) => {
        const page = await getPaymentsLogsPage(req.body.page)
        return res.status(200).json(page)
    }
)
