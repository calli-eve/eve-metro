import { DateTime } from 'luxon'
import { knex } from '../../knex/knex'
import { purgeExpiredEntities } from './admin'
import { ALLOWED_ENTITY_TABLE } from './admin'
import { AllowedEntity } from '../pages/api/admin/allowed'

describe('purgeExpiredEntities', () => {
    beforeEach(async () => {
        // Clean up any existing test data
        await knex(ALLOWED_ENTITY_TABLE).del()
    })

    it('should purge expired entities and keep valid ones', async () => {
        // Create test data
        const expiredDate = DateTime.utc().minus({ days: 1 }).toSQL({ includeOffset: false })
        const futureDate = DateTime.utc().plus({ days: 1 }).toSQL({ includeOffset: false })

        const testEntities: AllowedEntity[] = [
            {
                entity_id: 1,
                type: 'Character',
                level: 2,
                valid_untill: expiredDate // Expired yesterday
            },
            {
                entity_id: 2,
                type: 'Character',
                level: 2,
                valid_untill: futureDate // Valid until tomorrow
            }
        ]

        // Insert test entities
        await knex(ALLOWED_ENTITY_TABLE).insert(testEntities)

        // Run the purge
        await purgeExpiredEntities()

        // Check the results
        const remainingEntities = await knex(ALLOWED_ENTITY_TABLE).select('*')
        
        // Should only have one entity remaining
        expect(remainingEntities.length).toBe(1)
        
        // The remaining entity should be the one with the future date
        expect(remainingEntities[0].entity_id).toBe(2)
    })

    it('should handle no expired entities', async () => {
        // Create test data with only future dates
        const futureDate = DateTime.utc().plus({ days: 1 }).toSQL({ includeOffset: false })

        const testEntities: AllowedEntity[] = [
            {
                entity_id: 1,
                type: 'Character',
                level: 2,
                valid_untill: futureDate
            },
            {
                entity_id: 2,
                type: 'Character',
                level: 2,
                valid_untill: futureDate
            }
        ]

        // Insert test entities
        await knex(ALLOWED_ENTITY_TABLE).insert(testEntities)

        // Run the purge
        await purgeExpiredEntities()

        // Check the results
        const remainingEntities = await knex(ALLOWED_ENTITY_TABLE).select('*')
        
        // Should still have both entities
        expect(remainingEntities.length).toBe(2)
    })

    it('should handle empty table', async () => {
        // Run the purge on empty table
        await purgeExpiredEntities()

        // Check the results
        const remainingEntities = await knex(ALLOWED_ENTITY_TABLE).select('*')
        
        // Should be empty
        expect(remainingEntities.length).toBe(0)
    })
}) 