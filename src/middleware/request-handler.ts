import nc from 'next-connect'
import morgan from 'morgan'
import { ironSession } from 'next-iron-session'
import { SESSION_KEY } from '../const'
import { Session } from '../types/types'
import { onError } from './error-handler'
import { NextApiRequest, NextApiResponse } from 'next'

const ADMIN_CHARACTER_IDS = JSON.parse(process.env.ADMIN_CHARACTER_IDS)

const session = ironSession({
    password: process.env.COOKIE_CRYPT_KEY,
    cookieName: 'av_ses',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production'
    }
})
export interface ExtendedRequest<T> extends NextApiRequest {
    session: {
        set: (string, Session) => void
        get: (string) => Session
        unset: () => void
        save: () => void
        destroy: () => void
    }
    body: T
}

export interface ExtendedSessionRequest extends NextApiRequest {
    session: {
        set: (string, Session) => void
        get: (string) => Session
        unset: () => void
        save: () => void
        destroy: () => void
    }
}

const checkAllowed = async (req: ExtendedRequest<any>, res: NextApiResponse, next) => {
    const session = req.session?.get(SESSION_KEY)
    if (!session) {
        req.session.destroy()
        return res.status(403).end()
    }

    if (session.character.level < 2) return res.status(403).end()

    next()
}

const checkAdmin = (req: ExtendedRequest<any>, res: NextApiResponse, next) => {
    const session = req.session?.get(SESSION_KEY)
    if (!session) {
        req.session.destroy()
        return res.status(403).end()
    }
    if (!ADMIN_CHARACTER_IDS.some((userId) => userId === session.character.CharacterID))
        return res.status(403).end()
    next()
}

morgan.token('session', (req: ExtendedRequest<any>, res) => {
    const session = req.session?.get(SESSION_KEY)
    return `Session: ${session?.character?.CharacterID} - ${session?.character?.CharacterName}`
})

export const protectedHandler = () => {
    return nc({ onError })
        .use(session)
        .use(
            morgan(
                ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ":session"'
            )
        )
        .use(checkAllowed)
}
export const publicHandler = () => {
    return nc({ onError })
        .use(session)
        .use(
            morgan(
                ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ":session"'
            )
        )
}

export const adminHandler = () => {
    return nc({ onError })
        .use(session)
        .use(
            morgan(
                ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" ":session"'
            )
        )
        .use(checkAdmin)
}
