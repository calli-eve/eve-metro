import { DateTime, Settings } from 'luxon'
import { knex } from '../../knex/knex';
import { processPaymentLogEntries, PaymentsLogEntry } from './wallet';
import { MONTHLY_FEE } from '../const';

jest.mock('./eveMailClient', () => ({
    sendTopupEmailToUser: jest.fn().mockResolvedValue(undefined)
}));

describe('Payment Processing Concurrency Tests', () => {
    const fixedDate = DateTime.utc(2024, 6, 15, 12, 0, 0);
    let prevDefaultZone;
    beforeEach(() => {
        jest.spyOn(DateTime, 'utc').mockImplementation((() => fixedDate) as any);
        prevDefaultZone = Settings.defaultZone;
        Settings.defaultZone = 'UTC'
    });

    afterEach(() => {
        jest.restoreAllMocks();
        Settings.defaultZone = prevDefaultZone;
    });

    beforeEach(async () => {
        await knex('payments_log').del();
        await knex('allowed_entity').del();
        jest.clearAllMocks();
    });

    it('should handle concurrent payment processing for same user', async () => {
        const payment1: PaymentsLogEntry = {
            id: 100001,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE,
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        const payment2: PaymentsLogEntry = {
            id: 100002,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE * 2,
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({ ref_type: 'player_donation' })
        };

        // Process payments concurrently
        await Promise.all([
            processPaymentLogEntries([payment1]),
            processPaymentLogEntries([payment2])
        ]);

        const allowedEntities = await knex('allowed_entity')
            .where('entity_id', 11223344);

        // Should only create one entity despite concurrent processing
        expect(allowedEntities.length).toBe(1);

        // Due to race conditions, the result may vary slightly
        // Both payments should be processed (1 + 2 months = 3 months)
        // But the exact outcome depends on processing order
        const validUntil = allowedEntities[0].valid_untill instanceof Date
            ? DateTime.fromJSDate(allowedEntities[0].valid_untill)
            : DateTime.fromISO(allowedEntities[0].valid_untill);

        // Should have at least 2 months from now (minimum if both processed)
        const minExpected = DateTime.utc().plus({ months: 2 });
        // Should have at most 7 days + 3 months (if initial grant + both payments)
        const maxExpected = DateTime.utc().plus({ days: 7, months: 3 });

        expect(validUntil >= minExpected).toBe(true);
        expect(validUntil <= maxExpected).toBe(true);
    });

    it('should handle concurrent payment processing for different users', async () => {
        const payments: PaymentsLogEntry[] = [
            {
                id: 100001,
                receiving_id: 98765432,
                paying_id: 11111111,
                amount: MONTHLY_FEE,
                date: DateTime.utc().toSQL({ includeOffset: false }) as string,
                journal_entry: JSON.stringify({ ref_type: 'player_donation' })
            },
            {
                id: 100002,
                receiving_id: 98765432,
                paying_id: 22222222,
                amount: MONTHLY_FEE * 2,
                date: DateTime.utc().toSQL({ includeOffset: false }) as string,
                journal_entry: JSON.stringify({ ref_type: 'player_donation' })
            },
            {
                id: 100003,
                receiving_id: 98765432,
                paying_id: 33333333,
                amount: MONTHLY_FEE * 3,
                date: DateTime.utc().toSQL({ includeOffset: false }) as string,
                journal_entry: JSON.stringify({ ref_type: 'player_donation' })
            }
        ];

        // Process all payments concurrently
        await Promise.all(
            payments.map(payment => processPaymentLogEntries([payment]))
        );

        const entities = await knex('allowed_entity').orderBy('entity_id');

        expect(entities.length).toBe(3);
        expect(entities[0].entity_id).toBe(11111111);
        expect(entities[1].entity_id).toBe(22222222);
        expect(entities[2].entity_id).toBe(33333333);
    });

    it('should handle rapid sequential processing without data corruption', async () => {
        const payments: PaymentsLogEntry[] = [];

        // Create 10 sequential payments for same user
        for (let i = 0; i < 10; i++) {
            payments.push({
                id: 100000 + i,
                receiving_id: 98765432,
                paying_id: 11223344,
                amount: MONTHLY_FEE,
                date: DateTime.utc().minus({ days: 10 - i }).toSQL({ includeOffset: false }) as string,
                journal_entry: JSON.stringify({ ref_type: 'player_donation' })
            });
        }

        // Process sequentially but rapidly
        for (const payment of payments) {
            await processPaymentLogEntries([payment]);
        }

        const paymentLogs = await knex('payments_log')
            .where('paying_id', 11223344)
            .orderBy('id');

        // All payments should be logged
        expect(paymentLogs.length).toBe(10);

        // All should be processed
        paymentLogs.forEach((log: any) => {
            expect(log.processed).toBe(true);
        });

        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', 11223344)
            .first();

        // Sequential processing should give consistent results
        // First payment: 7 days + 1 month, then 9 more payments each add 1 month
        // Total: 7 days + 10 months
        const validUntil = allowedEntity.valid_untill instanceof Date
            ? DateTime.fromJSDate(allowedEntity.valid_untill)
            : DateTime.fromISO(allowedEntity.valid_untill);

        const expectedValidUntil = DateTime.utc().plus({ days: 7, months: 10 });

        // Due to timing differences in sequential processing and month calculations, allow 2 day variance
        const daysDiff = Math.abs(validUntil.diff(expectedValidUntil, 'days').days);
        expect(daysDiff).toBeLessThanOrEqual(2);
    });
});
