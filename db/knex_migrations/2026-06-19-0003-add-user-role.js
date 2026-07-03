// Soca: multi-user roles.
// Adds a `role` column to users for role-based access control.
// Roles: site_admin | page_admin | incident_mgr | component_mgr | viewer
exports.up = async function (knex) {
    await knex.schema.alterTable("user", function (table) {
        // Default to the least-privileged role for any row that doesn't set it explicitly.
        table.string("role", 30).notNullable().defaultTo("viewer");
    });

    // Existing accounts predate roles — promote them to full access so nobody is locked out.
    await knex("user").update({ role: "site_admin" });
};

exports.down = function (knex) {
    return knex.schema.alterTable("user", function (table) {
        table.dropColumn("role");
    });
};
