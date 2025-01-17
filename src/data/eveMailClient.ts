import { Session } from '../types/types'
import { decryptSessionString, encryptSessionString } from '../utils'
import { findMultipleAllowedEntities } from './admin'
import { getEmailBot, updateEmailBotSecret, updateEmailBotStatus } from './email'
import { EmailRequest, getCharacter, renewToken, sendEveMail } from './esiClient'
import { TodoItem } from './todo'
import { DateTime } from 'luxon'

export const sendACLEmailToUser = async (entity_id: number) => {
    if (
        process.env.ENVIRONMENT === 'development' &&
        entity_id !== parseInt(process.env.NEXT_PUBLIC_EVE_MAIL_TEST_CHARACTER_ID)
    ) {
        console.log('not callis test char. dont send mails in dev')
        return
    }

    const bots = await getEmailBot()
    if (bots.length > 0) {
        const botSession: Session = decryptSessionString(bots[0].secret)
        try {
            const newBotSession = await renewSessionToken(botSession)
            const allowedEntity = await findMultipleAllowedEntities([entity_id])
            const char = await getCharacter(entity_id)
            const mailToSend: EmailRequest = {
                subject: 'EVE Metro bookmark permissions activated',
                sender_character_id: bots[0].character_id,
                access_token: newBotSession.authorization.access_token,
                recepient_character_id: entity_id,
                body: `Welcome to EVE Metro ${
                    char ? char.name : ''
                }. Access the map via https://evemetro.com and your ACL rights have been updated. You now have access to the EVE Metro bookmark folder thru ${DateTime.fromJSDate(
                    allowedEntity[0].valid_untill
                ).toISODate()}. Click and Connect to <font size="14" color="#ff00a99d"><a href="bookmarkFolder:9495965">EVE Metro Bookmarks</a></font>.

Best Regards,
EVE Metro team
              `
            }
            await sendEveMail(mailToSend)
            await updateEmailBotStatus(
                botSession.character.CharacterID,
                `SUCCESS at ${DateTime.utc().toISO()}`
            )
        } catch (e) {
            console.log(e)
            await updateEmailBotStatus(
                botSession.character.CharacterID,
                `FAILED at ${DateTime.utc().toISO()}`
            )
        }
    }
}

export const sendCustomerLostEveMail = async (todo: TodoItem) => {
    if (
        process.env.ENVIRONMENT === 'development' &&
        todo.entity_id !== parseInt(process.env.NEXT_PUBLIC_EVE_MAIL_TEST_CHARACTER_ID)
    ) {
        console.log('not callis test char. dont send mails in dev')
        return
    }

    const bots = await getEmailBot()
    if (bots.length > 0) {
        const botSession: Session = decryptSessionString(bots[0].secret)
        try {
            const newBotSession = await renewSessionToken(botSession)
            const char = await getCharacter(todo.entity_id)
            const mailToSend: EmailRequest = {
                subject: 'EVE Metro subscription deactivated',
                sender_character_id: bots[0].character_id,
                access_token: newBotSession.authorization.access_token,
                recepient_character_id: todo.entity_id,
                body: `Hello ${
                    char ? char.name : ''
                }. Thank You for supporting EVE Metro project! Your subscription to the service has ended. We hope to see you in the future again!


You can reactivate your subscription again for a month by transferring 50mil subscription fee to <font size="14" color="#ffd98d00"><a href="showinfo:2//98684333">EVE Metro Corporation</a></font>.

Best Regards,
EVE Metro team
            `
            }
            await sendEveMail(mailToSend)
            await updateEmailBotStatus(
                botSession.character.CharacterID,
                `SUCCESS at ${DateTime.utc().toISO()}`
            )
        } catch (e) {
            console.log(e)
            await updateEmailBotStatus(
                botSession.character.CharacterID,
                `FAILED at ${DateTime.utc().toISO()}`
            )
        }
    }
}

export const sendTopupEmailToUser = async (todo: TodoItem) => {
    if (
        process.env.ENVIRONMENT === 'development' &&
        todo.entity_id !== parseInt(process.env.NEXT_PUBLIC_EVE_MAIL_TEST_CHARACTER_ID)
    ) {
        console.log('not callis test char. dont send mails in dev')
        return
    }

    const bots = await getEmailBot()
    if (bots.length > 0) {
        const botSession: Session = decryptSessionString(bots[0].secret)
        try {
            const newBotSession = await renewSessionToken(botSession)
            const allowedEntity = await findMultipleAllowedEntities([todo.entity_id])
            const char = await getCharacter(todo.entity_id)
            const mailToSend: EmailRequest = {
                subject: 'EVE Metro subscription extended',
                sender_character_id: bots[0].character_id,
                access_token: newBotSession.authorization.access_token,
                recepient_character_id: todo.entity_id,
                body: `Thank you for using EVE Metro ${
                    char ? char.name : ''
                }. Thank You for supporting EVE Metro project! Your payment has been processed. Access to https://evemetro.com has been granted and is now valid thru ${DateTime.fromJSDate(
                    allowedEntity[0].valid_untill
                ).toISODate()}.

Best Regards,
EVE Metro team
          `
            }
            await sendEveMail(mailToSend)
            await updateEmailBotStatus(
                botSession.character.CharacterID,
                `SUCCESS at ${DateTime.utc().toISO()}`
            )
        } catch (e) {
            console.log(e)
            await updateEmailBotStatus(
                botSession.character.CharacterID,
                `FAILED at ${DateTime.utc().toISO()}`
            )
        }
    }
}

const renewSessionToken = async (session: Session): Promise<Session> => {
    const renewedToken = await renewToken(session)
    const newSession: Session = {
        ...session,
        authorization: {
            ...session.authorization,
            access_token: renewedToken.data.access_token
        }
    }
    const encryptedSessionString = encryptSessionString(newSession)

    await updateEmailBotSecret(session.character.CharacterID, encryptedSessionString)
    return newSession
}
