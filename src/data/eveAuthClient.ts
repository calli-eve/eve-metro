import axios from 'axios'
import { Session } from '../types/types'

const config = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
            `${process.env.NEXT_PUBLIC_EVE_SSO_ID}:${process.env.EVE_SSO_SECRET}`
        ).toString('base64')}`,
        Host: 'login.eveonline.com'
    }
}

type AccessToken = string
type TokenType = 'Bearer'
type ExpirationMillis = number
type RefreshToken = string

export interface AuthorizationResponse {
    access_token: AccessToken
    token_type: TokenType
    expires_in: ExpirationMillis
    refresh_token: RefreshToken
}

export const exchangeCodeForToken = async (code: string) => {
    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code
    }).toString()
    return await axios.post<AuthorizationResponse>(
        `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/v2/oauth/token`,
        params,
        config
    )
}
export interface VerificationResponse {
    CharacterID: number
    CharacterName: string
    ExpiresOn: Date
    Scopes: string
    TokenType: string
    CharacterOwnerHash: string
    IntellectualProperty: string
}

export const verifyToken = async (authorizationResponse: AuthorizationResponse) => {
    return await axios.get<VerificationResponse>(
        `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/oauth/verify`,
        {
            headers: {
                Authorization: `Bearer ${authorizationResponse.access_token}`
            }
        }
    )
}

export interface EveAuthCharacter {
    alliance_id: number
    ancestry_id: number
    birthday: Date
    bloodline_id: number
    corporation_id: number
    description: string
    gender: string
    name: string
    race_id: number
    security_status: number
    title: string
}

export const getCharacter = async (characterID: number) => {
    return await axios.get<EveAuthCharacter>(
        `${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/characters/${characterID}`,
        {
            headers: {
                'Cache-Control': 'no-cache'
            }
        }
    )
}

export const renewToken = async (session: Session) => {
    const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: session.authorization.refresh_token
    }).toString()
    return await axios.post<AuthorizationResponse>(
        `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/v2/oauth/token`,
        params,
        config
    )
}

export const revokeToken = async (session: Session) => {
    const params = new URLSearchParams({
        token: session.authorization.refresh_token,
        token_type_hint: 'refresh_token'
    }).toString()
    const config = {
        headers: {
            Authorization: `Basic ${Buffer.from(
                `${process.env.NEXT_PUBLIC_EVE_SSO_ID}:${process.env.EVE_SSO_SECRET}`
            ).toString('base64')}`,
            Host: 'login.eveonline.com'
        }
    }
    return await axios.post(
        `${process.env.NEXT_PUBLIC_EVE_SSO_AUTH_HOST}/v2/oauth/revoke`,
        params,
        config
    )
}
