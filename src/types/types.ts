import { StringifyOptions } from 'query-string'
import { ESISystemJumps, ESISystemKills } from '../data/esiClient'
import { AuthorizationResponse } from '../data/eveAuthClient'

export interface RouteSystem {
    currentSystemId: number
    currentSystemName: string
    currentSystemSecurity: number
    nextSystemName?: string
    nextSystemSig: string
    source?: EdgeSource
    lifeCritical?: boolean
    massCritical?: boolean
    thankYou?: string
}

export enum EdgeSource {
    'k-space',
    'eve-scout',
    'trig-map'
}

export interface SimpleSystem {
    solarSystemName: string
    solarSystemId: number
    regionId: number
    regionName: string
    class: string
}

export interface SimpleConnection {
    toSolarSystemID: number
    fromSolarSystemID: number
}

export interface SimpleSystemWithKills extends SimpleSystem {
    esiKills: ESISystemKills
    esiJumps: ESISystemJumps
}

export interface TrigConnection {
    id?: number
    key?: string
    pochvenSystemName: string
    pochvenSystemId: SystemId
    pochvenWormholeType?: string
    pochvenSignature?: string
    externalSystemName?: string
    externalSystemId: SystemId | HashedSystemId
    externalWormholeType?: string
    externalSignature?: string
    massCritical: boolean
    timeCritical: boolean
    createdTime: string
    timeCriticalTime?: string
    comment?: string
    creator?: number
    last_seen?: string
    updated_at?: string
    already_expired_reports?: {
        userId: number
        time: StringifyOptions
    }[]
}

export type SystemId = number

export type HashedSystemId = string

export type SystemClassId = number

export type WormholeStatus = 'critical' | 'stable'

export type ShipSize = 'Frigate' | 'Cruiser' | 'Battleship' | 'Freighter' | 'Capital' | undefined

export type SystemNode = {
    systemId: SystemId
    systemName: string
    systemSecurityStatus: number
    shipSize: ShipSize
    systemEdges: SystemEdge[]
}

export type SystemEdge = {
    solarSystemIdDst: number
    solarSystemNameDst: string
    solarSystemSecDst: number
    shipSize: ShipSize
    edgeSource: EdgeSource
    signatureSrc?: string
    signatureDst?: string
    wormholeTypeSrc?: string
    wormholeTypeDst?: string
    wormholeMass?: WormholeStatus
    wormholeEol?: WormholeStatus
    creatorName?: string
    createdTime?: string
    lastSeenTime?: string
}

export interface EveScoutResponse {
    id: number
    signatureId: string
    type: string
    status: string
    wormholeMass: WormholeStatus
    wormholeEol: WormholeStatus
    wormholeEstimatedEol: string
    wormholeDestinationSignatureId: string
    createdAt: string
    updatedAt: string
    deletedAt?: null
    statusUpdatedAt?: string | null
    createdBy: string
    createdById: string
    deletedBy?: null
    deletedById?: null
    wormholeSourceWormholeTypeId: number
    wormholeDestinationWormholeTypeId: number
    solarSystemId: number
    wormholeDestinationSolarSystemId: number
    sourceWormholeType: SourceWormholeTypeOrDestinationWormholeType
    destinationWormholeType: SourceWormholeTypeOrDestinationWormholeType
    sourceSolarSystem: SourceSolarSystemOrDestinationSolarSystem
    destinationSolarSystem: SourceSolarSystemOrDestinationSolarSystem
}

export interface SourceWormholeTypeOrDestinationWormholeType {
    id: number
    name: string
    src: string
    dest: string
    lifetime: number
    jumpMass: number
    maxMass: number
}

interface SourceSolarSystemOrDestinationSolarSystem {
    id: number
    name: string
    constellationID: number
    security: number
    regionId: number
    region: Region
}

interface Region {
    id: number
    name: string
}

export interface SessionCharacter {
    CharacterID: number
    CharacterName: string
    corporation_id: number
    alliance_id: number
    admin?: boolean
    level: number
    subUntill?: string
}

export interface Session {
    character: SessionCharacter
    authorization: AuthorizationResponse
    formSubmitted?: boolean
}

export interface PochvenConnectionInput {
    connectionId: number
}
