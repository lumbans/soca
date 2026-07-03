// Soca: audit trail.
// An append-only log of security-relevant actions (authentication, user/role
// management, settings and component changes) for security review and audit.
// Rows are never updated; deletion is intentionally not exposed in the UI so the
// trail stays tamper-evident from the application's perspective.
exports.up = async function (knex) {
    await knex.schema.createTable("audit_log", function (table) {
        table.increments("id");
        // When the action happened (UTC).
        table.datetime("created_date").notNullable().defaultTo(knex.fn.now());
        // Actor. user_id is null for anonymous/system events (e.g. a failed login).
        // username is denormalized so the trail survives the user being deleted.
        table.integer("user_id").nullable();
        table.string("username", 255);
        // Machine-readable action key, e.g. "login.success", "user.create".
        table.string("action", 100).notNullable();
        // Coarse grouping for filtering: auth | user | role | setting | component.
        table.string("category", 50).notNullable().defaultTo("general");
        // Optional target of the action.
        table.string("entity_type", 50);
        table.string("entity_id", 100);
        // Human-readable summary and outcome.
        table.text("description");
        table.string("status", 20).notNullable().defaultTo("success");
        // Originating client IP (proxy-aware), when known.
        table.string("ip", 60);

        table.index("created_date");
        table.index("user_id");
        table.index("action");
        table.index("category");
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("audit_log");
};
