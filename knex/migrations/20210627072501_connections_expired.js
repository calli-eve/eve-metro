exports.up = function (knex) {
    return knex.schema.table('trig_connections', function (table) {
        table.json('already_expired_reports')
    })
}

exports.down = function (knex) {
    return knex.schema.table('trig_connections', function (table) {
        table.dropColumn('already_expired_reports')
    })
}
