import { NextApiResponse } from 'next'
import { ExtendedRequest, adminHandler } from '../../../middleware/request-handler'
import { deleteTodo, listTodo, TodoItem } from '../../../data/todo'
import { insertAuditLogEvent } from '../../../data/audit'
import { SESSION_KEY } from '../../../const'
import { sendACLEmailToUser, sendCustomerLostEveMail } from '../../../data/eveMailClient'

export default adminHandler()
    .get<ExtendedRequest<void>, NextApiResponse>(async (req, res) => {
        const page = await listTodo()
        return res.status(200).json(page)
    })
    .delete<ExtendedRequest<TodoItem>, NextApiResponse>(async (req, res) => {
        const session = req.session.get(SESSION_KEY)
        await deleteTodo(req.body)
        if (req.body.action === 'remove') await sendCustomerLostEveMail(req.body)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'admin',
            action: 'delete_todo',
            user_id: session.character.CharacterID,
            meta: JSON.stringify(req.body)
        })

        return res.status(200).end()
    })
