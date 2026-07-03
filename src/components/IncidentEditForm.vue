<template>
    <div
        class="shadow-box alert mb-4 p-4 incident"
        role="alert"
        :class="'bg-' + modelValue.style"
        data-testid="incident-edit"
    >
        <strong>{{ $t("Title") }}:</strong>
        <Editable
            :model-value="modelValue.title"
            tag="h4"
            :contenteditable="true"
            :noNL="true"
            class="alert-heading"
            data-testid="incident-title"
            @update:model-value="updateField('title', $event)"
        />

        <strong>{{ $t("Content") }}:</strong>
        <Editable
            :model-value="modelValue.content"
            tag="div"
            :contenteditable="true"
            class="content"
            data-testid="incident-content-editable"
            @update:model-value="updateField('content', $event)"
        />
        <div class="form-text">
            {{ $t("markdownSupported") }}
        </div>

        <!-- Soca: lifecycle status + impact level -->
        <div class="row g-2 mt-2">
            <div class="col-auto">
                <label class="form-label mb-0 small">{{ $t("Status") }}</label>
                <select
                    :value="modelValue.incidentStatus || 'investigating'"
                    class="form-select form-select-sm"
                    data-testid="incident-status"
                    @change="updateField('incidentStatus', $event.target.value)"
                >
                    <option value="investigating">Investigating</option>
                    <option value="identified">Identified</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="update">Update</option>
                    <option value="resolved">Resolved</option>
                </select>
            </div>
            <div class="col-auto">
                <label class="form-label mb-0 small">Impact</label>
                <select
                    :value="modelValue.impact || 'none'"
                    class="form-select form-select-sm"
                    data-testid="incident-impact"
                    @change="updateField('impact', $event.target.value)"
                >
                    <option value="none">None</option>
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                </select>
            </div>
        </div>

        <!-- Soca: affected systems (monitors) -->
        <div v-if="monitors.length" class="mt-2">
            <label class="form-label mb-1 small d-block">Sistem terdampak</label>
            <div class="bm-affected">
                <label v-for="m in monitors" :key="m.id" class="bm-affected-item">
                    <input
                        type="checkbox"
                        :checked="isAffected(m.id)"
                        @change="toggleMonitor(m.id)"
                    />
                    <span>{{ m.name }}</span>
                </label>
            </div>
        </div>

        <div class="mt-3">
            <button class="btn btn-light me-2" data-testid="post-incident-button" @click="$emit('post')">
                <font-awesome-icon icon="bullhorn" />
                {{ $t("Post") }}
            </button>

            <button class="btn btn-light me-2" @click="$emit('cancel')">
                <font-awesome-icon icon="times" />
                {{ $t("Cancel") }}
            </button>

            <div class="dropdown d-inline-block me-2">
                <button
                    id="dropdownMenuButton1"
                    class="btn btn-secondary dropdown-toggle"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    {{ $t("Style") }}: {{ $t(modelValue.style) }}
                </button>
                <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'info')">
                            {{ $t("info") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'warning')">
                            {{ $t("warning") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'danger')">
                            {{ $t("danger") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'primary')">
                            {{ $t("primary") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'light')">
                            {{ $t("light") }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.prevent="updateField('style', 'dark')">
                            {{ $t("dark") }}
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "IncidentEditForm",
    props: {
        modelValue: {
            type: Object,
            required: true,
        },
        /** Available monitors (systems) for the affected-systems selector */
        monitors: {
            type: Array,
            default: () => [],
        },
    },
    emits: ["update:modelValue", "post", "cancel"],
    methods: {
        /**
         * Emit an updated incident with one field changed.
         * @param {string} field Field name
         * @param {*} value New value
         * @returns {void}
         */
        updateField(field, value) {
            this.$emit("update:modelValue", {
                ...this.modelValue,
                [field]: value,
            });
        },

        /**
         * Whether a monitor is in the affected list.
         * @param {number} id Monitor id
         * @returns {boolean} True if affected
         */
        isAffected(id) {
            return (this.modelValue.affectedMonitors || []).map(String).includes(String(id));
        },

        /**
         * Toggle a monitor in the affected-systems list.
         * @param {number} id Monitor id
         * @returns {void}
         */
        toggleMonitor(id) {
            const current = (this.modelValue.affectedMonitors || []).map(String);
            const key = String(id);
            const next = current.includes(key) ? current.filter((x) => x !== key) : [...current, key];
            this.updateField("affectedMonitors", next);
        },
    },
};
</script>

<style lang="scss" scoped>
.incident {
    .content {
        &[contenteditable="true"] {
            min-height: 60px;
        }
    }
}

.bm-affected {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
}
.bm-affected-item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 13px;
    cursor: pointer;
}
</style>
