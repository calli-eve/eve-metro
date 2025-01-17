exports.up = function (knex) {
    return knex.schema.table('trig_connections', function (table) {
        table.timestamp('last_seen')
    })
}

exports.down = function (knex) {
    return knex.schema.table('trig_connections', function (table) {
        table.dropColumn('last_seen')
    })
}
