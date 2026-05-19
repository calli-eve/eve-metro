import { SessionOptions } from 'iron-session'

export const sessionOptions: SessionOptions = {
    password: process.env.COOKIE_CRYPT_KEY,
    cookieName: 'av_ses',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production'
    }
}
