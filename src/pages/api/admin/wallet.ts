import { NextApiResponse } from 'next'
import * as R from 'ramda'

import { SESSION_KEY } from '../../../const'
import { insertAuditLogEvent } from '../../../data/audit'
import {
    deleteWalletWatcher,
    getAllWalletWatchers,
    insertWalletWatcher,
    WalletWathcerEntry
} from '../../../data/wallet'
import { ExtendedRequest, adminHandler } from '../../../middleware/request-handler'
import { encryptSessionString } from '../../../utils'

export default adminHandler()
    .get<ExtendedRequest<void>, NextApiResponse>(async (req, res) => {
        const watchers = await getAllWalletWatchers()
        const secretsOmmitted = watchers.map((w) => R.omit(['secret'], w))
        return res.status(200).json(secretsOmmitted)
    })
    .post<ExtendedRequest<void>, NextApiResponse>(async (req, res) => {
        const session = req.session.get(SESSION_KEY)
        const walletWatcher: WalletWathcerEntry = {
            character_id: session.character.CharacterID,
            corp_id: session.character.corporation_id,
            secret: encryptSessionString(session)
        }
        await insertWalletWatcher(walletWatcher)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'admin',
            action: 'set_wallet_watcher',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({
                req: req.body,
                inserted: { ...walletWatcher, secret: undefined }
            })
        })
        return res.status(200).end()
    })
    .delete<ExtendedRequest<WalletWathcerEntry>, NextApiResponse>(async (req, res) => {
        const session = req.session.get(SESSION_KEY)
        const deleted = await deleteWalletWatcher(req.body.character_id)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'admin',
            action: 'delete_wallet_watcher',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({ req: req.body, deleted: { ...deleted[0], secret: undefined } })
        })
        return res.status(200).end()
    })
