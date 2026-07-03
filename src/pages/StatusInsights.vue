<template>
    <div class="insights-page">
        <div class="ins-header">
            <div class="ins-brand">{{ config.title || "Status" }} — History, Uptime &amp; Maintenance</div>
            <router-link :to="'/status/' + slug" class="ins-back">← Status</router-link>
        </div>

        <div class="ins-tabs">
            <div class="ins-tab" :class="{ active: tab === 'history' }" @click="switchTab('history')">Incident History</div>
            <div class="ins-tab" :class="{ active: tab === 'uptime' }" @click="switchTab('uptime')">Uptime</div>
            <div class="ins-tab" :class="{ active: tab === 'maintenance' }" @click="switchTab('maintenance')">Maintenance</div>
        </div>

        <!-- History tab -->
        <div v-show="tab === 'history'">
            <div class="ins-month-nav">
                <button class="ins-mbtn" @click="changeMonth(-1)">← Sebelumnya</button>
                <div class="ins-month-title">{{ monthTitle(curMonth) }}</div>
                <button class="ins-mbtn" :disabled="curMonth >= thisMonthKey()" @click="changeMonth(1)">Berikutnya →</button>
            </div>

            <div v-if="monthIncidents.length === 0" class="ins-empty">Tidak ada incident yang dilaporkan bulan ini.</div>
            <div v-for="(group, date) in incidentsByDate" :key="date" class="ins-inc-day">
                <div class="ins-inc-date">{{ date }}</div>
                <div v-for="inc in group" :key="inc.id" class="ins-inc-card">
                    <div class="ins-inc-titlerow">
                        <span class="ins-inc-title">{{ inc.title }}</span>
                        <span class="ins-badges">
                            <span v-if="inc.impact && inc.impact !== 'none'" class="ins-impact" :class="'imp-' + inc.impact">{{ impactLabel(inc.impact) }}</span>
                            <span class="ins-tag" :class="'tag-' + inc.incidentStatus">{{ statusLabel(inc.incidentStatus) }}</span>
                        </span>
                    </div>
                    <div v-for="(u, idx) in inc.updates" :key="idx" class="ins-upd">
                        <span class="ins-upd-label">{{ statusLabel(u.status) }}</span>
                        <span class="ins-upd-msg">{{ u.message }}</span>
                        <span class="ins-upd-time">{{ fmtDateTime(u.createdDate) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Uptime tab -->
        <div v-show="tab === 'uptime'">
            <div class="ins-filter-row">
                <span class="ins-section-label">Uptime per monitor dalam 90 hari terakhir.</span>
                <select v-if="monitors.length > 1" v-model="calFilter" class="ins-select">
                    <option value="">Semua monitor</option>
                    <option v-for="m in monitors" :key="'f' + m.id" :value="String(m.id)">{{ m.name }}</option>
                </select>
            </div>
            <div v-if="monitors.length === 0" class="ins-empty">Belum ada monitor.</div>
            <UptimeCalendar
                v-for="m in filteredMonitors"
                :key="'cal' + m.id"
                :name="m.name"
                :monitor-id="m.id"
                :days="(calendar[m.id] && calendar[m.id].days) || {}"
                :notes="(calendar[m.id] && calendar[m.id].notes) || {}"
                :day-info="(calendar[m.id] && calendar[m.id].dayInfo) || {}"
                :uptime="(calendar[m.id] && calendar[m.id].uptime) ?? null"
            />
        </div>

        <!-- Maintenance tab -->
        <div v-show="tab === 'maintenance'">
            <!-- Upcoming -->
            <template v-if="upcomingMaint.length > 0">
                <div class="ins-inc-date">Akan Datang</div>
                <div v-for="m in upcomingMaint" :key="'um' + m.id" class="ins-maint-card">
                    <div class="ins-inc-titlerow">
                        <span class="ins-inc-title">{{ m.title }}</span>
                        <span class="ins-badges">
                            <span class="ins-tag" :class="maintTagClass(m.status)">{{ maintStatusLabel(m.status) }}</span>
                        </span>
                    </div>
                    <div v-if="m.description" class="ins-maint-desc">{{ m.description }}</div>
                    <MaintenanceTime :maintenance="m" />
                </div>
            </template>

            <!-- Active (currently running) -->
            <template v-if="activeMaint.length > 0">
                <div class="ins-inc-date">Sedang Berlangsung</div>
                <div v-for="m in activeMaint" :key="'am' + m.id" class="ins-maint-card">
                    <div class="ins-inc-titlerow">
                        <span class="ins-inc-title">{{ m.title }}</span>
                        <span class="ins-badges">
                            <span class="ins-tag" :class="maintTagClass(m.status)">{{ maintStatusLabel(m.status) }}</span>
                        </span>
                    </div>
                    <div v-if="m.description" class="ins-maint-desc">{{ m.description }}</div>
                    <MaintenanceTime :maintenance="m" />
                </div>
            </template>

            <!-- Past history -->
            <div class="ins-inc-date">Riwayat</div>
            <div v-if="pastMaint.length === 0" class="ins-empty">Belum ada riwayat maintenance.</div>
            <div v-for="(group, date) in pastMaintByDate" :key="date" class="ins-inc-day">
                <div class="ins-inc-date">{{ date }}</div>
                <div v-for="m in group" :key="'pm' + m.id" class="ins-maint-card">
                    <div class="ins-inc-titlerow">
                        <span class="ins-inc-title">{{ m.title }}</span>
                        <span class="ins-badges">
                            <span class="ins-tag" :class="maintTagClass(m.status)">{{ maintStatusLabel(m.status) }}</span>
                        </span>
                    </div>
                    <div v-if="m.description" class="ins-maint-desc">{{ m.description }}</div>
                    <MaintenanceTime :maintenance="m" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios";
import UptimeCalendar from "../components/UptimeCalendar.vue";
import MaintenanceTime from "../components/MaintenanceTime.vue";

const MONTHS_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export default {
    components: { UptimeCalendar, MaintenanceTime },
    data() {
        return {
            slug: this.$route.params.slug || "default",
            tab: "history",
            config: {},
            monitors: [],
            calendar: {},
            incidents: [],
            curMonth: "",
            calFilter: "",
            // Soca: maintenance history (active / upcoming / past)
            activeMaint: [],
            upcomingMaint: [],
            pastMaint: [],
        };
    },
    computed: {
        /**
         * Incidents that belong to the currently selected month.
         * @returns {object[]} Filtered incidents
         */
        monthIncidents() {
            return this.incidents.filter((inc) => this.incidentMonth(inc.createdDate) === this.curMonth);
        },
        /**
         * Incidents of the current month grouped by formatted date (newest day first).
         * @returns {object} Map of date label -> incident array
         */
        incidentsByDate() {
            const out = {};
            for (const inc of this.monthIncidents) {
                const key = this.fmtDate(inc.createdDate);
                if (!out[key]) {
                    out[key] = [];
                }
                out[key].push(inc);
            }
            return out;
        },
        /**
         * Monitors shown after applying the filter.
         * @returns {object[]} Filtered monitors
         */
        filteredMonitors() {
            if (!this.calFilter) {
                return this.monitors;
            }
            return this.monitors.filter((m) => String(m.id) === String(this.calFilter));
        },
        /**
         * Past maintenance grouped by the formatted day it ended (newest day first;
         * backend already returns the list most-recent first).
         * @returns {object} Map of date label -> maintenance array
         */
        pastMaintByDate() {
            const out = {};
            for (const m of this.pastMaint) {
                const key = this.fmtDate(this.maintEndDate(m));
                if (!out[key]) {
                    out[key] = [];
                }
                out[key].push(m);
            }
            return out;
        },
    },
    mounted() {
        if (this.$route.path.endsWith("/uptime")) {
            this.tab = "uptime";
        } else if (this.$route.path.endsWith("/maintenance")) {
            this.tab = "maintenance";
        } else {
            this.tab = "history";
        }
        this.curMonth = this.thisMonthKey();
        this.load();
    },
    methods: {
        /**
         * Load config, monitors, 90-day uptime calendar, and all incidents.
         * @returns {Promise<void>}
         */
        async load() {
            try {
                const sp = await axios.get("/api/status-page/" + this.slug);
                this.config = sp.data.config || {};
                const list = [];
                for (const g of sp.data.publicGroupList || []) {
                    for (const m of g.monitorList || []) {
                        list.push({ id: m.id, name: m.name });
                    }
                }
                this.monitors = list;
            } catch (e) {
                // ignore
            }

            // Uptime calendar: transform the 2.x `bars` array into the maps UptimeCalendar expects.
            axios
                .get("/api/status-page/" + this.slug + "/uptime-calendar")
                .then((r) => {
                    const cal = (r.data && r.data.calendar) || {};
                    const out = {};
                    for (const mid of Object.keys(cal)) {
                        const entry = cal[mid];
                        const days = {};
                        const dayInfo = {};
                        const notes = {};
                        for (const bar of entry.bars || []) {
                            days[bar.date] = bar.status;
                            dayInfo[bar.date] = { rt: bar.rt, checks: bar.checks };
                            if (bar.note) {
                                notes[bar.date] = bar.note;
                            }
                        }
                        out[mid] = { days, dayInfo, notes, uptime: entry.uptime };
                    }
                    this.calendar = out;
                })
                .catch(() => {});

            this.loadAllIncidents();
            this.loadMaintenance();
        },

        /**
         * Load the full maintenance history (active / upcoming / past).
         * @returns {Promise<void>}
         */
        async loadMaintenance() {
            try {
                const r = await axios.get("/api/status-page/" + this.slug + "/maintenance-history");
                const data = r.data || {};
                this.activeMaint = data.active || [];
                this.upcomingMaint = data.upcoming || [];
                this.pastMaint = data.past || [];
            } catch (e) {
                // ignore
            }
        },

        /**
         * Page through the cursor-based incident history to collect every incident,
         * so month navigation can reach older months.
         * @returns {Promise<void>}
         */
        async loadAllIncidents() {
            let cursor = null;
            let all = [];
            let guard = 0;
            try {
                do {
                    const url = cursor
                        ? "/api/status-page/" + this.slug + "/incident-history?cursor=" + encodeURIComponent(cursor)
                        : "/api/status-page/" + this.slug + "/incident-history";
                    const r = await axios.get(url);
                    const data = r.data || {};
                    all = all.concat(data.incidents || []);
                    cursor = data.hasMore ? data.nextCursor : null;
                    guard += 1;
                } while (cursor && guard < 50);
            } catch (e) {
                // ignore
            }
            this.incidents = all;
        },

        /**
         * Switch tab and reflect it in the URL without a full navigation.
         * @param {string} t Tab key ("history" | "uptime")
         * @returns {void}
         */
        switchTab(t) {
            this.tab = t;
            try {
                history.replaceState(null, "", "/status/" + this.slug + "/" + t);
            } catch (e) {
                // ignore
            }
        },

        /**
         * Current month key (YYYY-MM).
         * @returns {string} Month key
         */
        thisMonthKey() {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        },

        /**
         * Human title for a month key.
         * @param {string} mk Month key (YYYY-MM)
         * @returns {string} Title
         */
        monthTitle(mk) {
            if (!mk) {
                return "";
            }
            const [y, m] = mk.split("-");
            return `${MONTHS_FULL[parseInt(m) - 1]} ${y}`;
        },

        /**
         * Move the selected month by a delta (in months).
         * @param {number} delta Months to add (negative = back)
         * @returns {void}
         */
        changeMonth(delta) {
            const [y, m] = this.curMonth.split("-").map(Number);
            const d = new Date(Date.UTC(y, m - 1 + delta, 1));
            this.curMonth = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        },

        /**
         * Parse an incident created date into a Date (treating space form as UTC).
         * @param {string} createdDate Stored created date
         * @returns {Date|null} Parsed date or null
         */
        incidentLocalDate(createdDate) {
            const iso = createdDate.includes("T") ? createdDate : createdDate.replace(" ", "T") + "Z";
            const d = new Date(iso);
            return isNaN(d) ? null : d;
        },

        /**
         * Month key (YYYY-MM) of an incident.
         * @param {string} createdDate Stored created date
         * @returns {string} Month key
         */
        incidentMonth(createdDate) {
            const d = this.incidentLocalDate(createdDate);
            return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` : "";
        },

        /**
         * Formatted day label of an incident.
         * @param {string} createdDate Stored created date
         * @returns {string} Day label
         */
        fmtDate(createdDate) {
            const d = this.incidentLocalDate(createdDate);
            return d ? `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` : "";
        },

        /**
         * Formatted date + time label of an update.
         * @param {string} createdDate Stored created date
         * @returns {string} Date/time label
         */
        fmtDateTime(createdDate) {
            const d = this.incidentLocalDate(createdDate);
            if (!d) {
                return "";
            }
            const p = (n) => String(n).padStart(2, "0");
            return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}, ${p(d.getHours())}:${p(d.getMinutes())}`;
        },

        /**
         * Label for a lifecycle status.
         * @param {string} s Status key
         * @returns {string} Label
         */
        statusLabel(s) {
            return { investigating: "Investigating", identified: "Identified", monitoring: "Monitoring", update: "Update", resolved: "Resolved" }[s] || s;
        },

        /**
         * Label for an impact level.
         * @param {string} s Impact key
         * @returns {string} Label
         */
        impactLabel(s) {
            return { none: "None", minor: "Minor", major: "Major", critical: "Critical" }[s] || s;
        },

        /**
         * The end date of a maintenance (last timeslot end, falling back to the date range).
         * @param {object} m Public maintenance object
         * @returns {string} Date string (ISO or stored form)
         */
        maintEndDate(m) {
            const slots = m.timeslotList || [];
            const last = slots[slots.length - 1];
            return (last && last.endDate) || (m.dateRange && m.dateRange[1]) || (m.dateRange && m.dateRange[0]) || "";
        },

        /**
         * Human label for a maintenance status.
         * @param {string} s Maintenance status key
         * @returns {string} Label
         */
        maintStatusLabel(s) {
            return {
                "under-maintenance": "In Progress",
                scheduled: "Scheduled",
                ended: "Completed",
            }[s] || s;
        },

        /**
         * Badge class for a maintenance status.
         * @param {string} s Maintenance status key
         * @returns {string} CSS class
         */
        maintTagClass(s) {
            return {
                "under-maintenance": "tag-maint-active",
                scheduled: "tag-maint-scheduled",
                ended: "tag-maint-ended",
            }[s] || "tag-maint-ended";
        },
    },
};
</script>

<style lang="scss" scoped>
.insights-page { max-width: 740px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
.ins-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.ins-brand { font-size: 19px; font-weight: 600; }
.ins-back { font-size: 13px; text-decoration: none; color: #185fa5; }

.ins-tabs { display: flex; border-bottom: 1px solid rgba(128, 128, 128, 0.25); margin-bottom: 1.75rem; }
.ins-tab { font-size: 14px; font-weight: 500; padding: 0.6rem 0; margin-right: 1.5rem; cursor: pointer; opacity: 0.6; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.ins-tab.active { opacity: 1; border-bottom-color: currentColor; }
.ins-tab:hover { opacity: 1; }

.ins-month-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.ins-month-title { font-size: 18px; font-weight: 600; }
.ins-mbtn { font-size: 13px; padding: 5px 12px; border-radius: 8px; border: 1px solid rgba(128, 128, 128, 0.35); background: none; color: inherit; cursor: pointer; }
.ins-mbtn:disabled { opacity: 0.4; cursor: not-allowed; }

.ins-empty { opacity: 0.6; font-size: 13px; padding: 1rem 0; }
.ins-inc-day { margin-bottom: 1.75rem; }
.ins-inc-date { font-size: 13px; font-weight: 600; opacity: 0.7; padding-bottom: 0.5rem; margin-bottom: 0.75rem; border-bottom: 1px solid rgba(128, 128, 128, 0.2); }
.ins-inc-card { margin-bottom: 1.25rem; }
.ins-inc-titlerow { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.ins-inc-title { font-size: 15px; font-weight: 600; }
.ins-badges { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.ins-tag { font-size: 11px; font-weight: 500; padding: 2px 9px; border-radius: 20px; white-space: nowrap; }
.tag-resolved { background: #e1f5ee; color: #1d9e75; }
.tag-update { background: #e8f0fe; color: #2c6ecb; }
.tag-monitoring { background: #faeeda; color: #ba7517; }
.tag-identified { background: #faece7; color: #d85a30; }
.tag-investigating { background: #fcebeb; color: #e24b4a; }
.ins-impact { font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 1px 7px; border-radius: 4px; }
.imp-minor { background: #faeeda; color: #ba7517; }
.imp-major { background: #faece7; color: #d85a30; }
.imp-critical { background: #fcebeb; color: #e24b4a; }
.ins-upd { display: flex; gap: 8px; margin-top: 0.6rem; font-size: 13px; flex-wrap: wrap; }
.ins-upd-label { font-weight: 600; min-width: 105px; }
.ins-upd-msg { opacity: 0.8; flex: 1; }
.ins-upd-time { opacity: 0.55; font-size: 11px; white-space: nowrap; }

.ins-filter-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px; }
.ins-section-label { font-size: 13px; opacity: 0.6; }
.ins-select { font-size: 13px; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(128, 128, 128, 0.35); background: none; color: inherit; max-width: 260px; }

/* Soca: maintenance history cards */
.ins-maint-card { margin-bottom: 1.25rem; padding-bottom: 1.1rem; border-bottom: 1px solid rgba(128, 128, 128, 0.12); }
.ins-maint-card:last-child { border-bottom: none; }
.ins-maint-desc { font-size: 13px; opacity: 0.8; margin: 0.35rem 0 0.5rem; line-height: 1.5; }
.tag-maint-active { background: #e7f0fa; color: #185fa5; }
.tag-maint-scheduled { background: #faf1dd; color: #b07a0c; }
.tag-maint-ended { background: #e8f3ec; color: #3f8a57; }
</style>
