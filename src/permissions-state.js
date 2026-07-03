// Soca: a shared snapshot of the current user's role/permissions, kept in sync by
// the socket mixin (on the "currentUser" event). The router reads this to gate
// navigation. This is UX / defense-in-depth only — the server always enforces the
// real permission checks.
export const permissionsState = {
    role: null,
    permissions: {},
    loaded: false,
};

/**
 * Update the shared permission snapshot.
 * @param {?string} role The current user's role
 * @param {object} permissions Map of permission -> boolean
 * @returns {void}
 */
export function setPermissions(role, permissions) {
    permissionsState.role = role ?? null;
    permissionsState.permissions = permissions ?? {};
    permissionsState.loaded = true;
}

/**
 * Reset the snapshot (e.g. on logout).
 * @returns {void}
 */
export function clearPermissions() {
    permissionsState.role = null;
    permissionsState.permissions = {};
    permissionsState.loaded = false;
}

/**
 * Does the current user have a permission?
 * @param {string} permission One of "users" | "settings" | "components" | "incidents"
 * @returns {boolean} True if granted
 */
export function can(permission) {
    return permissionsState.permissions?.[permission] === true;
}
