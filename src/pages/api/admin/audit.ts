import { NextApiResponse } from 'next'
import { ExtendedRequest, adminHandler } from '../../../middleware/request-handler'
import { getAuditLogsPage } from '../../../data/audit'

export default adminHandler().post<ExtendedRequest<{ page: number }>, NextApiResponse>(
    async (req, res) => {
        const page = await getAuditLogsPage(req.body.page)
        return res.status(200).json(page)
    }
)
