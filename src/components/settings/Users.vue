<template>
    <div>
        <!-- Soca: user & role management (site_admin only). -->
        <div class="add-btn">
            <button class="btn btn-primary me-2" type="button" @click="openAdd">
                <font-awesome-icon icon="plus" />
                {{ $t("Add User") }}
            </button>
        </div>

        <!-- Add / Edit form -->
        <div v-if="showForm" class="shadow-box form-panel mb-3">
            <h5 class="mb-3">{{ isEdit ? $t("Edit User") : $t("Add User") }}</h5>
            <form @submit.prevent="saveUser">
                <div class="mb-3">
                    <label class="form-label">{{ $t("Username") }}</label>
                    <input v-model="form.username" type="text" class="form-control" required autocomplete="off" />
                </div>

                <div v-if="!isEdit" class="mb-3">
                    <label class="form-label">{{ $t("Password") }}</label>
                    <input v-model="form.password" type="password" class="form-control" required autocomplete="new-password" />
                </div>

                <div class="mb-3">
                    <label class="form-label">{{ $t("Role") }}</label>
                    <select v-model="form.role" class="form-select">
                        <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
                    </select>
                </div>

                <div class="mb-3 form-check form-switch">
                    <input v-model="form.active" class="form-check-input" type="checkbox" />
                    <label class="form-check-label">{{ $t("Active") }}</label>
                </div>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">{{ $t("Save") }}</button>
                    <button type="button" class="btn btn-normal" @click="closeForm">{{ $t("Cancel") }}</button>
                </div>
            </form>
        </div>

        <!-- Reset password form -->
        <div v-if="showResetForm" class="shadow-box form-panel mb-3">
            <h5 class="mb-3">{{ $t("Reset Password") }} — {{ resetForm.username }}</h5>
            <form @submit.prevent="resetPassword">
                <div class="mb-3">
                    <label class="form-label">{{ $t("New Password") }}</label>
                    <input v-model="resetForm.password" type="password" class="form-control" required autocomplete="new-password" />
                </div>
                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">{{ $t("Save") }}</button>
                    <button type="button" class="btn btn-normal" @click="showResetForm = false">{{ $t("Cancel") }}</button>
                </div>
            </form>
        </div>

        <!-- User list -->
        <span v-if="users.length === 0" class="d-flex align-items-center justify-content-center my-3">
            {{ $t("No users") }}
        </span>

        <div v-for="user in users" :key="user.id" class="item" :class="{ inactive: !user.active }">
            <div class="left-part">
                <div class="circle"></div>
                <div class="info">
                    <div class="title">{{ user.username }}</div>
                    <div class="status">
                        <span class="badge bg-secondary">{{ roleLabel(user.role) }}</span>
                        <span v-if="!user.active" class="badge bg-danger ms-1">{{ $t("Inactive") }}</span>
                    </div>
                </div>
            </div>

            <div class="buttons">
                <div class="btn-group" role="group">
                    <button class="btn btn-normal" @click="openEdit(user)">
                        <font-awesome-icon icon="edit" />
                        {{ $t("Edit") }}
                    </button>
                    <button class="btn btn-normal" @click="openReset(user)">
                        <font-awesome-icon icon="key" />
                        {{ $t("Reset Password") }}
                    </button>
                    <button class="btn btn-danger" @click="deleteDialog(user)">
                        <font-awesome-icon icon="trash" />
                        {{ $t("Delete") }}
                    </button>
                </div>
            </div>
        </div>

        <Confirm ref="confirmDelete" btn-style="btn-danger" :yes-text="$t('Yes')" :no-text="$t('No')" @yes="deleteUser">
            {{ $t("Are you sure you want to delete this user?") }}
        </Confirm>
    </div>
</template>

<script>
import Confirm from "../Confirm.vue";

