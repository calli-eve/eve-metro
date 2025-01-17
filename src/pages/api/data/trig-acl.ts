import { NextApiResponse } from 'next'
import { SESSION_KEY } from '../../../const'
import { insertAuditLogEvent } from '../../../data/audit'
import { sendACLEmailToUser, sendCustomerLostEveMail } from '../../../data/eveMailClient'
import { deleteTodo, TodoItem } from '../../../data/todo'
import { ExtendedRequest, publicHandler } from '../../../middleware/request-handler'
import { decryptJSONString } from '../../../utils'

export default publicHandler().get<ExtendedRequest<unknown>, NextApiResponse>(async (req, res) => {
    try {
        const { id } = req.query
        const session = req.session.get(SESSION_KEY)
        if (!session || !session.character || session.character.level < 3)
            return res.status(403).send('must be logged in =(')
        const decrypted = decryptJSONString<TodoItem>(id as string)
        await deleteTodo(decrypted)
        if (decrypted.action === 'remove') await sendCustomerLostEveMail(decrypted)
        await insertAuditLogEvent({
            timestamp: undefined,
            type: 'admin',
            action: 'delete_todo',
            user_id: session.character.CharacterID,
            meta: JSON.stringify(req.body)
        })
        res.status(200).send(`${decrypted.action}: ${decrypted.entity_name} done!`)
    } catch (e) {
        console.log(e)
        res.status(400).send('FAILED!')
    }
})
