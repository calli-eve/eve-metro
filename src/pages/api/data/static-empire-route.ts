import { NextApiResponse } from 'next'
import {
    ELIGIBLE_POCHVEN_C729_SYSTEMS,
    SESSION_KEY
} from '../../../const'
import { ExtendedRequest, ExtendedSessionRequest, protectedHandler } from '../../../middleware/request-handler'
import { allTrigSignaturesForSystem } from '../../../data/signatures'

export default protectedHandler()
    .post<ExtendedRequest<{ systemName: string; }>, NextApiResponse>((req, res) => {
        const session = req.session?.get(SESSION_KEY)
        if (session.character.level < 2) return res.status(403).end()
        const systemName = req.body['systemName'];
        const systemConnectionPossibilities = ELIGIBLE_POCHVEN_C729_SYSTEMS[systemName];

        if (systemConnectionPossibilities === undefined) res.status(404).end()
        else res.status(200).json(systemConnectionPossibilities);
    })