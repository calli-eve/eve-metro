import { DateTime } from 'luxon'
import { knex } from '../../knex/knex'
import {
    allTrigConnections,
    getTrigConnectionById,
    insertTrigConnection,
    deleteTrigConnection,
    setTrigConnectionCritical,
    updateTrigConnection,
    setLastSeen,
    setExpired,
    resetExpired,
    purgeOldConnections
} from './trig'
import { TrigConnection } from '../types/types'

const TRIG_CONNECTIONS_TABLE = 'trig_connections'

describe('trig.ts functionality', () => {
    beforeEach(async () => {
        // Clean up any existing test data
        await knex(TRIG_CONNECTIONS_TABLE).del()
    })

    const mockConnection: Omit<TrigConnection, 'id'> = {
        pochvenSystemName: 'Test Pochven System',
        pochvenSystemId: 1,
        pochvenWormholeType: 'K162',
        pochvenSignature: 'ABC-123',
        externalSystemName: 'Test External System',
        externalSystemId: 2,
        externalWormholeType: 'C729',
        externalSignature: 'XYZ-789',
        massCritical: false,
        timeCritical: false,
        timeCriticalTime: undefined,
        comment: 'Test connection',
        createdTime: DateTime.utc().toSQL({ includeOffset: false }),
        already_expired_reports: undefined,
        last_seen: undefined,
        creator: 12345 // Test user ID
    }

    describe('Connection CRUD operations', () => {
        it('should insert and retrieve a connection', async () => {
            await insertTrigConnection(mockConnection)
            const connections = await allTrigConnections()
            
            expect(connections.length).toBe(1)
            expect(connections[0].pochvenSystemName).toBe(mockConnection.pochvenSystemName)
            expect(connections[0].externalSystemName).toBe(mockConnection.externalSystemName)
        })

        it('should prevent duplicate signatures in same system', async () => {
            await insertTrigConnection(mockConnection)
            const duplicateResult = await insertTrigConnection(mockConnection)
            
            expect(duplicateResult).toBe('Already exists')
            const connections = await allTrigConnections()
            expect(connections.length).toBe(1)
        })

        it('should delete a connection', async () => {
            await insertTrigConnection(mockConnection)
            const connections = await allTrigConnections()
            if (!connections[0].id) throw new Error('Connection ID not found')
            await deleteTrigConnection(connections[0].id)
            
            const remainingConnections = await allTrigConnections()
            expect(remainingConnections.length).toBe(0)
        })

        it('should update a connection', async () => {
            await insertTrigConnection(mockConnection)
            const connections = await allTrigConnections()
            if (!connections[0].id) throw new Error('Connection ID not found')
            const updatedConnection = {
                ...connections[0],
                comment: 'Updated comment',
                massCritical: true
            }
            
            await updateTrigConnection(updatedConnection)
            const retrievedConnection = await getTrigConnectionById(connections[0].id)
            
            expect(retrievedConnection[0].comment).toBe('Updated comment')
            expect(retrievedConnection[0].massCritical).toBe(true)
        })
    })

    describe('Connection status management', () => {
        it('should set time critical status', async () => {
            await insertTrigConnection(mockConnection)
            const connections = await allTrigConnections()
            if (!connections[0].id) throw new Error('Connection ID not found')
            
            await setTrigConnectionCritical(connections[0].id)
            const updatedConnection = await getTrigConnectionById(connections[0].id)
            
            expect(updatedConnection[0].timeCritical).toBe(true)
            expect(updatedConnection[0].timeCriticalTime).not.toBeNull()
        })

        it('should update last seen timestamp', async () => {
            await insertTrigConnection(mockConnection)
            const connections = await allTrigConnections()
            
            await setLastSeen(connections[0])
            const updatedConnection = await getTrigConnectionById(connections[0].id)
            
            expect(updatedConnection[0].last_seen).not.toBeNull()
        })

        it('should manage expired reports', async () => {
            await insertTrigConnection(mockConnection)
            const connections = await allTrigConnections()
            const userId = 12345

            // Set expired
            const result = await setExpired(connections[0], userId)
            expect(result).toBe(true)

            // Verify expired report
            const connectionWithReport = await getTrigConnectionById(connections[0].id)
            expect(connectionWithReport[0].already_expired_reports).not.toBeNull()
            
            // Get the raw value from the database
            const rawValue = await knex(TRIG_CONNECTIONS_TABLE)
                .where({ id: connections[0].id })
                .select('already_expired_reports')
                .first()
            
            // The reports are already parsed by Knex
            const reports = rawValue.already_expired_reports
            expect(Array.isArray(reports)).toBe(true)
            expect(reports.length).toBe(1)
            expect(reports[0].userId).toBe(userId)
            expect(reports[0].time).toBeDefined()

            // Prevent duplicate reports from same user
            const duplicateResult = await setExpired(connections[0], userId)
            expect(duplicateResult).toBe(false)

            // Reset expired status
            await resetExpired(connections[0])
            const resetConnection = await getTrigConnectionById(connections[0].id)
            expect(resetConnection[0].already_expired_reports).toBeNull()
        })
    })

    describe('purgeOldConnections', () => {
        it('should purge normal connections older than 15.5 hours', async () => {
            const oldConnection = {
                ...mockConnection,
                createdTime: DateTime.utc().minus({ hours: 16 }).toSQL({ includeOffset: false })
            }
            await insertTrigConnection(oldConnection)
            
            await purgeOldConnections()
            const remainingConnections = await allTrigConnections()
            expect(remainingConnections.length).toBe(0)
        })

        it('should purge time critical connections older than 3 hours', async () => {
            const criticalConnection = {
                ...mockConnection,
                timeCritical: true,
                createdTime: DateTime.utc().minus({ hours: 4 }).toSQL({ includeOffset: false })
            }
            await insertTrigConnection(criticalConnection)
            
            // Get the connection and verify it's time critical
            const connections = await allTrigConnections()
            if (!connections[0].id) throw new Error('Connection ID not found')
            expect(connections[0].timeCritical).toBe(true)
            expect(connections[0].timeCriticalTime).toBeDefined()
            
            // Set the connection as time critical with an old timestamp
            await knex(TRIG_CONNECTIONS_TABLE)
                .where({ id: connections[0].id })
                .update({
                    timeCriticalTime: DateTime.utc().minus({ hours: 4 }).toSQL({ includeOffset: false })
                })
            
            await purgeOldConnections()
            const remainingConnections = await allTrigConnections()
            expect(remainingConnections.length).toBe(0)
        })

        it('should purge C729 connections older than 11.5 hours', async () => {
            const c729Connection = {
                ...mockConnection,
                externalWormholeType: 'C729',
                createdTime: DateTime.utc().minus({ hours: 12 }).toSQL({ includeOffset: false })
            }
            await insertTrigConnection(c729Connection)
            
            await purgeOldConnections()
            const remainingConnections = await allTrigConnections()
            expect(remainingConnections.length).toBe(0)
        })

        it('should keep recent connections', async () => {
            const recentConnection = {
                ...mockConnection,
                createdTime: DateTime.utc().minus({ hours: 1 }).toSQL({ includeOffset: false })
            }
            await insertTrigConnection(recentConnection)
            
            await purgeOldConnections()
            const remainingConnections = await allTrigConnections()
            expect(remainingConnections.length).toBe(1)
        })
    })
}) 