import { DateTime } from 'luxon';
import { knex } from '../../knex/knex';
import { processPaymentLogEntries, PaymentsLogEntry } from './wallet';
import { MONTHLY_FEE } from '../const';
import { AllowedEntity } from '../pages/api/admin/allowed';

// Mock the email sending functions
jest.mock('./eveMailClient', () => ({
    sendTopupEmailToUser: jest.fn().mockResolvedValue(undefined)
}));

describe('processPaymentLogEntries', () => {
    const fixedDate = DateTime.utc(2024, 3, 7, 12, 0, 0);

    beforeEach(() => {
        jest.spyOn(DateTime, 'utc').mockImplementation((() => fixedDate) as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(async () => {
        // Clean up database before each test
        await knex('payments_log').del();
        await knex('allowed_entity').del();
        
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('should process new payments and create allowed entities for new users', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE,
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({
                ref_type: 'player_donation',
                first_party_id: 11223344,
                amount: MONTHLY_FEE
            })
        };

        await processPaymentLogEntries([testPayment]);

        // Verify payment was logged
        const paymentLog = await knex('payments_log').where('id', testPayment.id).first();
        expect(paymentLog).toBeTruthy();
        expect(paymentLog.processed).toBe(true);

        // Verify allowed entity was created
        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', testPayment.paying_id)
            .first();
        expect(allowedEntity).toBeTruthy();
        expect(allowedEntity.type).toBe('Character');
        expect(allowedEntity.level).toBe('2');

        // Verify validity period
        const validUntil = DateTime.fromISO(allowedEntity.valid_untill);
        const expectedValidUntil = DateTime.utc().plus({ day: 7 }).plus({ months: 1 });
        expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
    });

    it('should extend subscription for existing users', async () => {
        // Create existing allowed entity
        const validUntilDate = DateTime.utc().plus({ months: 1 }).toSQL({ includeOffset: false });
        if (!validUntilDate) throw new Error('Failed to generate valid_until date');

        const existingEntity: AllowedEntity = {
            type: 'Character',
            level: 2,
            entity_id: 11223344,
            valid_untill: validUntilDate
        };
        await knex('allowed_entity').insert(existingEntity);

        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE * 2, // Pay for 2 months
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({
                ref_type: 'player_donation',
                first_party_id: 11223344,
                amount: MONTHLY_FEE * 2
            })
        };

        await processPaymentLogEntries([testPayment]);

        // Verify payment was logged
        const paymentLog = await knex('payments_log').where('id', testPayment.id).first();
        expect(paymentLog).toBeTruthy();
        expect(paymentLog.processed).toBe(true);

        // Verify allowed entity was updated
        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', testPayment.paying_id)
            .first();
        expect(allowedEntity).toBeTruthy();

        if(!existingEntity.valid_untill) throw new Error('Existing entity has no validity period');

        // Verify validity period was extended by 2 months
        const validUntil = DateTime.fromISO(allowedEntity.valid_untill);
        const expectedValidUntil = DateTime.fromSQL(existingEntity.valid_untill).plus({ months: 2 });
        expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());

        // Verify email was attempted to be sent
        const { sendTopupEmailToUser } = require('./eveMailClient');
        expect(sendTopupEmailToUser).toHaveBeenCalledWith(testPayment.paying_id);
    });

    it('should skip payments below monthly threshold', async () => {
        const testPayment: PaymentsLogEntry = {
            id: 123456789,
            receiving_id: 98765432,
            paying_id: 11223344,
            amount: MONTHLY_FEE - 1, // Below threshold
            date: DateTime.utc().toSQL({ includeOffset: false }) as string,
            journal_entry: JSON.stringify({
                ref_type: 'player_donation',
                first_party_id: 11223344,
                amount: MONTHLY_FEE - 1
            })
        };

        await processPaymentLogEntries([testPayment]);

        // Verify payment was logged but not processed
        const paymentLog = await knex('payments_log').where('id', testPayment.id).first();
        expect(paymentLog).toBeTruthy();
        expect(paymentLog.processed).toBeFalsy();

        // Verify no allowed entity was created
        const allowedEntity = await knex('allowed_entity')
            .where('entity_id', testPayment.paying_id)
            .first();
        expect(allowedEntity).toBeFalsy();

        // Verify no email was sent
        const { sendTopupEmailToUser } = require('./eveMailClient');
        expect(sendTopupEmailToUser).not.toHaveBeenCalled();
    });
}); 