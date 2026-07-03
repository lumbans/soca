// Soca: audit trail helper.
//
// `audit()` writes one append-only row to the `audit_log` table. It never throws
// — auditing must not break the action it is recording — failures are logged and
// swallowed. `auditFromSocket()` is the convenience wrapper for socket handlers:
// it fills in the acting user and client IP from the socket.
const { R } = require("redbean-node");
const dayjs = require("dayjs");
const { log } = require("../src/util");

/**
 * Coarse groupings used for filtering the audit log.
 * @readonly
 * @enum {string}
 */
const AuditCategory = {
    AUTH: "auth",
    USER: "user",
    ROLE: "role",
    SETTING: "setting",
    COMPONENT: "component",
};

/**
 * Outcome of an audited action.
 * @readonly
 * @enum {string}
 */
const AuditStatus = {
    SUCCESS: "success",
    FAILURE: "failure",
};

/**
 * Machine-readable action keys. Keeping them as constants avoids typos and makes
 * the set of audited events discoverable in one place.
 * @readonly
 * @enum {string}
 */
const AuditAction = {
    // Authentication
    LOGIN_SUCCESS: "login.success",
    LOGIN_FAILURE: "login.failure",
    LOGOUT: "logout",
    TWOFA_ENABLE: "2fa.enable",
    TWOFA_DISABLE: "2fa.disable",
    PASSWORD_CHANGE: "password.change",

    // User management
    USER_CREATE: "user.create",
    USER_UPDATE: "user.update",
    USER_DELETE: "user.delete",
    USER_PASSWORD_RESET: "user.password_reset",

    // Role management
    ROLE_CREATE: "role.create",
    ROLE_UPDATE: "role.update",
    ROLE_DELETE: "role.delete",

    // Settings
    SETTING_UPDATE: "setting.update",

    // Components (monitors)
    MONITOR_CREATE: "monitor.create",
    MONITOR_UPDATE: "monitor.update",
    MONITOR_DELETE: "monitor.delete",
    MONITOR_PAUSE: "monitor.pause",
    MONITOR_RESUME: "monitor.resume",
};

/**
 * Write a single audit-log entry. Never throws.
 * @param {object} entry Audit entry with optional fields: userId (acting user id,
 *   null for anonymous/system), username (denormalized actor), category (one of
 *   AuditCategory), entityType, entityId, description, status (one of AuditStatus,
 *   default "success") and ip (client IP)
 * @param {string} entry.action One of AuditAction (required)
 * @returns {Promise<void>} Resolves once written (or after a swallowed error)
 */
async function audit(entry) {
    try {
        const bean = R.dispense("audit_log");
        bean.created_date = R.isoDateTime(dayjs.utc());
        bean.user_id = entry.userId ?? null;
        bean.username = entry.username ?? null;
        bean.action = entry.action;
        bean.category = entry.category ?? "general";
        bean.entity_type = entry.entityType ?? null;
        bean.entity_id = (entry.entityId !== undefined && entry.entityId !== null) ? String(entry.entityId) : null;
        bean.description = entry.description ?? null;
        bean.status = entry.status ?? AuditStatus.SUCCESS;
        bean.ip = entry.ip ?? null;
        await R.store(bean);
    } catch (e) {
        // Auditing failures must not break the underlying action.
        log.warn("audit", `Failed to write audit log (action=${entry?.action}): ${e.message}`);
    }
}

/**
 * Best-effort client IP for a socket, proxy-aware when the server is available.
 * @param {Socket} socket Socket.io socket
 * @returns {Promise<string|null>} Client IP, or null if it cannot be determined
 */
async function socketIP(socket) {
    try {
        // Lazy require to avoid load-order/circular-dependency issues at startup.
        const { UptimeKumaServer } = require("./uptime-kuma-server");
        return await UptimeKumaServer.getInstance().getClientIP(socket);
    } catch (e) {
        return socket?.client?.conn?.remoteAddress ?? null;
    }
}

/**
 * Write an audit entry attributed to the user behind a socket, filling in the
 * acting user id/username and client IP automatically.
 * @param {Socket} socket Socket.io socket
 * @param {object} entry Audit entry (see {@link audit}); actor/ip are overridden
 * @returns {Promise<void>} Resolves once written
 */
async function auditFromSocket(socket, entry) {
    const ip = await socketIP(socket);
    return audit({
        userId: socket?.userID ?? null,
        username: socket?.username ?? null,
        ip,
        ...entry,
    });
}

module.exports = {
    AuditCategory,
    AuditStatus,
    AuditAction,
    audit,
    auditFromSocket,
};
