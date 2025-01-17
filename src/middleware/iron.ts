import { withIronSession } from 'next-iron-session'

export default function withSession(handler) {
    return withIronSession(handler, {
        password: process.env.COOKIE_CRYPT_KEY,
        cookieName: 'av_ses',
        cookieOptions: {
            secure: process.env.NODE_ENV === 'production'
        }
    })
}
