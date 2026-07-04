<template>
    <div ref="modal" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        {{ $t("Edit Incident") }}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submit">
                        <div class="mb-3">
                            <label for="incident-title" class="form-label">{{ $t("Title") }}</label>
                            <input
                                id="incident-title"
                                v-model="form.title"
                                type="text"
                                class="form-control"
                                :placeholder="$t('Incident title')"
                                required
                            />
                        </div>

                        <div class="mb-3">
                            <label for="incident-content" class="form-label">{{ $t("Content") }}</label>
                            <textarea
                                id="incident-content"
                                v-model="form.content"
                                class="form-control"
                                rows="4"
                                :placeholder="$t('Incident description')"
                                required
                            ></textarea>
                        </div>

                        <div class="mb-3">
                            <label for="incident-style" class="form-label">{{ $t("Style") }}</label>
                            <select id="incident-style" v-model="form.style" class="form-select">
                                <option value="info">{{ $t("info") }}</option>
                                <option value="warning">
                                    {{ $t("warning") }}
                                </option>
                                <option value="danger">
                                    {{ $t("danger") }}
                                </option>
                                <option value="primary">
                                    {{ $t("primary") }}
                                </option>
                                <option value="light">{{ $t("light") }}</option>
                                <option value="dark">{{ $t("dark") }}</option>
                            </select>
                        </div>

                        <!-- Soca: lifecycle status + impact level -->
                        <div class="row">
                            <div class="mb-3 col">
                                <label for="incident-status" class="form-label">{{ $t("Status") }}</label>
                                <select id="incident-status" v-model="form.incidentStatus" class="form-select">
                                    <option value="investigating">Investigating</option>
                                    <option value="identified">Identified</option>
                                    <option value="monitoring">Monitoring</option>
                                    <option value="update">Update</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div class="mb-3 col">
                                <label for="incident-impact" class="form-label">Impact</label>
                                <select id="incident-impact" v-model="form.impact" class="form-select">
                                    <option value="none">None</option>
                                    <option value="minor">Minor</option>
                                    <option value="major">Major</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>

                        <!-- Soca: affected systems (monitors) -->
                        <div v-if="monitors.length" class="mb-3">
                            <label class="form-label">Sistem terdampak</label>
                            <div class="bm-affected">
                                <label v-for="m in monitors" :key="m.id" class="bm-affected-item">
                                    <input
                                        type="checkbox"
                                        :checked="form.affectedMonitors.map(String).includes(String(m.id))"
                                        @change="toggleMonitor(m.id)"
                                    />
                                    <span>{{ m.name }}</span>
                                </label>
                            </div>
                        </div>

                        <div class="mb-3 form-check">
                            <input id="incident-pin" v-model="form.pin" type="checkbox" class="form-check-input" />
                            <label for="incident-pin" class="form-check-label">
                                {{ $t("Pin this incident") }}
                            </label>
                            <div class="form-text">
                                {{ $t("Pinned incidents are shown prominently on the status page") }}
                            </div>
                        </div>
                    </form>

                    <!-- Soca: post a lifecycle status update (adds a timeline entry) -->
                    <hr />
                    <div class="post-update">
                        <label class="form-label">{{ $t("Post Update") }}</label>
                        <div class="row g-2">
                            <div class="col-auto">
                                <select v-model="update.status" class="form-select">
                                    <option value="investigating">Investigating</option>
                                    <option value="identified">Identified</option>
                                    <option value="monitoring">Monitoring</option>
                                    <option value="update">Update</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div class="col">
                                <input
                                    v-model="update.message"
                                    class="form-control"
                                    :placeholder="$t('Update message')"
                                    @keyup.enter="postUpdate"
                                />
                            </div>
                            <div class="col-auto">
                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    :disabled="postingUpdate"
                                    @click="postUpdate"
                                >
                                    <span
                                        v-if="postingUpdate"
                                        class="spinner-border spinner-border-sm me-1"
                                        role="status"
                                    ></span>
                                    <font-awesome-icon v-else icon="bullhorn" class="me-1" />
                                    {{ $t("Post") }}
                                </button>
                            </div>
                        </div>
                        <div class="form-text">
                            {{ $t("Posting an update adds a timeline entry and changes the incident status.") }}
                        </div>

                        <!-- Current timeline -->
                        <div v-if="timeline.length" class="incident-timeline mt-3">
                            <div v-for="(u, idx) in timeline" :key="idx" class="timeline-item">
                                <strong>{{ statusLabel(u.status) }}</strong>
                                <span class="ms-1">{{ u.message }}</span>
                                <div v-if="u.createdDate" class="small text-muted">
                                    {{ $root.datetime(u.createdDate) }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        {{ $t("Cancel") }}
                    </button>
                    <button type="button" class="btn btn-primary" :disabled="processing" @click="submit">
                        <span v-if="processing" class="spinner-border spinner-border-sm me-1" role="status"></span>
                        {{ $t("Save") }}
                    </button>
                </div>
            </div>
        </div>
    </div>

    <Confirm
        ref="confirmDelete"
        btn-style="btn-danger"
        :yes-text="$t('Yes')"
        :no-text="$t('No')"
        @yes="confirmDeleteIncident"
    >
        {{ $t("deleteIncidentMsg") }}
    </Confirm>
</template>

<script>
import { Modal } from "bootstrap";
import Confirm from "./Confirm.vue";

export default {
    name: "IncidentManageModal",
    components: {
        Confirm,
    },
    props: {
        slug: {
            type: String,
            required: true,
        },
        /** Available monitors (systems) for the affected-systems selector */
        monitors: {
            type: Array,
            default: () => [],
        },
    },
    emits: ["incident-updated"],
    data() {
        return {
            modal: null,
            processing: false,
            postingUpdate: false,
            incidentId: null,
            pendingDeleteIncident: null,
            // Soca: current incident timeline + the draft update to post
            timeline: [],
            update: {
                status: "update",
                message: "",
            },
            form: {
                title: "",
                content: "",
                style: "warning",
                pin: true,
                // Soca: lifecycle status + impact level
                incidentStatus: "investigating",
                impact: "none",
                // Soca: affected systems (monitor ids)
                affectedMonitors: [],
            },
        };
    },
    mounted() {
        this.modal = new Modal(this.$refs.modal);
    },
    methods: {
        /**
         * Show the modal for editing an existing incident
         * @param {object} incident - The incident to edit
         * @returns {void}
         */
        showEdit(incident) {
            this.incidentId = incident.id;
            this.form = {
                title: incident.title,
                content: incident.content,
                style: incident.style || "warning",
                pin: !!incident.pin,
                // Soca: lifecycle status + impact level
                incidentStatus: incident.incidentStatus || "investigating",
                impact: incident.impact || "none",
                // Soca: affected systems (convert objects to ids)
                affectedMonitors: (incident.affectedMonitors || []).map((m) => m.id),
            };
            // Soca: load the existing timeline + reset the update draft
            this.timeline = (incident.updates || []).map((u) => ({ ...u }));
            this.update = { status: "update", message: "" };
            this.modal.show();
        },

        /**
         * Show delete confirmation dialog
         * @param {object} incident - The incident to delete
         * @returns {void}
         */
        showDelete(incident) {
            this.pendingDeleteIncident = incident;
            this.$refs.confirmDelete.show();
        },

        /**
         * Submit the form to edit the incident
         * @returns {void}
         */
        submit() {
            if (!this.form.title || this.form.title.trim() === "") {
                this.$root.toastError(this.$t("Please input title"));
                return;
            }

            if (!this.form.content || this.form.content.trim() === "") {
                this.$root.toastError(this.$t("Please input content"));
                return;
            }

            this.processing = true;

            this.$root.getSocket().emit("editIncident", this.slug, this.incidentId, this.form, (res) => {
                this.processing = false;
                this.$root.toastRes(res);
                if (res.ok) {
                    this.modal.hide();
                    this.$emit("incident-updated");
                }
            });
        },

        /**
         * Toggle a monitor in the affected-systems list.
         * @param {number} id Monitor id
         * @returns {void}
         */
        toggleMonitor(id) {
            const current = this.form.affectedMonitors.map(String);
            const key = String(id);
            this.form.affectedMonitors = current.includes(key)
                ? current.filter((x) => x !== key)
                : [...current, key];
        },

        /**
         * Soca: post a lifecycle status update; appends a timeline entry and
         * advances the incident's status (uses the existing addIncidentUpdate handler).
         * @returns {void}
         */
        postUpdate() {
            const message = (this.update.message || "").trim();
            if (!message) {
                this.$root.toastError(this.$t("Update message is required"));
                return;
            }

            this.postingUpdate = true;
            this.$root
                .getSocket()
                .emit("addIncidentUpdate", this.slug, this.incidentId, this.update.status, message, (res) => {
                    this.postingUpdate = false;
                    if (res.ok) {
                        // Reflect the new entry locally (newest first) and sync the edited status.
                        this.timeline.unshift({
                            status: this.update.status,
                            message,
                            createdDate: res.incident ? res.incident.lastUpdatedDate : null,
                        });
                        this.form.incidentStatus = this.update.status;
                        this.update = { status: "update", message: "" };
                        this.$emit("incident-updated");
                    } else {
                        this.$root.toastError(res.msg);
                    }
                });
        },

        /**
         * Soca: human label for a lifecycle status.
         * @param {string} s Status key
         * @returns {string} Human label
         */
        statusLabel(s) {
            return {
                investigating: "Investigating",
                identified: "Identified",
                monitoring: "Monitoring",
                update: "Update",
                resolved: "Resolved",
            }[s] || s || "Investigating";
        },

        /**
         * Confirm and delete the incident
         * @returns {void}
         */
        confirmDeleteIncident() {
            if (!this.pendingDeleteIncident) {
                return;
            }

            this.$root.getSocket().emit("deleteIncident", this.slug, this.pendingDeleteIncident.id, (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.$emit("incident-updated");
                }
                this.pendingDeleteIncident = null;
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.modal-body {
    .form-text {
        font-size: 0.875rem;
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
    font-size: 14px;
    cursor: pointer;
}
</style>
