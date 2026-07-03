<template>
    <div>
        <!-- Soca: read-only audit trail (site_admin / "users" permission). -->
        <p class="text-muted mt-3">
            {{ $t("auditLogDescription") }}
        </p>

        <!-- Filters -->
        <div class="row g-2 align-items-end mb-3">
            <div class="col-md-3">
                <label class="form-label">{{ $t("Category") }}</label>
                <select v-model="filters.category" class="form-select" @change="reload">
                    <option value="">{{ $t("All") }}</option>
                    <option v-for="c in categories" :key="c" :value="c">{{ categoryLabel(c) }}</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">{{ $t("Status") }}</label>
                <select v-model="filters.status" class="form-select" @change="reload">
                    <option value="">{{ $t("All") }}</option>
                    <option value="success">{{ $t("Success") }}</option>
                    <option value="failure">{{ $t("Failure") }}</option>
                </select>
            </div>
            <div class="col-md-4">
                <label class="form-label">{{ $t("Search") }}</label>
                <input v-model.trim="filters.search" type="text" class="form-control" :placeholder="$t('auditLogSearchPlaceholder')" @keyup.enter="reload" />
            </div>
            <div class="col-md-2 d-grid">
                <button class="btn btn-primary" type="button" @click="reload">
                    <font-awesome-icon icon="search" /> {{ $t("Search") }}
                </button>
            </div>
        </div>

        <div class="text-muted mb-2">
            {{ $t("auditLogTotalEntries", [ total ]) }}
        </div>

        <!-- Table -->
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead>
                    <tr>
                        <th>{{ $t("Time") }}</th>
                        <th>{{ $t("User") }}</th>
                        <th>{{ $t("Action") }}</th>
                        <th>{{ $t("Description") }}</th>
                        <th>{{ $t("Status") }}</th>
                        <th>IP</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="logs.length === 0">
                        <td colspan="6" class="text-center text-muted py-4">{{ $t("auditLogEmpty") }}</td>
                    </tr>
                    <tr v-for="entry in logs" :key="entry.id">
                        <td class="text-nowrap"><Datetime :value="entry.createdDate" /></td>
                        <td>{{ entry.username || "—" }}</td>
                        <td><span class="badge bg-secondary">{{ entry.action }}</span></td>
                        <td>{{ entry.description }}</td>
                        <td>
                            <span class="badge" :class="entry.status === 'failure' ? 'bg-danger' : 'bg-success'">
                                {{ entry.status }}
                            </span>
                        </td>
                        <td class="text-nowrap">{{ entry.ip || "—" }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="d-flex justify-content-center align-items-center gap-2 mt-3">
            <button class="btn btn-normal" :disabled="page <= 1" @click="goto(page - 1)">
                <font-awesome-icon icon="angle-left" />
            </button>
            <span>{{ $t("auditLogPage", [ page, totalPages ]) }}</span>
            <button class="btn btn-normal" :disabled="page >= totalPages" @click="goto(page + 1)">
                <font-awesome-icon icon="angle-right" />
            </button>
        </div>
    </div>
</template>

<script>
import Datetime from "../Datetime.vue";

export default {
    components: {
        Datetime,
    },
    data() {
        return {
            logs: [],
            categories: [],
            total: 0,
            page: 1,
            perPage: 25,
            filters: {
                category: "",
                status: "",
                search: "",
            },
        };
    },

    computed: {
        totalPages() {
            return Math.max(1, Math.ceil(this.total / this.perPage));
        },
    },

    mounted() {
        this.load();
    },

    methods: {
        /**
         * Load the current page of audit entries from the server.
         * @returns {void}
         */
        load() {
            this.$root.getSocket().emit("getAuditLog", {
                page: this.page,
                perPage: this.perPage,
                category: this.filters.category || undefined,
                status: this.filters.status || undefined,
                search: this.filters.search || undefined,
            }, (res) => {
                if (res.ok) {
                    this.logs = res.logs;
                    this.total = res.total;
                    this.categories = res.categories;
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        /**
         * Reset to the first page and reload (used when filters change).
         * @returns {void}
         */
        reload() {
            this.page = 1;
            this.load();
        },

        /**
         * Jump to a given page.
         * @param {number} p Page number
         * @returns {void}
         */
        goto(p) {
            this.page = Math.min(Math.max(1, p), this.totalPages);
            this.load();
        },

        /**
         * Friendly label for a category key.
         * @param {string} category Category key
         * @returns {string} Display label
         */
        categoryLabel(category) {
            const map = {
                auth: this.$t("Authentication"),
                user: this.$t("Users"),
                role: this.$t("Roles"),
                setting: this.$t("Settings"),
                component: this.$t("Components"),
            };
            return map[category] || category;
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../../assets/vars.scss";

.table {
    font-size: 14px;
}

.badge {
    font-weight: normal;
}
</style>