export default {
    components: {
        Confirm,
    },
    data() {
        return {
            users: [],
            showForm: false,
            isEdit: false,
            form: { id: null, username: "", password: "", role: "viewer", active: true },
            showResetForm: false,
            resetForm: { userID: null, username: "", password: "" },
            selectedUser: null,
            // Soca: roles are loaded dynamically so custom roles appear here too.
            roleOptions: [],
        };
    },

    mounted() {
        this.loadRoles();
        this.loadUsers();
    },

    methods: {
        /**
         * Load the list of users from the server.
         * @returns {void}
         */
        /**
         * Load available roles for the role dropdown.
         * @returns {void}
         */
        loadRoles() {
            this.$root.getSocket().emit("getRoleList", (res) => {
                if (res.ok) {
                    this.roleOptions = res.roles.map((r) => ({ value: r.key, label: r.name }));
                    // Default new-user role to "viewer" if present, else the first role.
                    if (!this.form.role || !this.roleOptions.some((r) => r.value === this.form.role)) {
                        this.form.role = this.roleOptions.some((r) => r.value === "viewer") ? "viewer" : (this.roleOptions[0]?.value ?? "viewer");
                    }
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        loadUsers() {
            this.$root.getSocket().emit("getUserList", (res) => {
                if (res.ok) {
                    this.users = res.users;
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        /**
         * Friendly label for a role value.
         * @param {string} role Role value
         * @returns {string} Display label
         */
        roleLabel(role) {
            return this.roleOptions.find((r) => r.value === role)?.label ?? role;
        },

        /**
         * Open the form in "add" mode.
         * @returns {void}
         */
        openAdd() {
            this.isEdit = false;
            this.form = { id: null, username: "", password: "", role: "viewer", active: true };
            this.showResetForm = false;
            this.showForm = true;
        },

        /**
         * Open the form in "edit" mode for a user.
         * @param {object} user User to edit
         * @returns {void}
         */
        openEdit(user) {
            this.isEdit = true;
            this.form = { id: user.id, username: user.username, password: "", role: user.role, active: !!user.active };
            this.showResetForm = false;
            this.showForm = true;
        },

        /**
         * Close the add/edit form.
         * @returns {void}
         */
        closeForm() {
            this.showForm = false;
        },

        /**
         * Save (create or update) a user.
         * @returns {void}
         */
        saveUser() {
            const socket = this.$root.getSocket();
            const cb = (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.showForm = false;
                    this.loadUsers();
                }
            };

            if (this.isEdit) {
                socket.emit("editUser", {
                    id: this.form.id,
                    username: this.form.username,
                    role: this.form.role,
                    active: this.form.active,
                }, cb);
            } else {
                socket.emit("addUser", {
                    username: this.form.username,
                    password: this.form.password,
                    role: this.form.role,
                    active: this.form.active,
                }, cb);
            }
        },

        /**
         * Open the reset-password form for a user.
         * @param {object} user User to reset
         * @returns {void}
         */
        openReset(user) {
            this.resetForm = { userID: user.id, username: user.username, password: "" };
            this.showForm = false;
            this.showResetForm = true;
        },

        /**
         * Submit a password reset.
         * @returns {void}
         */
        resetPassword() {
            this.$root.getSocket().emit("resetUserPassword", this.resetForm.userID, this.resetForm.password, (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.showResetForm = false;
                }
            });
        },

        /**
         * Show the delete-confirmation dialog.
         * @param {object} user User to delete
         * @returns {void}
         */
        deleteDialog(user) {
            this.selectedUser = user;
            this.$refs.confirmDelete.show();
        },

        /**
         * Delete the selected user.
         * @returns {void}
         */
        deleteUser() {
            this.$root.getSocket().emit("deleteUser", this.selectedUser.id, (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.loadUsers();
                }
            });
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../../assets/vars.scss";

.add-btn {
    padding-top: 20px;
    padding-bottom: 20px;
}

.form-panel {
    padding: 20px;
}

.item {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 10px;
    transition: all ease-in-out 0.15s;
    justify-content: space-between;
    padding: 10px;
    min-height: 70px;
    margin-bottom: 5px;

    &:hover {
        background-color: $highlight-white;
    }

    &.inactive {
        .left-part {
            opacity: 0.4;
        }
    }

    .left-part {
        display: flex;
        gap: 12px;
        align-items: center;

        .circle {
            width: 25px;
            height: 25px;
            border-radius: 50rem;
            background-color: $primary;
        }

        .info {
            .title {
                font-weight: bold;
                font-size: 20px;
            }

            .status {
                font-size: 14px;
            }
        }
    }
}

.dark {
    .item:hover {
        background-color: $dark-bg2;
    }
}
</style>
