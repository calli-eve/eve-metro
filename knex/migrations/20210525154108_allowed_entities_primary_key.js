exports.up = function (knex) {
    return knex.schema.alterTable('allowed_entity', function (table) {
        table.primary('entity_id')
    })
}

exports.down = function (knex) {
    return knex.schema.table('allowed_entity', function (table) {
        table.dropPrimary()
    })
}
