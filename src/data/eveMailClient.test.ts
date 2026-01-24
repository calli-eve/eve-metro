import { DateTime, Settings } from 'luxon';
import { knex } from '../../knex/knex';
import { sendTopupEmailToUser } from './eveMailClient';
import { AllowedEntity } from '../pages/api/admin/allowed';

// Mock dependencies
jest.mock('./esiClient', () => ({
    getCharacter: jest.fn().mockResolvedValue({ name: 'Test Character' }),
    renewToken: jest.fn(),
    sendEveMail: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('./email', () => ({
    getEmailBot: jest.fn().mockResolvedValue([]),
    updateEmailBotSecret: jest.fn(),
    updateEmailBotStatus: jest.fn()
}));

describe('sendTopupEmailToUser', () => {
    let prevDefaultZone;
    beforeEach(async () => {
        // Clean up database before each test
        await knex('allowed_entity').del();
        prevDefaultZone = Settings.defaultZone
        Settings.defaultZone = 'UTC'
        jest.clearAllMocks();
    });
    afterEach(() => {
        Settings.defaultZone = prevDefaultZone
    });

    it('should handle valid_untill as Date object from database', async () => {
        // Setup: Create entity with a specific date
        const validDate = DateTime.utc(2025, 12, 25, 0, 0, 0);
        const validDateSQL = validDate.toSQL({ includeOffset: false });
        if (!validDateSQL) throw new Error('Failed to generate valid date');

        const entity: AllowedEntity = {
            type: 'Character',
            level: 2,
            entity_id: 12345678,
            valid_untill: validDateSQL
        };
        await knex('allowed_entity').insert(entity);

        // Spy on console.log to capture the email body
        const consoleSpy = jest.spyOn(console, 'log');

        // Execute
        await sendTopupEmailToUser(12345678);

        // Find the TopupMail log
        const topupMailLog = consoleSpy.mock.calls.find(
            call => call[0] === 'TopupMail'
        );

        expect(topupMailLog).toBeTruthy();
        const emailBody = topupMailLog?.[1];

        // Verify the email body contains a properly formatted date (not null)
        expect(emailBody).toBeTruthy();
        expect(emailBody).toContain('2025-12-25');
        expect(emailBody).not.toContain('valid thru null');
        expect(emailBody).not.toContain('valid thru N/A');

        consoleSpy.mockRestore();
    });

    it('should handle valid_untill as ISO string', async () => {
        // Setup: Manually insert with ISO string (simulating different code path)
        const validDate = DateTime.utc(2026, 1, 15, 0, 0, 0);
        const isoString = validDate.toISO();

        // Insert directly to bypass type checking
        await knex.raw(`
            INSERT INTO allowed_entity (entity_id, type, level, valid_untill)
            VALUES (?, ?, ?, ?)
        `, [87654321, 'Character', 2, isoString]);

        // Spy on console.log
        const consoleSpy = jest.spyOn(console, 'log');

        // Execute
        await sendTopupEmailToUser(87654321);

        // Find the TopupMail log
        const topupMailLog = consoleSpy.mock.calls.find(
            call => call[0] === 'TopupMail'
        );

        expect(topupMailLog).toBeTruthy();
        const emailBody = topupMailLog?.[1];

        // Verify the email body contains a properly formatted date
        expect(emailBody).toBeTruthy();
        expect(emailBody).toContain('2026-01-15');
        expect(emailBody).not.toContain('valid thru null');

        consoleSpy.mockRestore();
    });

    it('should handle null valid_untill gracefully', async () => {
        // Setup: Create entity with null valid_untill
        await knex.raw(`
            INSERT INTO allowed_entity (entity_id, type, level, valid_untill)
            VALUES (?, ?, ?, NULL)
        `, [99887766, 'Character', 2]);

        // Spy on console.log
        const consoleSpy = jest.spyOn(console, 'log');

        // Execute
        await sendTopupEmailToUser(99887766);

        // Find the TopupMail log
        const topupMailLog = consoleSpy.mock.calls.find(
            call => call[0] === 'TopupMail'
        );

        expect(topupMailLog).toBeTruthy();
        const emailBody = topupMailLog?.[1];

        // Verify the email body shows 'N/A' for null date
        expect(emailBody).toBeTruthy();
        expect(emailBody).toContain('valid thru N/A');
        expect(emailBody).not.toContain('valid thru null');

        consoleSpy.mockRestore();
    });
});
