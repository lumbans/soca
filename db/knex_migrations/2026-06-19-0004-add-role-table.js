// Soca: configurable roles (RBAC).
// Moves roles from a hardcoded matrix to a DB table so site_admin can add/edit/
// delete roles. `user.role` stays a string referencing `role.key`.
// `permissions` is a JSON array of capability keys: users | settings | components | incidents
const BUILTIN_ROLES = [
    { key: "site_admin", name: "Site Admin", description: "Full access (CISO / IT Head)", permissions: [ "users", "settings", "components", "incidents" ] },
    { key: "page_admin", name: "Page Admin", description: "Manage incidents + components (NOC Lead)", permissions: [ "components", "incidents" ] },
    { key: "incident_mgr", name: "Incident Manager", description: "Manage incidents only (NOC Analyst)", permissions: [ "incidents" ] },
    { key: "component_mgr", name: "Component Manager", description: "Manage components only (DevOps)", permissions: [ "components" ] },
    { key: "viewer", name: "Viewer", description: "Read-only dashboard (Stakeholder)", permissions: [] },
];

exports.up = async function (knex) {
    await knex.schema.createTable("role", function (table) {
        table.increments("id");
        table.string("key", 50).notNullable().unique();
        table.string("name", 100).notNullable();
        table.string("description", 255);
        table.text("permissions").notNullable().defaultTo("[]");
        table.boolean("builtin").notNullable().defaultTo(false);
    });

    for (const r of BUILTIN_ROLES) {
        await knex("role").insert({
            key: r.key,
            name: r.name,
            description: r.description,
            permissions: JSON.stringify(r.permissions),
            builtin: true,
        });
    }
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists("role");
};
