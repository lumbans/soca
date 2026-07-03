const { checkPermission } = require("../util-server");
const { R } = require("redbean-node");
const { log } = require("../../src/util");
const { passwordStrength } = require("check-password-strength");
const passwordHash = require("../password-hash");
const User = require("../model/user");
const { isValidRole, getRoleCache } = require("../permissions");
const { UptimeKumaServer } = require("../uptime-kuma-server");
const { auditFromSocket, AuditAction, AuditCategory } = require("../audit-log");

/**
 * Soca: role keys that grant the "users" permission (i.e. can manage users/roles).
 * @returns {string[]} Admin-capable role keys
 */
function adminRoleKeys() {
    const keys = [];
    for (const [ key, role ] of getRoleCache()) {
        if (role.permissions.has("users")) {
            keys.push(key);
        }
    }
    return keys;
}

/**
 * Soca: whether a role can manage users (grants the "users" permission).
 * @param {string} roleKey Role key
 * @returns {boolean} True if the role grants "users"
 */
function roleGrantsUsers(roleKey) {
    const role = getRoleCache().get(roleKey);
    return !!role && role.permissions.has("users");
}

/**
 * Soca: count active users who can manage users, to prevent locking everyone out.
 * @returns {Promise<number>} Number of active admin-capable users
 */
async function countActiveAdmins() {
    const keys = adminRoleKeys();
    if (keys.length === 0) {
        return 0;
    }
    const placeholders = keys.map(() => "?").join(",");
    return await R.count("user", ` active = 1 AND role IN (${placeholders}) `, keys);
}

/**
 * Soca: validate a desired password, throwing on weak/empty values.
 * @param {string} password Candidate password
 * @returns {void}
 * @throws {Error} The password is empty or too weak
 */
function assertStrongPassword(password) {
    if (!password) {
        throw new Error("Password is required.");
    }
    if (passwordStrength(password).value === "Too weak") {
        throw new Error("Password is too weak. Please use a stronger password.");
    }
}

/**
 * Handlers for managing user accounts and roles. All actions require the
 * "users" permission (site_admin only).
 * @param {Socket} socket Socket.io socket instance
 * @returns {void}
 */
