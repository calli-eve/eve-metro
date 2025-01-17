import knex from '../../knex/knex'

const EMAIL_BOT_TABLE = 'email_bot'

export interface EmailBotEntry {
    character_id: number
    created_at?: string
    secret: string
    status?: string
}

export const insertEmailBot = (emailBot: EmailBotEntry): Promise<void> => {
    return knex(EMAIL_BOT_TABLE).insert(emailBot).onConflict('character_id').ignore()
}

export const getEmailBot = (): Promise<EmailBotEntry[]> => {
    return knex(EMAIL_BOT_TABLE)
}

export const deleteEmailBot = (): Promise<EmailBotEntry[]> => {
    return knex(EMAIL_BOT_TABLE).del()
}

export const updateEmailBotSecret = (character_id: number, secret: string): Promise<void> => {
    return knex(EMAIL_BOT_TABLE).where({ character_id }).update({ secret })
}

export const updateEmailBotStatus = (character_id: number, status: string): Promise<void> => {
    return knex(EMAIL_BOT_TABLE).where({ character_id }).update({ status })
}
