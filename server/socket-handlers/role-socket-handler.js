const { checkPermission } = require("../util-server");
const { R } = require("redbean-node");
const { log } = require("../../src/util");
const { PERMISSIONS, ROLES, reloadRoles } = require("../permissions");
const { auditFromSocket, AuditAction, AuditCategory } = require("../audit-log");

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

/**
 * Keep only valid, unique capability keys.
 * @param {any} permissions Candidate permission list
 * @returns {string[]} Cleaned permission keys
 */
function cleanPermissions(permissions) {
    if (!Array.isArray(permissions)) {
        return [];
    }
    return [ ...new Set(permissions.filter((p) => ALL_PERMISSIONS.includes(p))) ];
}

/**
 * Turn a role name into a url-safe unique key.
 * @param {string} name Role display name
 * @returns {Promise<string>} A unique role key
 */
async function makeUniqueKey(name) {
    let base = (name || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!base) {
        base = "role";
    }
    let key = base;
    let i = 2;
    while (await R.findOne("role", " key = ? ", [ key ])) {
        key = `${base}_${i++}`;
    }
    return key;
}

/**
 * Serialize a role bean for the client, including how many users use it.
 * @param {object} bean Role bean
 * @returns {Promise<object>} Plain role object
 */
async function roleToJSON(bean) {
    let permissions;
    try {
        permissions = JSON.parse(bean.permissions || "[]");
    } catch (e) {
        permissions = [];
    }
    const userCount = (await R.count("user", " role = ? ", [ bean.key ]));
    return {
        id: bean.id,
        key: bean.key,
        name: bean.name,
        description: bean.description,
        permissions,
        builtin: !!bean.builtin,
        userCount,
    };
}

/**
 * Role management handlers. All actions require the "users" permission.
 * @param {Socket} socket Socket.io socket instance
 * @returns {void}
 */
module.exports.roleSocketHandler = (socket) => {
    socket.on("getRoleList", async (callback) => {
        try {
            checkPermission(socket, "users");
            const rows = await R.findAll("role", " ORDER BY builtin DESC, name ");
            const roles = [];
            for (const row of rows) {
                roles.push(await roleToJSON(row));
            }
            callback({ ok: true, roles, availablePermissions: ALL_PERMISSIONS });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("addRole", async (data, callback) => {
        try {
            checkPermission(socket, "users");

            const name = (data?.name || "").trim();
            if (!name) {
                throw new Error("Role name is required.");
            }
            const permissions = cleanPermissions(data?.permissions);

            const role = R.dispense("role");
            role.key = await makeUniqueKey(name);
            role.name = name;
            role.description = (data?.description || "").trim();
            role.permissions = JSON.stringify(permissions);
            role.builtin = false;
            await R.store(role);
            await reloadRoles();

            log.info("manage", `Added role: ${role.key} by User ID: ${socket.userID}`);
            await auditFromSocket(socket, {
                action: AuditAction.ROLE_CREATE,
                category: AuditCategory.ROLE,
                entityType: "role",
                entityId: role.key,
                description: `Created role "${role.name}" with permissions [${permissions.join(", ") || "none"}]`,
            });
            callback({ ok: true, msg: "Role added.", key: role.key });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("editRole", async (data, callback) => {
        try {
            checkPermission(socket, "users");

            const role = await R.findOne("role", " key = ? ", [ data?.key ]);
            if (!role) {
                throw new Error("Role not found.");
            }
            const name = (data?.name || "").trim();
            if (!name) {
                throw new Error("Role name is required.");
            }
            let permissions = cleanPermissions(data?.permissions);

            // Anti-lockout: the site_admin role must always keep the "users" permission.
            if (role.key === ROLES.SITE_ADMIN && !permissions.includes("users")) {
                throw new Error("The site admin role must keep the 'users' permission.");
            }

            role.name = name;
            role.description = (data?.description || "").trim();
            role.permissions = JSON.stringify(permissions);
            await R.store(role);
            await reloadRoles();

            log.info("manage", `Edited role: ${role.key} by User ID: ${socket.userID}`);
            await auditFromSocket(socket, {
                action: AuditAction.ROLE_UPDATE,
                category: AuditCategory.ROLE,
                entityType: "role",
                entityId: role.key,
                description: `Updated role "${role.name}" with permissions [${permissions.join(", ") || "none"}]`,
            });
            callback({ ok: true, msg: "Role updated." });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    socket.on("deleteRole", async (key, callback) => {
        try {
            checkPermission(socket, "users");

            const role = await R.findOne("role", " key = ? ", [ key ]);
            if (!role) {
                return callback({ ok: true, msg: "Role deleted." });
            }
            if (role.key === ROLES.SITE_ADMIN) {
                throw new Error("The site admin role cannot be deleted.");
            }
            if (role.builtin) {
                throw new Error("Built-in roles cannot be deleted (you can still edit their permissions).");
            }
            const userCount = await R.count("user", " role = ? ", [ key ]);
            if (userCount > 0) {
                throw new Error(`This role is assigned to ${userCount} user(s). Reassign them first.`);
            }

            await R.exec("DELETE FROM `role` WHERE key = ? ", [ key ]);
            await reloadRoles();

            log.info("manage", `Deleted role: ${key} by User ID: ${socket.userID}`);
            await auditFromSocket(socket, {
                action: AuditAction.ROLE_DELETE,
                category: AuditCategory.ROLE,
                entityType: "role",
                entityId: key,
                description: `Deleted role "${role.name}"`,
            });
            callback({ ok: true, msg: "Role deleted." });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });
};
