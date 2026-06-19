// Soca: relate an incident to the affected monitors (systems).
exports.up = function (knex) {
    return knex.schema.createTable("incident_monitor", function (table) {
        table.increments("id");
        table
            .integer("incident_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("incident")
            .onDelete("CASCADE")
            .onUpdate("CASCADE");
        table
            .integer("monitor_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("monitor")
            .onDelete("CASCADE")
            .onUpdate("CASCADE");

        table.unique(["incident_id", "monitor_id"], "incident_monitor_unique");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("incident_monitor");
};
