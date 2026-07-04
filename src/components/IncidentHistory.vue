<template>
    <div class="incident-group" data-testid="incident-group">
        <div v-if="loading && incidents.length === 0" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">{{ $t("Loading...") }}</span>
            </div>
        </div>

        <div v-else-if="incidents.length === 0" class="text-center py-4 text-muted">
            {{ $t("No incidents recorded") }}
        </div>

        <div v-else class="incident-list">
            <div
                v-for="incident in incidents"
                :key="incident.id"
                class="incident-item"
                :class="{ resolved: !incident.active }"
            >
                <div class="incident-style-indicator" :class="`bg-${incident.style}`"></div>
                <div class="incident-body">
                    <div class="incident-header d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="incident-title mb-0">{{ incident.title }}</h5>
                            <!-- Soca: impact + lifecycle status badges -->
                            <div class="mt-1">
                                <span
                                    v-if="incident.impact && incident.impact !== 'none'"
                                    class="badge me-1"
                                    :class="impactBadgeClass(incident.impact)"
                                >{{ impactLabel(incident.impact) }}</span>
                                <span class="badge bg-secondary">{{ statusLabel(incident.incidentStatus) }}</span>
                            </div>
                        </div>
                        <div v-if="editMode" class="incident-actions">
                            <button
                                v-if="incident.active"
                                class="btn btn-success btn-sm me-1"
                                :title="$t('Resolve')"
                                @click="$emit('resolve-incident', incident)"
                            >
                                <font-awesome-icon icon="check" />
                            </button>
                            <button
                                class="btn btn-outline-secondary btn-sm me-1"
                                :title="$t('Edit')"
                                @click="$emit('edit-incident', incident)"
                            >
                                <font-awesome-icon icon="edit" />
                            </button>
                            <button
                                class="btn btn-outline-danger btn-sm"
                                :title="$t('Delete')"
                                @click="$emit('delete-incident', incident)"
                            >
                                <font-awesome-icon icon="trash" />
                            </button>
                        </div>
                    </div>
                    <!-- eslint-disable-next-line vue/no-v-html-->
                    <div class="incident-content mt-1" v-html="getIncidentHTML(incident.content)"></div>

                    <!-- Soca: affected systems -->
                    <div v-if="incident.affectedMonitors && incident.affectedMonitors.length" class="bm-affected-row mt-2">
                        <span class="bm-affected-label">Sistem terdampak:</span>
                        <span v-for="m in incident.affectedMonitors" :key="m.id" class="bm-affected-chip">{{ m.name }}</span>
                    </div>

                    <!-- Soca: lifecycle timeline -->
                    <div v-if="incident.updates && incident.updates.length" class="incident-timeline mt-2">
                        <div v-for="(u, idx) in incident.updates" :key="idx" class="timeline-item">
                            <strong>{{ statusLabel(u.status) }}</strong>
                            <span class="ms-1">{{ u.message }}</span>
                            <span class="timeline-time text-muted ms-1">· {{ datetime(u.createdDate) }}</span>
                        </div>
                    </div>

                    <div class="incident-meta text-muted small mt-2">
                        <div>{{ $t("createdAt", { date: datetime(incident.createdDate) }) }}</div>
                        <div v-if="incident.lastUpdatedDate">
                            {{ $t("lastUpdatedAt", { date: datetime(incident.lastUpdatedDate) }) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { marked } from "marked";
import DOMPurify from "dompurify";
import datetimeMixin from "../mixins/datetime";

export default {
    name: "IncidentHistory",
    mixins: [datetimeMixin],
    props: {
        incidents: {
            type: Array,
            default: () => [],
        },
        editMode: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["edit-incident", "delete-incident", "resolve-incident"],
    methods: {
        /**
         * Get sanitized HTML for incident content
         * @param {string} content - Markdown content
         * @returns {string} Sanitized HTML
         */
        getIncidentHTML(content) {
            if (content != null) {
                return DOMPurify.sanitize(marked(content));
            }
            return "";
        },

        /**
         * Soca: label for a lifecycle status
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
         * Soca: label for an impact level
         * @param {string} s Impact key
         * @returns {string} Human label
         */
        impactLabel(s) {
            return { none: "None", minor: "Minor", major: "Major", critical: "Critical" }[s] || s;
        },

        /**
         * Soca: badge class for an impact level
         * @param {string} impact Impact key
         * @returns {string} Bootstrap badge class
         */
        impactBadgeClass(impact) {
            return {
                none: "bg-secondary",
                minor: "bg-warning text-dark",
                major: "bg-warning text-dark",
                critical: "bg-danger",
            }[impact] || "bg-secondary";
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.incident-group {
    padding: 10px;

    .incident-list {
        .incident-item {
            display: flex;
            padding: 13px 15px 10px 15px;
            border-radius: 10px;
            transition: all ease-in-out 0.15s;

            &:hover {
                background-color: $highlight-white;
            }

            &.resolved {
                opacity: 0.7;
            }

            .incident-style-indicator {
                width: 6px;
                min-height: 100%;
                border-radius: 3px;
                flex-shrink: 0;
                margin-right: 12px;
            }

            .incident-body {
                flex: 1;
                min-width: 0;
            }

            .incident-meta {
                font-size: 12px;
            }

            // Soca: affected systems chips
            .bm-affected-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.4rem;
                font-size: 13px;
            }

            .bm-affected-label {
                opacity: 0.7;
            }

            .bm-affected-chip {
                display: inline-block;
                padding: 1px 9px;
                border-radius: 999px;
                font-size: 12px;
                background: rgb(128, 128, 128, 0.15);
                border: 1px solid rgb(128, 128, 128, 0.25);
            }

            // Soca: lifecycle timeline
            .incident-timeline {
                .timeline-item {
                    padding: 2px 0;
                    padding-left: 0.6rem;
                    border-left: 2px solid rgb(128, 128, 128, 0.35);
                    margin-bottom: 2px;
                    font-size: 13px;
                }

                .timeline-time {
                    font-size: 11px;
                }
            }
        }
    }
}

.dark {
    .incident-group {
        .incident-list {
            .incident-item {
                &:hover {
                    background-color: $dark-bg2;
                }
            }
        }
    }
}
</style>
