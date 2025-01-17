import { NextApiRequest, NextApiResponse } from 'next'
import cache from '../../../middleware/cache'
import { publicHandler } from '../../../middleware/request-handler'
import { getAllSystems } from '../../../data/db'
import { SimpleSystem } from '../../../types/types'

export default publicHandler()
    .use(cache('60 minutes'))
    .get<NextApiRequest, NextApiResponse>(async (_, res) => {
        const systems = getAllSystems()
        const zarzakh: SimpleSystem = {
            regionId: 10001000,
            regionName: 'Yasna Zakh',
            solarSystemId: 30100000,
            solarSystemName: 'Zarzakh',
            class: '12'
        }
        res.status(200).json([...systems, zarzakh])
    })
