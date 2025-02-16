import { NextApiResponse } from 'next'
import { SESSION_KEY } from '../../../const'
import {
    allTrigSignaturesForSystem,
    deleteAllSignaturesFromSystem,
    deleteTrigSignature,
    insertTrigSignatures
} from '../../../data/signatures'
import {
    ExtendedRequest,
    ExtendedSessionRequest,
    protectedHandler
} from '../../../middleware/request-handler'
import { PochvenSignatureInput } from '../../../types/sigs'

export default protectedHandler()
    .get<ExtendedSessionRequest, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session.character.level < 2) return res.status(403).end()
        const systemId = parseInt(req.query['systemId'] as string)
        const sigs = await allTrigSignaturesForSystem(systemId)
        res.status(200).json(sigs)
    })
    .delete<ExtendedRequest<PochvenSignatureInput>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session.character.level < 3) return res.status(403).end()
        const systemId = parseInt(req.query['systemId'] as string)
        Object.keys(req.body).length === 0
            ? await deleteAllSignaturesFromSystem(systemId)
            : await deleteTrigSignature(systemId, req.body)

        res.status(200).end()
    })
    .post<ExtendedRequest<PochvenSignatureInput[]>, NextApiResponse>(async (req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session.character.level < 3) return res.status(403).end()
        const systemId = parseInt(req.query['systemId'] as string)
        await insertTrigSignatures(systemId, req.body)
        res.status(200).end()
    })
