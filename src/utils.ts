import * as crypto from 'crypto-js'
import { DateTime } from 'luxon'

import {
    HIGHSEC_GREEN,
    JSPACE_BLUE,
    LOWSEC_YELLOW,
    NON_CAPITAL_SYSTEM_CLASSES_EVE,
    NULLSEC_RED,
    SHIP_MASSES,
    TRIGLAVIAN_RED,
    TRIG_SYSTEM_IDS,
    WH_TYPES
} from './const'
import { ShipSize, RouteSystem, SystemClassId, Session } from './types/types'

export const calculateShipSizeByWh = (whTypes: [string, string]): ShipSize => {
    const to = `${whTypes[0]}`
    const maxMassTo = WH_TYPES[to]?.jump
    const maxMassFrom = WH_TYPES[whTypes[1]]?.jump
    return (
        (Object.keys(SHIP_MASSES).find(
            (key) => SHIP_MASSES[key] === maxMassTo || SHIP_MASSES[key] === maxMassFrom
        ) as ShipSize) ?? 'Capital'
    )
}

export const calculateShipSizeBySecurityStatus = (securityStatus: number): ShipSize => {
    if (securityStatus >= 0.45) return 'Freighter'
    else return 'Capital'
}

export const calculateShipSizeBySystemClass = (systemclassId: SystemClassId): ShipSize => {
    if (NON_CAPITAL_SYSTEM_CLASSES_EVE.some((i) => i === systemclassId)) return 'Battleship'
    return 'Capital'
}

export const canShipPassMassTest = (limit: ShipSize, current: ShipSize): boolean => {
    return SHIP_MASSES[current] <= SHIP_MASSES[limit]
}

export function getCopyPasteRoute(route: RouteSystem[]): string {
    return route.reduce((acc: string, system, index) => {
        const critical = system?.massCritical || system?.lifeCritical ? 'CRITICAL' : ''
        const newTextNode = `${system.currentSystemName} ${
            system.nextSystemSig ? system.nextSystemSig : ''
        } ${critical} \n`
        return acc + newTextNode
    }, '')
}

export const groupByFrom = (routes) => groupBy(routes, 'fromSolarSystemId')

export const securityStatusColor = (system: RouteSystem) => {
    if (TRIG_SYSTEM_IDS.some((id) => id === system.currentSystemId)) return TRIGLAVIAN_RED
    if (system.currentSystemName.match(/J[0-9]{1,6}$/) || system.currentSystemName === 'Thera')
        return JSPACE_BLUE
    if (system.currentSystemSecurity >= 0.45) return HIGHSEC_GREEN
    else if (system.currentSystemSecurity > 0.0 && system.currentSystemSecurity < 0.5)
        return LOWSEC_YELLOW
    else return NULLSEC_RED
}

export const groupBy = (items, key) =>
    items.reduce(
        (result, item) => ({
            ...result,
            [item[key]]: [...(result[item[key]] || []), item]
        }),
        {}
    )

export const encryptSessionString = (session: Session) => {
    return crypto.AES.encrypt(JSON.stringify(session), process.env.COOKIE_CRYPT_KEY).toString()
}

export const decryptSessionString = (secret: string): Session => {
    const bytes = crypto.AES.decrypt(secret, process.env.COOKIE_CRYPT_KEY)
    return JSON.parse(bytes.toString(crypto.enc.Utf8))
}

export const encryptJSONString = (jsonString: string): string => {
    return crypto.AES.encrypt(jsonString, process.env.COOKIE_CRYPT_KEY).toString()
}

export const decryptJSONString = <T>(secret: string): T => {
    const bytes = crypto.AES.decrypt(secret, process.env.COOKIE_CRYPT_KEY)
    return JSON.parse(bytes.toString(crypto.enc.Utf8)) as T
}

export const startAndEndDateForPeriod = (periodIndex: number) => {
    const dateNow = DateTime.utc()
    const currentPeriodIsEndOfMonth =
        dateNow.day > 15 ? periodIndex % 2 === 0 : periodIndex % 2 !== 0
    const monthsToSubtract = currentPeriodIsEndOfMonth
        ? Math.ceil(periodIndex / 2)
        : Math.floor(periodIndex / 2)
    const startDate = currentPeriodIsEndOfMonth
        ? dateNow.minus({ months: monthsToSubtract }).set({ day: 16 })
        : dateNow.minus({ months: monthsToSubtract }).startOf('month')
    const endDate = currentPeriodIsEndOfMonth
        ? dateNow.minus({ months: monthsToSubtract }).endOf('month')
        : dateNow.minus({ months: monthsToSubtract }).set({ day: 15 })

    const startDateForPeriod = startDate.startOf('day').toISO()
    const endDateForPeriod = endDate.endOf('day').toISO()
    return {
        startDateForPeriod,
        endDateForPeriod
    }
}
