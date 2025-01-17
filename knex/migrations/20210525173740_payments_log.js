exports.up = function (knex) {
    return knex.schema.createTable('payments_log', function (table) {
        table.bigint('id').primary()
        table.integer('receiving_id').notNullable()
        table.integer('paying_id').notNullable()
        table.float('amount')
        table.timestamp('date')
        table.jsonb('journal_entry')
        table.boolean('processed')
        table.timestamp('processed_date')
    })
}

exports.down = function (knex) {
    return knex.schema.dropTable('payments_log')
}
