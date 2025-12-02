import { Session } from '../types/types'
import { decryptSessionString, encryptSessionString } from '../utils'
import { findMultipleAllowedEntities } from './admin'
import { getEmailBot, updateEmailBotSecret, updateEmailBotStatus } from './email'
import { EmailRequest, getCharacter, renewToken, sendEveMail } from './esiClient'
import { DateTime } from 'luxon'

export const sendCustomerLostEveMail = async (entity_id : number) => {

    const character = await getCharacter(entity_id)
    const body = `Hello ${
                    character ? character.name : ''
                }. Thank You for supporting EVE Metro project! Your subscription to the service has ended. We hope to see you in the future again!


You can reactivate your subscription again for a month by transferring 50mil subscription fee to <font size="14" color="#ffd98d00"><a href="showinfo:2//98684333">EVE Metro Corporation</a></font>.

Best Regards,
EVE Metro team
            `
    if (
        process.env.ENVIRONMENT !== 'production'
    ) {
        console.log('LostMail', body)
        return
    }

    const bots = await getEmailBot()
    if (bots.length > 0) {
        const botSession: Session = decryptSessionString(bots[0].secret)
        try {
            const newBotSession = await renewSessionToken(botSession)
            const mailToSend: EmailRequest = {
                subject: 'EVE Metro subscription deactivated',
                sender_character_id: bots[0].character_id,
                access_token: newBotSession.authorization.access_token,
                recepient_character_id: entity_id,
                body,
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

export const sendTopupEmailToUser = async (entity_id: number) => {
    const allowedEntity = await findMultipleAllowedEntities([entity_id])
    const character = await getCharacter(entity_id)
    const body = `Thank You for using EVE Metro ${
        character ? character.name : ''
    }. Thank You for supporting EVE Metro project! Your payment has been processed. Access to https://evemetro.com is now valid thru ${DateTime.fromISO(
        allowedEntity[0].valid_untill
    ).toISODate()}.

Best Regards,
EVE Metro team
`
    if (
        process.env.ENVIRONMENT !== 'production'
    ) {
        console.log('TopupMail', body)
        return
    }

    const bots = await getEmailBot()
    if (bots.length > 0) {
        const botSession: Session = decryptSessionString(bots[0].secret)
        try {
            const newBotSession = await renewSessionToken(botSession)
            const char = await getCharacter(entity_id)
            const mailToSend: EmailRequest = {
                subject: 'EVE Metro subscription extended',
                sender_character_id: bots[0].character_id,
                access_token: newBotSession.authorization.access_token,
                recepient_character_id: entity_id,
                body: `Thank you for using EVE Metro ${
                    char ? char.name : ''
                }. Thank You for supporting EVE Metro project! Your payment has been processed. Access to https://evemetro.com is now valid thru ${DateTime.fromISO(
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
