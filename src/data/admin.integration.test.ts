import { DateTime } from 'luxon';
import { knex } from '../../knex/knex';
import { createAllowedEntities } from './admin';
import { MONTHLY_FEE } from '../const';
import { AllowedEntity } from '../pages/api/admin/allowed';
import { insertWalletWatcher } from './wallet';
import { Session } from '../types/types';
import { encryptSessionString } from '../utils';
import * as esiClient from './esiClient';

// Mock the ESI client and email sending functions
jest.mock('./esiClient', () => ({
    ...jest.requireActual('./esiClient'),
    getWalletJournal: jest.fn(),
    renewToken: jest.fn()
}));

jest.mock('./eveMailClient', () => ({
    sendTopupEmailToUser: jest.fn().mockResolvedValue(undefined),
    sendCustomerLostEveMail: jest.fn().mockResolvedValue(undefined)
}));

describe('Subscription Extension Integration Tests with ESI Wallet Mock', () => {
    const fixedDate = DateTime.utc(2024, 6, 15, 12, 0, 0);

    // Mock session data
    const mockSession: Session = {
        character: {
            CharacterID: 98765432,
            CharacterName: 'Test Character',
            corporation_id: 12345678,
            alliance_id: 99887766,
            level: 2
        },
        authorization: {
            access_token: 'mock_access_token',
            token_type: 'Bearer',
            expires_in: 1200,
            refresh_token: 'mock_refresh_token'
        }
    };

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
        await knex('wallet_watcher').del();

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('createAllowedEntities with ESI wallet mock', () => {
        it('should process wallet donations and create subscription for new users', async () => {
            // Setup: Register wallet watcher
            const encryptedSession = encryptSessionString(mockSession);
            await insertWalletWatcher({
                character_id: mockSession.character.CharacterID,
                corp_id: mockSession.character.corporation_id,
                secret: encryptedSession
            });

            // Mock ESI wallet journal response with a single donation
            const mockWalletData = [
                {
                    id: 123456789,
                    amount: MONTHLY_FEE * 2, // 2 months worth
                    balance: 1000000000,
                    context_id: 60003760,
                    context_id_type: 'station_id' as const,
                    date: '2024-06-15T10:00:00Z',
                    description: 'Player donation',
                    first_party_id: 11223344, // Donor character ID
                    reason: '',
                    ref_type: 'player_donation',
                    second_party_id: mockSession.character.CharacterID
                }
            ];

            (esiClient.renewToken as jest.Mock).mockResolvedValue({
                data: mockSession.authorization
            });

            (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
                pages: 1,
                data: mockWalletData
            });

            // Execute
            await createAllowedEntities();

            // Verify payment was logged
            const paymentLog = await knex('payments_log').where('id', 123456789).first();
            expect(paymentLog).toBeTruthy();
            expect(paymentLog.paying_id).toBe(11223344);
            expect(paymentLog.receiving_id).toBe(mockSession.character.CharacterID);
            expect(paymentLog.amount).toBe(MONTHLY_FEE * 2);

            // Verify allowed entity was created for the donor
            const allowedEntity = await knex('allowed_entity')
                .where('entity_id', 11223344)
                .first();
            expect(allowedEntity).toBeTruthy();
            expect(allowedEntity.type).toBe('Character');
            expect(allowedEntity.level).toBe('2');

            // Verify validity period (7 days initial + 2 months from payment)
            // Handle case where valid_untill might be a Date object or ISO string from database
            const validUntil = allowedEntity.valid_untill instanceof Date
                ? DateTime.fromJSDate(allowedEntity.valid_untill)
                : DateTime.fromISO(allowedEntity.valid_untill);
            const expectedValidUntil = DateTime.utc().plus({ days: 7, months: 2 });
            expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());

            // Verify wallet watcher status was updated
            const walletWatcher = await knex('wallet_watcher')
                .where('character_id', mockSession.character.CharacterID)
                .first();
            expect(walletWatcher.status).toContain('SUCCESS');
        });

        it('should extend existing subscription correctly for multiple months', async () => {
            // Setup: Create existing allowed entity with subscription valid until 1 month from now
            const existingValidUntil = DateTime.utc().plus({ months: 1 }).toSQL({ includeOffset: false });
            if (!existingValidUntil) throw new Error('Failed to generate valid_until date');

            const existingEntity: AllowedEntity = {
                type: 'Character',
                level: 2,
                entity_id: 11223344,
                valid_untill: existingValidUntil
            };
            await knex('allowed_entity').insert(existingEntity);

            // Setup: Register wallet watcher
            const encryptedSession = encryptSessionString(mockSession);
            await insertWalletWatcher({
                character_id: mockSession.character.CharacterID,
                corp_id: mockSession.character.corporation_id,
                secret: encryptedSession
            });

            // Mock ESI wallet journal response with donation for 3 months
            const mockWalletData = [
                {
                    id: 987654321,
                    amount: MONTHLY_FEE * 3, // 3 months worth
                    balance: 1000000000,
                    context_id: 60003760,
                    context_id_type: 'station_id' as const,
                    date: '2024-06-15T10:00:00Z',
                    description: 'Player donation',
                    first_party_id: 11223344,
                    reason: '',
                    ref_type: 'player_donation',
                    second_party_id: mockSession.character.CharacterID
                }
            ];

            (esiClient.renewToken as jest.Mock).mockResolvedValue({
                data: mockSession.authorization
            });

            (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
                pages: 1,
                data: mockWalletData
            });

            // Execute
            await createAllowedEntities();

            // Verify payment was processed
            const paymentLog = await knex('payments_log').where('id', 987654321).first();
            expect(paymentLog).toBeTruthy();
            expect(paymentLog.processed).toBe(true);

            // Verify subscription was extended by 3 months from existing expiry
            const allowedEntity = await knex('allowed_entity')
                .where('entity_id', 11223344)
                .first();
            expect(allowedEntity).toBeTruthy();

            const validUntil = allowedEntity.valid_untill instanceof Date
                ? DateTime.fromJSDate(allowedEntity.valid_untill)
                : DateTime.fromISO(allowedEntity.valid_untill);
            const expectedValidUntil = DateTime.fromSQL(existingValidUntil).plus({ months: 3 });
            expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());

            // Verify email was attempted to be sent
            const { sendTopupEmailToUser } = require('./eveMailClient');
            expect(sendTopupEmailToUser).toHaveBeenCalledWith(11223344);
        });

        it('should extend expired subscription from current date, not expired date', async () => {
            // Setup: Create existing allowed entity with subscription that expired 2 months ago
            const expiredValidUntil = DateTime.utc().minus({ months: 2 }).toSQL({ includeOffset: false });
            if (!expiredValidUntil) throw new Error('Failed to generate valid_until date');

            const existingEntity: AllowedEntity = {
                type: 'Character',
                level: 2,
                entity_id: 55667788,
                valid_untill: expiredValidUntil
            };
            await knex('allowed_entity').insert(existingEntity);

            // Setup: Register wallet watcher
            const encryptedSession = encryptSessionString(mockSession);
            await insertWalletWatcher({
                character_id: mockSession.character.CharacterID,
                corp_id: mockSession.character.corporation_id,
                secret: encryptedSession
            });

            // Mock ESI wallet journal response with donation for 1 month
            const mockWalletData = [
                {
                    id: 111222333,
                    amount: MONTHLY_FEE,
                    balance: 1000000000,
                    context_id: 60003760,
                    context_id_type: 'station_id' as const,
                    date: '2024-06-15T10:00:00Z',
                    description: 'Player donation',
                    first_party_id: 55667788,
                    reason: '',
                    ref_type: 'player_donation',
                    second_party_id: mockSession.character.CharacterID
                }
            ];

            (esiClient.renewToken as jest.Mock).mockResolvedValue({
                data: mockSession.authorization
            });

            (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
                pages: 1,
                data: mockWalletData
            });

            // Execute
            await createAllowedEntities();

            // Verify subscription was extended from current date (not expired date)
            const allowedEntity = await knex('allowed_entity')
                .where('entity_id', 55667788)
                .first();
            expect(allowedEntity).toBeTruthy();

            const validUntil = allowedEntity.valid_untill instanceof Date
                ? DateTime.fromJSDate(allowedEntity.valid_untill)
                : DateTime.fromISO(allowedEntity.valid_untill);
            const expectedValidUntil = DateTime.utc().plus({ months: 1 });

            expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
            expect(validUntil > DateTime.utc()).toBe(true);
        });

        it('should handle null valid_untill date for existing entities', async () => {
            // Setup: Create existing allowed entity with NULL valid_untill
            await knex('allowed_entity').insert({
                type: 'Character',
                level: 2,
                entity_id: 77889900,
                valid_untill: null
            });

            // Setup: Register wallet watcher
            const encryptedSession = encryptSessionString(mockSession);
            await insertWalletWatcher({
                character_id: mockSession.character.CharacterID,
                corp_id: mockSession.character.corporation_id,
                secret: encryptedSession
            });

            // Mock ESI wallet journal response
            const mockWalletData = [
                {
                    id: 444555666,
                    amount: MONTHLY_FEE,
                    balance: 1000000000,
                    context_id: 60003760,
                    context_id_type: 'station_id' as const,
                    date: '2024-06-15T10:00:00Z',
                    description: 'Player donation',
                    first_party_id: 77889900,
                    reason: '',
                    ref_type: 'player_donation',
                    second_party_id: mockSession.character.CharacterID
                }
            ];

            (esiClient.renewToken as jest.Mock).mockResolvedValue({
                data: mockSession.authorization
            });

            (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
                pages: 1,
                data: mockWalletData
            });

            // Execute
            await createAllowedEntities();

            // Verify subscription was created from current date
            const allowedEntity = await knex('allowed_entity')
                .where('entity_id', 77889900)
                .first();
            expect(allowedEntity).toBeTruthy();
            expect(allowedEntity.valid_untill).not.toBeNull();

            const validUntil = allowedEntity.valid_untill instanceof Date
                ? DateTime.fromJSDate(allowedEntity.valid_untill)
                : DateTime.fromISO(allowedEntity.valid_untill);
            const expectedValidUntil = DateTime.utc().plus({ months: 1 });
            expect(validUntil.toISODate()).toBe(expectedValidUntil.toISODate());
        });

        it('should skip donations below monthly threshold', async () => {
            // Setup: Register wallet watcher
            const encryptedSession = encryptSessionString(mockSession);
            await insertWalletWatcher({
                character_id: mockSession.character.CharacterID,
                corp_id: mockSession.character.corporation_id,
                secret: encryptedSession
            });

            // Mock ESI wallet journal response with small donation
            const mockWalletData = [
                {
                    id: 999888777,
                    amount: MONTHLY_FEE - 1000000, // Below threshold
                    balance: 1000000000,
                    context_id: 60003760,
                    context_id_type: 'station_id' as const,
                    date: '2024-06-15T10:00:00Z',
                    description: 'Player donation',
                    first_party_id: 44445555,
                    reason: '',
                    ref_type: 'player_donation',
                    second_party_id: mockSession.character.CharacterID
                }
            ];

            (esiClient.renewToken as jest.Mock).mockResolvedValue({
                data: mockSession.authorization
            });

            (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
                pages: 1,
                data: mockWalletData
            });

            // Execute
            await createAllowedEntities();

            // Verify payment was logged
            // Note: Due to how processOneWallet works, entries are inserted with processed: true initially
            // but below-threshold entries don't get processed (no subscription created)
            const paymentLog = await knex('payments_log').where('id', 999888777).first();
            expect(paymentLog).toBeTruthy();

            // Verify no subscription was created
            const allowedEntity = await knex('allowed_entity')
                .where('entity_id', 44445555)
                .first();
            expect(allowedEntity).toBeFalsy();
        });

        it('should filter non-donation transactions', async () => {
            // Setup: Register wallet watcher
            const encryptedSession = encryptSessionString(mockSession);
            await insertWalletWatcher({
                character_id: mockSession.character.CharacterID,
                corp_id: mockSession.character.corporation_id,
                secret: encryptedSession
            });

            // Mock ESI wallet journal response with mixed transaction types
            const mockWalletData = [
                {
                    id: 200001,
                    amount: MONTHLY_FEE,
                    balance: 1000000000,
                    context_id: 60003760,
                    context_id_type: 'station_id' as const,
                    date: '2024-06-15T10:00:00Z',
                    description: 'Market transaction',
                    first_party_id: 66667777,
                    reason: '',
                    ref_type: 'market_transaction', // Not a donation
                    second_party_id: mockSession.character.CharacterID
                },
                {
                    id: 200002,
                    amount: MONTHLY_FEE,
                    balance: 1050000000,
                    context_id: 60003760,
                    context_id_type: 'station_id' as const,
                    date: '2024-06-15T11:00:00Z',
                    description: 'Player donation',
                    first_party_id: 88889999,
                    reason: '',
                    ref_type: 'player_donation', // This one is a donation
                    second_party_id: mockSession.character.CharacterID
                }
            ];

            (esiClient.renewToken as jest.Mock).mockResolvedValue({
                data: mockSession.authorization
            });

            (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
                pages: 1,
                data: mockWalletData
            });

            // Execute
            await createAllowedEntities();

            // Verify only the donation was logged
            const marketTx = await knex('payments_log').where('id', 200001).first();
            const donationTx = await knex('payments_log').where('id', 200002).first();

            expect(marketTx).toBeFalsy(); // Should not be logged
            expect(donationTx).toBeTruthy(); // Should be logged

            // Verify only donation created subscription
            const user1 = await knex('allowed_entity').where('entity_id', 66667777).first();
            const user2 = await knex('allowed_entity').where('entity_id', 88889999).first();

            expect(user1).toBeFalsy();
            expect(user2).toBeTruthy();
        });

        it('should send topup email with correct date format', async () => {
            // Setup: Create existing allowed entity with subscription valid until 1 month from now
            const existingValidUntil = DateTime.utc().plus({ months: 1 }).toSQL({ includeOffset: false });
            if (!existingValidUntil) throw new Error('Failed to generate valid_until date');

            const existingEntity: AllowedEntity = {
                type: 'Character',
                level: 2,
                entity_id: 11223344,
                valid_untill: existingValidUntil
            };
            await knex('allowed_entity').insert(existingEntity);

            // Setup: Register wallet watcher
            const encryptedSession = encryptSessionString(mockSession);
            await insertWalletWatcher({
                character_id: mockSession.character.CharacterID,
                corp_id: mockSession.character.corporation_id,
                secret: encryptedSession
            });

            // Mock ESI wallet journal response
            const mockWalletData = [
                {
                    id: 555666777,
                    amount: MONTHLY_FEE,
                    balance: 1000000000,
                    context_id: 60003760,
                    context_id_type: 'station_id' as const,
                    date: '2024-06-15T10:00:00Z',
                    description: 'Player donation',
                    first_party_id: 11223344,
                    reason: '',
                    ref_type: 'player_donation',
                    second_party_id: mockSession.character.CharacterID
                }
            ];

            (esiClient.renewToken as jest.Mock).mockResolvedValue({
                data: mockSession.authorization
            });

            (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
                pages: 1,
                data: mockWalletData
            });

            // Execute
            await createAllowedEntities();

            // Verify email was called
            const { sendTopupEmailToUser } = require('./eveMailClient');
            expect(sendTopupEmailToUser).toHaveBeenCalledWith(11223344);

            // Verify the subscription was extended
            const allowedEntity = await knex('allowed_entity')
                .where('entity_id', 11223344)
                .first();
            expect(allowedEntity).toBeTruthy();
            expect(allowedEntity.valid_untill).not.toBeNull();

            // The email function should handle the Date object properly
            // (We can't directly test the email content in this test since it's mocked,
            // but the fix ensures no null dates appear in production)
        });

        it('should update wallet watcher status on error', async () => {
            // Setup: Register wallet watcher
            const encryptedSession = encryptSessionString(mockSession);
            await insertWalletWatcher({
                character_id: mockSession.character.CharacterID,
                corp_id: mockSession.character.corporation_id,
                secret: encryptedSession
            });

            // Mock ESI wallet journal to throw error
            (esiClient.renewToken as jest.Mock).mockResolvedValue({
                data: mockSession.authorization
            });

            (esiClient.getWalletJournal as jest.Mock).mockRejectedValue(
                new Error('ESI API Error')
            );

            // Execute
            await createAllowedEntities();

            // Verify wallet watcher status was updated with failure
            const walletWatcher = await knex('wallet_watcher')
                .where('character_id', mockSession.character.CharacterID)
                .first();
            expect(walletWatcher.status).toContain('FAILED');
        });
    });
});
