// Soca: Role-based access control (RBAC).
//
// Roles are stored in the `role` DB table and can be created/edited/deleted by a
// site_admin. The set of CAPABILITIES is fixed (each maps to enforcement points in
// the code); a role is a named combination of those capabilities.
//
// The server enforces checks via util-server `checkPermission`; the frontend gets
// the computed permission booleans for UI gating only.
const { R } = require("redbean-node");

/**
 * Fixed capabilities. New capability *types* require code changes (they map to
 * checkPermission() call sites), but roles can mix these freely.
 * `view` (read-only dashboard) is implicit for every logged-in user.
 * @readonly
 * @enum {string}
 */
const PERMISSIONS = {
    USERS: "users", // manage user accounts & roles
    SETTINGS: "settings", // global/infra settings, notifications, proxies, etc.
    COMPONENTS: "components", // monitors, status pages, maintenance, daily notes
    INCIDENTS: "incidents", // incident lifecycle
};

/**
 * Built-in role keys kept as constants for code that references them directly
 * (e.g. the first setup user is site_admin).
 * @readonly
 * @enum {string}
 */
const ROLES = {
    SITE_ADMIN: "site_admin",
    PAGE_ADMIN: "page_admin",
    INCIDENT_MGR: "incident_mgr",
    COMPONENT_MGR: "component_mgr",
    VIEWER: "viewer",
};

// In-memory cache: roleKey -> { name, description, permissions: Set<string>, builtin: boolean }
// Loaded from the DB at startup and refreshed after any role mutation so that
// checkPermission() can stay synchronous.
let roleCache = new Map();

/**
 * (Re)load all roles from the DB into the in-memory cache.
 * @returns {Promise<Map<string, object>>} The populated cache
 */
async function reloadRoles() {
    const rows = await R.findAll("role");
    const map = new Map();
    for (const row of rows) {
        let permissions;
        try {
            permissions = JSON.parse(row.permissions || "[]");
        } catch (e) {
            permissions = [];
        }
        map.set(row.key, {
            name: row.name,
            description: row.description,
            permissions: new Set(permissions),
            builtin: !!row.builtin,
        });
    }
    roleCache = map;
    return map;
}

/**
 * Whether the given role exists.
 * @param {string} roleKey Role key to validate
 * @returns {boolean} True if it is a known role
 */
function isValidRole(roleKey) {
    return roleCache.has(roleKey);
}

/**
 * Whether a role is granted a capability.
 * @param {string} roleKey The user's role key
 * @param {string} permission One of PERMISSIONS
 * @returns {boolean} True if allowed
 */
function roleHasPermission(roleKey, permission) {
    const role = roleCache.get(roleKey);
    return !!role && role.permissions.has(permission);
}

/**
 * Compute the permission booleans for a role, sent to the frontend for UI gating.
 * @param {string} roleKey The user's role key
 * @returns {Record<string, boolean>} Map of permission -> granted
 */
function getPermissions(roleKey) {
    const result = {};
    for (const permission of Object.values(PERMISSIONS)) {
        result[permission] = roleHasPermission(roleKey, permission);
    }
    return result;
}

/**
 * Get the in-memory role cache (read-only use).
 * @returns {Map<string, object>} The role cache
 */
function getRoleCache() {
    return roleCache;
}

module.exports = {
    PERMISSIONS,
    ROLES,
    reloadRoles,
    isValidRole,
    roleHasPermission,
    getPermissions,
    getRoleCache,
};
