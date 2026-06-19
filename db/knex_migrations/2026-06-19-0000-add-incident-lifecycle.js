// Soca: Statuspage-style incident lifecycle.
// Adds a lifecycle status + impact level to incidents, and a timeline of updates.
exports.up = function (knex) {
    return knex.schema
        .alterTable("incident", function (table) {
            // Lifecycle: investigating | identified | monitoring | resolved
            table.string("incident_status", 30).notNullable().defaultTo("investigating");
            // Impact: none | minor | major | critical
            table.string("impact", 20).notNullable().defaultTo("none");
        })
        .createTable("incident_update", function (table) {
            table.increments("id");
            table
                .integer("incident_id")
                .unsigned()
                .notNullable()
                .references("id")
                .inTable("incident")
                .onDelete("CASCADE")
                .onUpdate("CASCADE");
            table.string("status", 30).notNullable();
            table.text("message").notNullable();
            table.datetime("created_date").notNullable().defaultTo(knex.fn.now());

            table.index("incident_id", "idx_incident_update_incident");
        });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("incident_update").alterTable("incident", function (table) {
        table.dropColumn("incident_status");
        table.dropColumn("impact");
    });
};
