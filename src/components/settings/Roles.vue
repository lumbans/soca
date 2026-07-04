<template>
    <div>
        <!-- Soca: role management (site_admin only). -->
        <div class="add-btn">
            <button class="btn btn-primary me-2" type="button" @click="openAdd">
                <font-awesome-icon icon="plus" />
                {{ $t("Add Role") }}
            </button>
        </div>

        <!-- Add / Edit form -->
        <div v-if="showForm" class="shadow-box form-panel mb-3">
            <h5 class="mb-3">{{ isEdit ? $t("Edit Role") : $t("Add Role") }}</h5>
            <form @submit.prevent="saveRole">
                <div class="mb-3">
                    <label class="form-label">{{ $t("Role Name") }}</label>
                    <input v-model="form.name" type="text" class="form-control" required autocomplete="off" />
                </div>
                <div class="mb-3">
                    <label class="form-label">{{ $t("Description") }}</label>
                    <input v-model="form.description" type="text" class="form-control" autocomplete="off" />
                </div>

                <div class="mb-3">
                    <label class="form-label">{{ $t("Permissions") }}</label>
                    <div v-for="perm in permissionDefs" :key="perm.key" class="form-check">
                        <input
                            :id="'perm-' + perm.key"
                            v-model="form.permissions"
                            class="form-check-input"
                            type="checkbox"
                            :value="perm.key"
                            :disabled="isEdit && form.key === 'site_admin' && perm.key === 'users'"
                        />
                        <label class="form-check-label" :for="'perm-' + perm.key">
                            <strong>{{ perm.label }}</strong> — <span class="text-muted">{{ perm.desc }}</span>
                        </label>
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <button type="submit" class="btn btn-primary">{{ $t("Save") }}</button>
                    <button type="button" class="btn btn-normal" @click="showForm = false">{{ $t("Cancel") }}</button>
                </div>
            </form>
        </div>

        <!-- Role list -->
        <div v-for="role in roles" :key="role.key" class="item">
            <div class="left-part">
                <div class="info">
                    <div class="title">
                        {{ role.name }}
                        <span v-if="role.builtin" class="badge bg-secondary ms-1">{{ $t("Built-in") }}</span>
                    </div>
                    <div class="desc text-muted">{{ role.description }}</div>
                    <div class="perms mt-1">
                        <span v-if="role.permissions.length === 0" class="badge bg-light text-dark">{{ $t("Read-only") }}</span>
                        <span v-for="p in role.permissions" :key="p" class="badge bg-primary me-1">{{ permLabel(p) }}</span>
                    </div>
                    <div class="small text-muted mt-1">{{ role.userCount }} {{ $t("user(s)") }} · <code>{{ role.key }}</code></div>
                </div>
            </div>

            <div class="buttons">
                <div class="btn-group" role="group">
                    <button class="btn btn-normal" @click="openEdit(role)">
                        <font-awesome-icon icon="edit" />
                        {{ $t("Edit") }}
                    </button>
                    <button
                        class="btn btn-danger"
                        :disabled="role.builtin"
                        :title="role.builtin ? $t('Built-in roles cannot be deleted') : ''"
                        @click="deleteDialog(role)"
                    >
                        <font-awesome-icon icon="trash" />
                        {{ $t("Delete") }}
                    </button>
                </div>
            </div>
        </div>

        <Confirm ref="confirmDelete" btn-style="btn-danger" :yes-text="$t('Yes')" :no-text="$t('No')" @yes="deleteRole">
            {{ $t("Are you sure you want to delete this role?") }}
        </Confirm>
    </div>
</template>

<script>
import Confirm from "../Confirm.vue";

export default {
    components: { Confirm },
    data() {
        return {
            roles: [],
            showForm: false,
            isEdit: false,
            form: { key: null, name: "", description: "", permissions: [] },
            selectedRole: null,
            permissionDefs: [
                { key: "users", label: this.$t("Manage Users & Roles"), desc: this.$t("create/edit/delete users and roles") },
                { key: "settings", label: this.$t("Manage Settings"), desc: this.$t("system settings, notifications, proxies, API keys, etc.") },
                { key: "components", label: this.$t("Manage Components"), desc: this.$t("monitors, status pages, maintenance") },
                { key: "incidents", label: this.$t("Manage Incidents"), desc: this.$t("create/resolve/update incidents") },
            ],
        };
    },
    mounted() {
        this.loadRoles();
    },
    methods: {
        loadRoles() {
            this.$root.getSocket().emit("getRoleList", (res) => {
                if (res.ok) {
                    this.roles = res.roles;
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },
        permLabel(key) {
            return this.permissionDefs.find((p) => p.key === key)?.label ?? key;
        },
        openAdd() {
            this.isEdit = false;
            this.form = { key: null, name: "", description: "", permissions: [] };
            this.showForm = true;
        },
        openEdit(role) {
            this.isEdit = true;
            this.form = { key: role.key, name: role.name, description: role.description || "", permissions: [ ...role.permissions ] };
            this.showForm = true;
        },
        saveRole() {
            const socket = this.$root.getSocket();
            const cb = (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.showForm = false;
                    this.loadRoles();
                }
            };
            if (this.isEdit) {
                socket.emit("editRole", { key: this.form.key, name: this.form.name, description: this.form.description, permissions: this.form.permissions }, cb);
            } else {
                socket.emit("addRole", { name: this.form.name, description: this.form.description, permissions: this.form.permissions }, cb);
            }
        },
        deleteDialog(role) {
            this.selectedRole = role;
            this.$refs.confirmDelete.show();
        },
        deleteRole() {
            this.$root.getSocket().emit("deleteRole", this.selectedRole.key, (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.loadRoles();
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
    padding: 12px;
    margin-bottom: 5px;

    &:hover {
        background-color: $highlight-white;
    }

    .left-part .info {
        .title {
            font-weight: bold;
            font-size: 18px;
        }

        .desc {
            font-size: 14px;
        }
    }
}

.dark {
    .item:hover {
        background-color: $dark-bg2;
    }
}
</style>
