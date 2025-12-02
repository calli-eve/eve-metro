import axios from 'axios'
import { Session } from '../types/types'

export interface ESISystem {
    constellation_id: number
    name: string
    planets: Planet[]
    position: Position
    security_class: string
    security_status: number
    star_id: number
    stargates: number[]
    stations: number[]
    system_id: number
}

export interface Planet {
    planet_id: number
    moons?: number[]
    asteroid_belts?: number[]
}

export interface Position {
    x: number
    y: number
    z: number
}

export async function getSolarSystem(systemId): Promise<ESISystem> {
    return await fetch(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/universe/systems/${systemId}`).then(
        (res) => res.json()
    )
}

export interface ESICharacter {
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

export async function getCharacter(characterId): Promise<ESICharacter | undefined> {
    return await fetch(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/characters/${characterId}`).then(
        (res) => (res.ok ? res.json() : undefined)
    )
}

export async function searchCharacter(characterName: string): Promise<{ character: number[] }> {
    return await fetch(
        `${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/search/?categories=character&datasource=tranquility&language=en&search=${characterName}&strict=true`
    ).then((res) => res.json())
}

export interface ESIType {
    capacity: number
    description: string
    dogma_attributes: DogmaAttribute[]
    dogma_effects: DogmaEffect[]
    graphic_id: number
    group_id: number
    market_group_id: number
    mass: number
    name: string
    packaged_volume: number
    portion_size: number
    published: boolean
    radius: number
    type_id: number
    volume: number
}

export interface DogmaAttribute {
    attribute_id: number
    value: number
}

export interface DogmaEffect {
    effect_id: number
    is_default: boolean
}

export async function getShip(shipId): Promise<ESIType | undefined> {
    return await fetch(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/universe/types/${shipId}`).then(
        (res) => (res.ok ? res.json() : undefined)
    )
}

export interface ESICorporation {
    alliance_id: number
    ceo_id: number
    creator_id: number
    date_founded: Date
    description: string
    home_station_id: number
    member_count: number
    name: string
    shares: number
    tax_rate: number
    ticker: string
    url: string
    war_eligible: boolean
}

export async function getCorporation(corpId): Promise<ESICorporation | undefined> {
    return await fetch(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/corporations/${corpId}`).then(
        (res) => (res.ok ? res.json() : undefined)
    )
}

export interface ESIAlliance {
    creator_corporation_id: number
    creator_id: number
    date_founded: Date
    executor_corporation_id: number
    name: string
    ticker: string
}

export async function getAlliance(allianceId): Promise<ESIAlliance | undefined> {
    return await fetch(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/alliances/${allianceId}`).then(
        (res) => (res.ok ? res.json() : undefined)
    )
}

export interface ESISystemKills {
    npc_kills: number
    pod_kills: number
    ship_kills: number
    system_id: number
}

export async function getSystemKills(): Promise<ESISystemKills[]> {
    return await fetch(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/universe/system_kills/`).then(
        (res) => res.json()
    )
}

export interface ESISystemJumps {
    ship_jumps: number
    system_id: number
}

export async function getSystemJumps(): Promise<ESISystemJumps[]> {
    return await fetch(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/universe/system_jumps/`).then(
        (res) => res.json()
    )
}

export interface ESICalendarEvent {
    event_date: Date
    event_id: number
    event_response: string
    importance: number
    title: string
}

export async function getCalendarEvents(session: Session): Promise<ESICalendarEvent[]> {
    return await fetch(
        `${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/characters/${session.character.CharacterID}/calendar`,
        {
            headers: {
                Authorization: `Bearer ${session.authorization.access_token}`
            }
        }
    ).then((res) => res.json())
}

export async function respondToCalendarEvent(session: Session, response, eventId): Promise<void> {
    return await axios.put(
        `${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/characters/${session.character.CharacterID}/calendar/${eventId}`,
        {
            response
        },
        {
            headers: {
                Authorization: `Bearer ${session.authorization.access_token}`
            }
        }
    )
}

export interface ESICharacterLocation {
    solar_system_id: number
    structure_id: number
    station_id: number
}

export async function getCurrentLocation(session: Session): Promise<ESICharacterLocation> {
    return await fetch(
        `${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/characters/${session.character.CharacterID}/location`,
        {
            headers: {
                Authorization: `Bearer ${session.authorization.access_token}`
            }
        }
    ).then((res) => res.json())
}

export type ContextIDType =
    | 'structure_id'
    | 'station_id'
    | 'market_transaction_id'
    | 'character_id'
    | 'corporation_id'
    | 'alliance_id'
    | 'eve_system'
    | 'industry_job_id'
    | 'contract_id'
    | 'planet_id'
    | 'system_id'
    | 'type_id'
export interface ESIWalletData {
    amount: number
    balance: number
    context_id: number
    context_id_type: ContextIDType
    date: string
    description: string
    first_party_id: number
    id: number
    reason: string
    ref_type: string
    second_party_id: number
}

export const getWalletJournal = async (
    session: Session,
    page: number
): Promise<{ pages: number; data: ESIWalletData[] }> => {
    return await fetch(
        `${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/corporations/${session.character.corporation_id}/wallets/1/journal?page=${page}`,
        {
            headers: {
                Authorization: `Bearer ${session.authorization.access_token}`
            }
        }
    ).then(async (res) => {
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        return {
            pages: res.headers.get('x-pages') ? parseInt(res.headers.get('x-pages')) : 1,
            data
        }
    })
}

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

export interface EmailRequest {
    sender_character_id: number
    recepient_character_id: number
    body: string
    subject: string
    access_token: string
}

export const sendEveMail = async (emailRequest: EmailRequest): Promise<any> => {
    return fetch(
        `${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/characters/${emailRequest.sender_character_id}/mail/`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${emailRequest.access_token}`
            },
            body: JSON.stringify({
                approved_cost: 0,
                body: emailRequest.body,
                recipients: [
                    {
                        recipient_id: emailRequest.recepient_character_id,
                        recipient_type: 'character'
                    }
                ],
                subject: emailRequest.subject
            })
        }
    )
}

export const calcRoute = async (startId: number, endId: number): Promise<number[]> => {
    return fetch(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/route/${startId}/${endId}/`).then((res) =>
        res.json()
    )
}

export interface Sov {
    system_id: number
    faction_id?: number
    alliance_id?: number
    corporation_id?: number
}

export const getSov = async (): Promise<Sov[]> => {
    return axios
        .get(`${process.env.NEXT_PUBLIC_EVE_ESI_HOST}/sovereignty/map`)
        .then((res) => res.data)
}
