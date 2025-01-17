import * as sqlite from 'better-sqlite3'
import { EveStaticSystem } from '../pathfinder/static-nodes'
import { SimpleConnection, SimpleSystem, SystemClassId } from '../types/types'

const db = sqlite(`${process.env.SDE_PATH}/sqlite-latest.sqlite`)

export const getSystemFromDatabase = (systemId: number | string): EveStaticSystem => {
    return db
        .prepare(
            'select solarSystemName, security, regionID from mapSolarSystems where solarSystemID = ?'
        )
        .get(systemId)
}

export const getSystemClassFromDatabase = (regionId: number | string): SystemClassId => {
    return db.prepare('select * from mapLocationWormholeClasses where locationId = ?').get(regionId)
}

export const getSystemFactionFromDatabase = (solarSystemID: number | string): number => {
    console.log(solarSystemID)
    return db
        .prepare('select factionID as factionId from mapSolarSystems where solarSystemID = ?')
        .get(solarSystemID)
}

export const getAllSystems = (): SimpleSystem[] => {
    return db
        .prepare(
            `select 
              solarSystemName, 
              solarSystemID as solarSystemId,
              mapSolarSystems.regionID as regionId, 
              regionName, 
              wormholeClassID as class from mapSolarSystems,
              mapRegions, 
              mapLocationWormholeClasses 
            where 
              mapRegions.regionID = mapSolarSystems.regionID 
            and 
              mapLocationWormholeClasses.locationID = mapSolarSystems.regionID
            order by 
              solarSystemName`
        )
        .all()
}

export const getAllConnections = (): SimpleConnection[] =>
    db.prepare('select fromSolarSystemID, toSolarSystemID FROM mapSolarSystemJumps').all()
