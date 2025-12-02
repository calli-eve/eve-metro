import { DateTime } from 'luxon';
import { knex } from '../../knex/knex';
import { processPaymentLogEntries, PaymentsLogEntry } from './wallet';
import { MONTHLY_FEE } from '../const';
import { AllowedEntity } from '../pages/api/admin/allowed';

jest.mock('./eveMailClient', () => ({
    sendTopupEmailToUser: jest.fn().mockResolvedValue(undefined)
}));

describe('Payment Processing Edge Cases', () => {
    const fixedDate = DateTime.utc(2024, 6, 15, 12, 0, 0);

    beforeEach(() => {
        jest.spyOn(DateTime, 'utc').mockImplementation((() => fixedDate) as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(async () => {
        await knex('payments_log').del();
        await knex('allowed_entity').del();
        jest.clearAllMocks();
    });

    it('should handle fractional month payments correctly (floor to integer months)', async () => {
        const existingEntity: AllowedEntity = {
            type: 'Character',
            level: 2,
            entity_id: 11223344,
            valid_untill: DateTime.utc().plus({ months: 1 }).toSQL({ includeOffset: false }) as string
        };
        await knex('allowed_entity').insert(existingEntity);

        // Payment for 2.7 months worth (should floor to 2 months)
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: Math.floor(MONTHLY_FEE * 2.7),
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        await processPaymentLogEntries([testPayment]);

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        const validUntil = allowedEntity.valid_untill instanceof Date
            ? DateTime.fromJSDate(allowedEntity.valid_untill)
            : DateTime.fromISO(allowedEntity.valid_untill);

        const expectedValidUntil = DateTime.fromSQL(existingEntity.valid_untill!).plus({ months: 2 });
        expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
    });

    it('should handle multiple payments from same user in batch', async () => {
        const payments: PaymentsLogEntry[] = [
            {
                id: 100001,
                receiving_id: 98765432,
                paying_id: 11223344,
                amount: MONTHLY_FEE,
                date: DateTime.utc().minus({ days: 2 }).toSQL({ includeOffset: false }) as string,
                journal_entry: JSON.stringify({ ref_type: 'player_donation' })
            },
            {
                id: 100002,
                receiving_id: 98765432,
                paying_id: 11223344,
                amount: MONTHLY_FEE * 2,
                date: DateTime.utc().minus({ days: 1 }).toSQL({ includeOffset: false }) as string,
                journal_entry: JSON.stringify({ ref_type: 'player_donation' })
            }
        ];

        await processPaymentLogEntries(payments);

        // Should create entity with initial 7 days, then extend by 1 month, then by 2 months
        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        expect(allowedEntity).toBeTruthy();

        // First payment creates entity with 7 days + 1 month
        // Second payment extends by 2 months
        const validUntil = allowedEntity.valid_untill instanceof Date
            ? DateTime.fromJSDate(allowedEntity.valid_untill)
            : DateTime.fromISO(allowedEntity.valid_untill);

        const expectedValidUntil = DateTime.utc().plus({ days: 7, months: 3 });
        expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
    });

    it('should handle exactly monthly fee amount', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE, // Exactly 50M
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        await processPaymentLogEntries([testPayment]);

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        expect(allowedEntity).toBeTruthy();

        const validUntil = allowedEntity.valid_untill instanceof Date
            ? DateTime.fromJSDate(allowedEntity.valid_untill)
            : DateTime.fromISO(allowedEntity.valid_untill);

        // Should get 7 days + 1 month
        const expectedValidUntil = DateTime.utc().plus({ days: 7, months: 1 });
        expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
    });

    it('should handle payment just above threshold', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE + 1, // Just above threshold
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        await processPaymentLogEntries([testPayment]);

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        expect(allowedEntity).toBeTruthy();
    });

    it('should handle payment just below threshold', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE - 1, // Just below threshold
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        await processPaymentLogEntries([testPayment]);

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        expect(allowedEntity).toBeFalsy();
    });

    it('should handle duplicate payment processing (idempotency)', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE,
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        // Process same payment twice
        await processPaymentLogEntries([testPayment]);
        await processPaymentLogEntries([testPayment]);

        const allowedEntities = await knex('allowed_entity')
            .where('entity_id', 11223344);

        // Should only create one entity
        expect(allowedEntities.length).toBe(1);

        // Should only be extended once (7 days + 1 month, not 7 days + 2 months)
        const validUntil = allowedEntities[0].valid_untill instanceof Date
            ? DateTime.fromJSDate(allowedEntities[0].valid_untill)
            : DateTime.fromISO(allowedEntities[0].valid_untill);

        const expectedValidUntil = DateTime.utc().plus({ days: 7, months: 1 });
        expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
    });

    it('should handle very large payment (12+ months)', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE * 24, // 2 years worth
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        await processPaymentLogEntries([testPayment]);

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        expect(allowedEntity).toBeTruthy();

        const validUntil = allowedEntity.valid_untill instanceof Date
            ? DateTime.fromJSDate(allowedEntity.valid_untill)
            : DateTime.fromISO(allowedEntity.valid_untill);

        const expectedValidUntil = DateTime.utc().plus({ days: 7, months: 24 });
        expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
    });

    it('should handle subscription expiring exactly today', async () => {
        // Create entity that expires today
        const todaySQL = DateTime.utc().toSQL({ includeOffset: false }) as string;
        const existingEntity: AllowedEntity = {
            type: 'Character',
            level: 2,
            entity_id: 11223344,
            valid_untill: todaySQL
        };
        await knex('allowed_entity').insert(existingEntity);

        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE,
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        await processPaymentLogEntries([testPayment]);

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        const validUntil = allowedEntity.valid_untill instanceof Date
            ? DateTime.fromJSDate(allowedEntity.valid_untill)
            : DateTime.fromISO(allowedEntity.valid_untill);

        // Should extend from today since it's expired
        const expectedValidUntil = DateTime.utc().plus({ months: 1 });
        expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
    });

    it('should handle empty payment list', async () => {
        await processPaymentLogEntries([]);

        const entities = await knex('allowed_entity');
        expect(entities.length).toBe(0);
    });

    it('should handle zero amount payment', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: 0,
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        await processPaymentLogEntries([testPayment]);

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        expect(allowedEntity).toBeFalsy();
    });

    it('should handle negative amount payment', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: -MONTHLY_FEE,
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        await processPaymentLogEntries([testPayment]);

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        // Negative amounts should be ignored
        expect(allowedEntity).toBeFalsy();
    });
});
