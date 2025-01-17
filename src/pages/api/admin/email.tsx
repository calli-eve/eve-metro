import { NextApiResponse } from 'next'
import * as R from 'ramda'

import { SESSION_KEY } from '../../../const'
import { insertAuditLogEvent } from '../../../data/audit'
import { deleteEmailBot, EmailBotEntry, getEmailBot, insertEmailBot } from '../../../data/email'
import { ExtendedRequest, adminHandler } from '../../../middleware/request-handler'
import { encryptSessionString } from '../../../utils'

export default adminHandler()
    .get<ExtendedRequest<void>, NextApiResponse>(async (req, res) => {
        const emailBot = await getEmailBot()
        const secretsOmmitted = emailBot.map((w) => R.omit(['secret'], w))
        return res.status(200).json(secretsOmmitted)
    })
    .post<ExtendedRequest<void>, NextApiResponse>(async (req, res) => {
        const session = req.session.get(SESSION_KEY)
        const emailBot: EmailBotEntry = {
            character_id: session.character.CharacterID,
            secret: encryptSessionString(session)
        }
        await insertEmailBot(emailBot)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'admin',
            action: 'enable_email_bot',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({
                req: req.body,
                inserted: { ...emailBot, secret: undefined }
            })
        })
        return res.status(200).end()
    })
    .delete<ExtendedRequest<EmailBotEntry[]>, NextApiResponse>(async (req, res) => {
        const session = req.session.get(SESSION_KEY)
        const deleted = await deleteEmailBot()
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'admin',
            action: 'disable_email_bot',
            user_id: session.character.CharacterID,
            meta: JSON.stringify({ req: req.body, deleted: { ...deleted[0], secret: undefined } })
        })
        return res.status(200).end()
    })