module.exports.userSocketHandler = (socket) => {
    // List all users (no secrets).
    socket.on("getUserList", async (callback) => {
        try {
            checkPermission(socket, "users");

            const users = await R.getAll(
                "SELECT id, username, role, active FROM `user` ORDER BY id"
            );

            callback({
                ok: true,
                users: users.map((u) => ({
                    id: u.id,
                    username: u.username,
                    role: u.role,
                    active: !!u.active,
                })),
            });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    // Create a new user.
    socket.on("addUser", async (newUser, callback) => {
        try {
            checkPermission(socket, "users");

            const username = (newUser?.username || "").trim();
            if (!username) {
                throw new Error("Username is required.");
            }
            if (!isValidRole(newUser?.role)) {
                throw new Error("Invalid role.");
            }
            assertStrongPassword(newUser?.password);

            const existing = await R.findOne("user", " username = ? ", [ username ]);
            if (existing) {
                throw new Error("A user with this username already exists.");
            }

            const user = R.dispense("user");
            user.username = username;
            user.password = await passwordHash.generate(newUser.password);
            user.role = newUser.role;
            user.active = newUser.active === false ? 0 : 1;
            const id = await R.store(user);

            log.info("manage", `Added user: ${username} (role=${newUser.role}) by User ID: ${socket.userID}`);
            await auditFromSocket(socket, {
                action: AuditAction.USER_CREATE,
                category: AuditCategory.USER,
                entityType: "user",
                entityId: id,
                description: `Created user "${username}" with role "${newUser.role}"${user.active ? "" : " (inactive)"}`,
            });

            callback({ ok: true, msg: "User added.", userID: id });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    // Edit an existing user's username, role and active flag (not password).
    socket.on("editUser", async (editedUser, callback) => {
        try {
            checkPermission(socket, "users");

            const userID = Number(editedUser?.id);
            const user = await R.findOne("user", " id = ? ", [ userID ]);
            if (!user) {
                throw new Error("User not found.");
            }

            if (!isValidRole(editedUser?.role)) {
                throw new Error("Invalid role.");
            }

            const username = (editedUser?.username || "").trim();
            if (!username) {
                throw new Error("Username is required.");
            }
            if (username !== user.username) {
                const clash = await R.findOne("user", " username = ? AND id != ? ", [ username, userID ]);
                if (clash) {
                    throw new Error("A user with this username already exists.");
                }
            }

            const newActive = editedUser?.active === false ? 0 : 1;
            const willBeActiveAdmin = roleGrantsUsers(editedUser.role) && newActive === 1;
            const wasActiveAdmin = roleGrantsUsers(user.role) && user.active;

            // Anti-lockout: never let the last active user-manager be demoted/deactivated.
            if (wasActiveAdmin && !willBeActiveAdmin) {
                if ((await countActiveAdmins()) <= 1) {
                    throw new Error("Cannot demote or deactivate the last active user with the 'users' permission.");
                }
            }

            user.username = username;
            user.role = editedUser.role;
            user.active = newActive;
            await R.store(user);

            log.info("manage", `Edited user: ${username} (role=${editedUser.role}, active=${newActive}) by User ID: ${socket.userID}`);
            await auditFromSocket(socket, {
                action: AuditAction.USER_UPDATE,
                category: AuditCategory.USER,
                entityType: "user",
                entityId: userID,
                description: `Updated user "${username}" (role=${editedUser.role}, active=${newActive ? "yes" : "no"})`,
            });

            // Force the affected user to reconnect so the new role/active state applies.
            UptimeKumaServer.getInstance().disconnectAllSocketClients(userID, socket.id);

            callback({ ok: true, msg: "User updated." });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    // Reset another user's password.
    socket.on("resetUserPassword", async (userID, newPassword, callback) => {
        try {
            checkPermission(socket, "users");

            userID = Number(userID);
            const user = await R.findOne("user", " id = ? ", [ userID ]);
            if (!user) {
                throw new Error("User not found.");
            }
            assertStrongPassword(newPassword);

            await User.resetPassword(userID, newPassword);

            log.info("manage", `Reset password for user ID: ${userID} by User ID: ${socket.userID}`);
            await auditFromSocket(socket, {
                action: AuditAction.USER_PASSWORD_RESET,
                category: AuditCategory.USER,
                entityType: "user",
                entityId: userID,
                description: `Reset password for user "${user.username}"`,
            });

            // Force re-login of the affected user's other sessions.
            UptimeKumaServer.getInstance().disconnectAllSocketClients(userID, socket.id);

            callback({ ok: true, msg: "Password updated." });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });

    // Delete a user.
    socket.on("deleteUser", async (userID, callback) => {
        try {
            checkPermission(socket, "users");

            userID = Number(userID);
            const user = await R.findOne("user", " id = ? ", [ userID ]);
            if (!user) {
                // Already gone — treat as success.
                return callback({ ok: true, msg: "User deleted." });
            }

            // Anti-lockout: never delete the last active user with the "users" permission.
            if (roleGrantsUsers(user.role) && user.active && (await countActiveAdmins()) <= 1) {
                throw new Error("Cannot delete the last active user with the 'users' permission.");
            }

            await R.exec("DELETE FROM `user` WHERE id = ? ", [ userID ]);

            log.info("manage", `Deleted user ID: ${userID} by User ID: ${socket.userID}`);
            await auditFromSocket(socket, {
                action: AuditAction.USER_DELETE,
                category: AuditCategory.USER,
                entityType: "user",
                entityId: userID,
                description: `Deleted user "${user.username}" (role=${user.role})`,
            });

            // Disconnect any active sessions of the deleted user.
            UptimeKumaServer.getInstance().disconnectAllSocketClients(userID, socket.id);

            callback({ ok: true, msg: "User deleted." });
        } catch (e) {
            callback({ ok: false, msg: e.message });
        }
    });
};
