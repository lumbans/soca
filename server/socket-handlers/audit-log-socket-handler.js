// Soca: read-only access to the audit trail.
// Viewing the audit log is gated to the "users" permission (site_admin / CISO),
// since the trail itself is security-sensitive. The log is append-only — there is
// deliberately no socket event to edit or delete entries.
const { checkPermission } = require("../util-server");
const { R } = require("redbean-node");
const { AuditCategory, AuditAction } = require("../audit-log");

const MAX_PER_PAGE = 200;
const DEFAULT_PER_PAGE = 25;

/**
 * Serialize an audit_log row for the client.
 * @param {object} row Raw DB row
 * @returns {object} Plain audit entry
 */
function rowToJSON(row) {
    return {
        id: row.id,
        createdDate: row.created_date,
        userId: row.user_id,
        username: row.username,
        action: row.action,
        category: row.category,
        entityType: row.entity_type,
        entityId: row.entity_id,
        description: row.description,
        status: row.status,
        ip: row.ip,
    };
}

/**
 * Audit-log read handlers. All actions require the "users" permission.
 * @param {Socket} socket Socket.io socket instance
 * @returns {void}
 */
module.exports.auditLogSocketHandler = (socket) => {
    // Paginated, filterable list of audit entries (newest first).
    socket.on("getAuditLog", async (options, callback) => {
        try {
            checkPermission(socket, "users");

            options = options || {};

            const page = Math.max(1, parseInt(options.page, 10) || 1);
            let perPage = parseInt(options.perPage, 10) || DEFAULT_PER_PAGE;
            perPage = Math.min(Math.max(perPage, 1), MAX_PER_PAGE);

            // Build a parameterized WHERE clause from the provided filters.
            const conditions = [];
            const params = [];

            if (options.category) {
                conditions.push("category = ?");
                params.push(String(options.category));
            }
            if (options.action) {
                conditions.push("action = ?");
                params.push(String(options.action));
            }
            if (options.status) {
                conditions.push("status = ?");
                params.push(String(options.status));
            }
            if (options.username) {
                conditions.push("username LIKE ?");
                params.push(`%${options.username}%`);
            }
            if (options.search) {
                conditions.push("(description LIKE ? OR username LIKE ? OR ip LIKE ?)");
                const like = `%${options.search}%`;
                params.push(like, like, like);
            }
            if (options.dateFrom) {
                conditions.push("created_date >= ?");
                params.push(String(options.dateFrom));
            }
            if (options.dateTo) {
                conditions.push("created_date <= ?");
                params.push(String(options.dateTo));
            }

            const where = conditions.length ? ` WHERE ${conditions.join(" AND ")} ` : "";

            const total = await R.getCell(
                `SELECT COUNT(*) FROM audit_log ${where}`,
                params
            );

            const offset = (page - 1) * perPage;
            const rows = await R.getAll(
                `SELECT * FROM audit_log ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
                [ ...params, perPage, offset ]
            );

            callback({
                ok: true,
                logs: rows.map(rowToJSON),
                total: Number(total) || 0,
                page,
                perPage,
                // Surfaced so the frontend can build filter dropdowns.
                categories: Object.values(AuditCategory),
                actions: Object.values(AuditAction),
            });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });
};
