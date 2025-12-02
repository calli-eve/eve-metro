import { DateTime } from 'luxon';
import { knex } from '../../knex/knex';
import { createAllowedEntities } from './admin';
import { MONTHLY_FEE } from '../const';
import { insertWalletWatcher } from './wallet';
import { Session } from '../types/types';
import { encryptSessionString } from '../utils';
import * as esiClient from './esiClient';

jest.mock('./esiClient', () => ({
    ...jest.requireActual('./esiClient'),
    getWalletJournal: jest.fn(),
    renewToken: jest.fn()
}));

jest.mock('./eveMailClient', () => ({
    sendTopupEmailToUser: jest.fn().mockResolvedValue(undefined),
    sendCustomerLostEveMail: jest.fn().mockResolvedValue(undefined)
}));

describe('ESI Error Handling Tests', () => {
    const fixedDate = DateTime.utc(2024, 6, 15, 12, 0, 0);

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
        await knex('payments_log').del();
        await knex('allowed_entity').del();
        await knex('wallet_watcher').del();
        jest.clearAllMocks();
    });

    it('should handle ESI rate limiting (429 error)', async () => {
        const encryptedSession = encryptSessionString(mockSession);
        await insertWalletWatcher({
            character_id: mockSession.character.CharacterID,
            corp_id: mockSession.character.corporation_id,
            secret: encryptedSession
        });

        (esiClient.renewToken as jest.Mock).mockResolvedValue({
            data: mockSession.authorization
        });

        (esiClient.getWalletJournal as jest.Mock).mockRejectedValue({
            response: { status: 429 },
            message: 'Rate limit exceeded'
        });

        await createAllowedEntities();

        const walletWatcher = await knex('wallet_watcher')
            .where('character_id', mockSession.character.CharacterID)
            .first();

        expect(walletWatcher.status).toContain('FAILED');
        expect(walletWatcher.status).toContain('2024-06-15');
    });

    it('should handle ESI authentication error (401)', async () => {
        const encryptedSession = encryptSessionString(mockSession);
        await insertWalletWatcher({
            character_id: mockSession.character.CharacterID,
            corp_id: mockSession.character.corporation_id,
            secret: encryptedSession
        });

        (esiClient.renewToken as jest.Mock).mockResolvedValue({
            data: mockSession.authorization
        });

        (esiClient.getWalletJournal as jest.Mock).mockRejectedValue({
            response: { status: 401 },
            message: 'Unauthorized'
        });

        await createAllowedEntities();

        const walletWatcher = await knex('wallet_watcher')
            .where('character_id', mockSession.character.CharacterID)
            .first();

        expect(walletWatcher.status).toContain('FAILED');
    });

    it('should handle ESI server error (500)', async () => {
        const encryptedSession = encryptSessionString(mockSession);
        await insertWalletWatcher({
            character_id: mockSession.character.CharacterID,
            corp_id: mockSession.character.corporation_id,
            secret: encryptedSession
        });

        (esiClient.renewToken as jest.Mock).mockResolvedValue({
            data: mockSession.authorization
        });

        (esiClient.getWalletJournal as jest.Mock).mockRejectedValue({
            response: { status: 500 },
            message: 'Internal Server Error'
        });

        await createAllowedEntities();

        const walletWatcher = await knex('wallet_watcher')
            .where('character_id', mockSession.character.CharacterID)
            .first();

        expect(walletWatcher.status).toContain('FAILED');
    });

    it('should handle network timeout', async () => {
        const encryptedSession = encryptSessionString(mockSession);
        await insertWalletWatcher({
            character_id: mockSession.character.CharacterID,
            corp_id: mockSession.character.corporation_id,
            secret: encryptedSession
        });

        (esiClient.renewToken as jest.Mock).mockResolvedValue({
            data: mockSession.authorization
        });

        (esiClient.getWalletJournal as jest.Mock).mockRejectedValue({
            code: 'ETIMEDOUT',
            message: 'Request timeout'
        });

        await createAllowedEntities();

        const walletWatcher = await knex('wallet_watcher')
            .where('character_id', mockSession.character.CharacterID)
            .first();

        expect(walletWatcher.status).toContain('FAILED');
    });

    it('should handle token renewal failure', async () => {
        const encryptedSession = encryptSessionString(mockSession);
        await insertWalletWatcher({
            character_id: mockSession.character.CharacterID,
            corp_id: mockSession.character.corporation_id,
            secret: encryptedSession
        });

        (esiClient.renewToken as jest.Mock).mockRejectedValue({
            message: 'Token renewal failed'
        });

        await createAllowedEntities();

        const walletWatcher = await knex('wallet_watcher')
            .where('character_id', mockSession.character.CharacterID)
            .first();

        expect(walletWatcher.status).toContain('FAILED');
    });

    it('should handle malformed ESI response', async () => {
        const encryptedSession = encryptSessionString(mockSession);
        await insertWalletWatcher({
            character_id: mockSession.character.CharacterID,
            corp_id: mockSession.character.corporation_id,
            secret: encryptedSession
        });

        (esiClient.renewToken as jest.Mock).mockResolvedValue({
            data: mockSession.authorization
        });

        // Return malformed data without required fields
        (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
            pages: 1,
            data: [
                {
                    // Missing required fields like 'id', 'amount', etc.
                    ref_type: 'player_donation'
                }
            ]
        });

        // Should not throw, should handle gracefully
        await expect(createAllowedEntities()).resolves.not.toThrow();

        const paymentLogs = await knex('payments_log');
        // Malformed entries might be skipped or cause issues
        expect(paymentLogs.length).toBe(0);
    });

    it('should continue processing other watchers if one fails', async () => {
        // Create two wallet watchers
        const encryptedSession1 = encryptSessionString(mockSession);
        await insertWalletWatcher({
            character_id: mockSession.character.CharacterID,
            corp_id: mockSession.character.corporation_id,
            secret: encryptedSession1
        });

        const mockSession2 = {
            ...mockSession,
            character: { ...mockSession.character, CharacterID: 88888888 }
        };
        const encryptedSession2 = encryptSessionString(mockSession2);
        await insertWalletWatcher({
            character_id: mockSession2.character.CharacterID,
            corp_id: mockSession2.character.corporation_id,
            secret: encryptedSession2
        });

        (esiClient.renewToken as jest.Mock).mockResolvedValue({
            data: mockSession.authorization
        });

        // First call fails, second succeeds
        (esiClient.getWalletJournal as jest.Mock)
            .mockRejectedValueOnce(new Error('ESI Error'))
            .mockResolvedValueOnce({
                pages: 1,
                data: [
                    {
                        id: 123456789,
                        amount: MONTHLY_FEE,
                        balance: 1000000000,
                        context_id: 60003760,
                        context_id_type: 'station_id' as const,
                        date: '2024-06-15T10:00:00Z',
                        description: 'Player donation',
                        first_party_id: 11223344,
                        reason: '',
                        ref_type: 'player_donation',
                        second_party_id: mockSession2.character.CharacterID
                    }
                ]
            });

        await createAllowedEntities();

        const watcher1 = await knex('wallet_watcher')
            .where('character_id', mockSession.character.CharacterID)
            .first();

        const watcher2 = await knex('wallet_watcher')
            .where('character_id', mockSession2.character.CharacterID)
            .first();

        // First should fail
        expect(watcher1.status).toContain('FAILED');

        // Second should succeed
        expect(watcher2.status).toContain('SUCCESS');

        // Payment from second watcher should be processed
        const paymentLogs = await knex('payments_log');
        expect(paymentLogs.length).toBe(1);
    });

    it('should handle empty wallet journal response', async () => {
        const encryptedSession = encryptSessionString(mockSession);
        await insertWalletWatcher({
            character_id: mockSession.character.CharacterID,
            corp_id: mockSession.character.corporation_id,
            secret: encryptedSession
        });

        (esiClient.renewToken as jest.Mock).mockResolvedValue({
            data: mockSession.authorization
        });

        (esiClient.getWalletJournal as jest.Mock).mockResolvedValue({
            pages: 1,
            data: []
        });

        await createAllowedEntities();

        const walletWatcher = await knex('wallet_watcher')
            .where('character_id', mockSession.character.CharacterID)
            .first();

        // Should succeed even with no data
        expect(walletWatcher.status).toContain('SUCCESS');

        const paymentLogs = await knex('payments_log');
        expect(paymentLogs.length).toBe(0);
    });
});
