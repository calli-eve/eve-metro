import knex from '../../knex/knex'

export const AUDIT_LOG_TABLE = 'audit_log'

export type AuditActions =
    | 'login'
    | 'logout'
    | 'insert_allowed'
    | 'remove_allowed'
    | 'calculate_route'
    | 'insert_connection'
    | 'delete_connection'
    | 'update_connection'
    | 'set_last_seen'
    | 'report_expired'
    | 'reset_expired'
    | 'set_to_crit'
    | 'set_wallet_watcher'
    | 'delete_wallet_watcher'
    | 'delete_todo'
    | 'enable_email_bot'
    | 'disable_email_bot'

type AuditType = 'auth' | 'admin' | 'path' | 'connections'

export interface AuditLogEntry {
    timestamp: string | undefined
    type: AuditType
    user_id: number
    action: AuditActions
    meta: string
}

export const insertAuditLogEvent = (auditLogEntry: AuditLogEntry): Promise<void> => {
    return knex(AUDIT_LOG_TABLE).insert(auditLogEntry)
}

export const getAuditLogsPage = (page): AuditLogEntry[] => {
    return knex(AUDIT_LOG_TABLE)
        .limit(10)
        .offset(page * 10)
        .orderBy('timestamp', 'desc')
}
