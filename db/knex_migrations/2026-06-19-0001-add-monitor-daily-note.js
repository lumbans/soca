// Soca: per-day admin notes for a monitor (shown on the 90-day uptime bar tooltip).
exports.up = function (knex) {
    return knex.schema.createTable("monitor_daily_note", function (table) {
        table.increments("id");
        table
            .integer("monitor_id")
            .unsigned()
            .notNullable()
            .references("id")
            .inTable("monitor")
            .onDelete("CASCADE")
            .onUpdate("CASCADE");
        // UTC calendar day, "YYYY-MM-DD" — matches the uptime bar's day keys.
        table.string("day", 10).notNullable();
        table.text("note").notNullable();

        table.unique(["monitor_id", "day"], "monitor_daily_note_unique");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("monitor_daily_note");
};
