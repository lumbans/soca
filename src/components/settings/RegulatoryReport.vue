<template>
    <div>
        <!-- Soca: monthly regulatory availability & incident report ("incidents" permission). -->
        <p class="text-muted mt-3">
            {{ $t("regulatoryReportDescription") }}
        </p>

        <!-- Controls -->
        <div class="row g-2 align-items-end mb-2 d-print-none">
            <div class="col-md-5">
                <label class="form-label">{{ $t("Select Status Page") }}</label>
                <select v-model="slug" class="form-select">
                    <option value="" disabled>{{ $t("Select Status Page") }}</option>
                    <option v-for="sp in statusPages" :key="sp.slug" :value="sp.slug">
                        {{ sp.title }} (/{{ sp.slug }})
                    </option>
                </select>
            </div>
            <div class="col-md-4">
                <label class="form-label">{{ $t("Period Type") }}</label>
                <div class="btn-group w-100" role="group">
                    <input id="mode-month" v-model="mode" type="radio" class="btn-check" value="month" />
                    <label class="btn btn-outline-primary" for="mode-month">{{ $t("Monthly") }}</label>
                    <input id="mode-range" v-model="mode" type="radio" class="btn-check" value="range" />
                    <label class="btn btn-outline-primary" for="mode-range">{{ $t("Custom Range") }}</label>
                </div>
            </div>
        </div>

        <div class="row g-2 align-items-end mb-3 d-print-none">
            <!-- Monthly period -->
            <template v-if="mode === 'month'">
                <div class="col-md-3">
                    <label class="form-label">{{ $t("Month") }}</label>
                    <select v-model.number="month" class="form-select">
                        <option v-for="mo in 12" :key="mo" :value="mo">{{ monthLabel(mo) }}</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="form-label">{{ $t("Year") }}</label>
                    <select v-model.number="year" class="form-select">
                        <option v-for="yr in yearOptions" :key="yr" :value="yr">{{ yr }}</option>
                    </select>
                </div>
            </template>
            <!-- Custom range period -->
            <template v-else>
                <div class="col-md-3">
                    <label class="form-label">{{ $t("Start") }}</label>
                    <input v-model="startDate" type="date" class="form-control" />
                </div>
                <div class="col-md-3">
                    <label class="form-label">{{ $t("End") }}</label>
                    <input v-model="endDate" type="date" class="form-control" />
                </div>
            </template>
            <div class="col-md-3 d-grid">
                <button class="btn btn-primary" type="button" :disabled="!slug || loading" @click="generate">
                    <font-awesome-icon icon="file-alt" /> {{ $t("Generate Report") }}
                </button>
            </div>
        </div>

        <!-- Empty prompt -->
        <div v-if="!report && !loading" class="text-center text-muted py-4">
            {{ $t("reportSelectPrompt") }}
        </div>

        <!-- Report -->
        <div v-if="report" class="report-printable">
            <!-- Export actions -->
            <div class="d-flex justify-content-end align-items-center gap-2 mb-3 d-print-none">
                <span v-if="report.cached" class="text-muted small me-auto">
                    <font-awesome-icon icon="database" /> {{ $t("reportServedFromCache") }}
                </span>
                <button class="btn btn-normal" type="button" :disabled="loading" @click="generate(true)">
                    <font-awesome-icon icon="sync" /> {{ $t("Refresh") }}
                </button>
                <button class="btn btn-normal" type="button" @click="downloadCSV">
                    <font-awesome-icon icon="download" /> {{ $t("Download CSV") }}
                </button>
                <button class="btn btn-normal" type="button" @click="printReport">
                    <font-awesome-icon icon="print" /> {{ $t("Print / Save as PDF") }}
                </button>
            </div>

            <!-- Title block -->
            <div class="report-head mb-4">
                <h3 class="mb-1">{{ $t("Regulatory Report") }}</h3>
                <div class="fw-bold">{{ report.statusPage.title }}</div>
                <div class="text-muted">
                    {{ $t("Report Period") }}: {{ periodLabel(report.period) }}
                </div>
                <div v-if="!report.period.complete" class="text-warning small mt-1">
                    <font-awesome-icon icon="exclamation-triangle" /> {{ $t("reportProvisionalNote") }}
                </div>
            </div>

            <!-- Summary cards -->
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="summary-card">
                        <div class="label">{{ $t("Overall Availability") }}</div>
                        <div class="value">{{ fmtPct(report.summary.overallAvailability) }}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="summary-card">
                        <div class="label">{{ $t("Total Downtime") }}</div>
                        <div class="value">{{ fmtDuration(report.summary.totalDowntimeMinutes) }}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="summary-card">
                        <div class="label">{{ $t("Systems Monitored") }}</div>
                        <div class="value">{{ report.summary.systemsCount }}</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="summary-card">
                        <div class="label">{{ $t("Incidents") }}</div>
                        <div class="value">{{ report.summary.incidentsCount }}</div>
                    </div>
                </div>
            </div>

            <!-- Systems table -->
            <h5>{{ $t("Systems Monitored") }}</h5>
            <div class="table-responsive mb-2">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>{{ $t("System") }}</th>
                            <th class="text-end">{{ $t("Availability") }}</th>
                            <th class="text-end">{{ $t("Downtime") }}</th>
                            <th class="text-end">{{ $t("Outages") }}</th>
                            <th class="text-end">{{ $t("Checks") }}</th>
                            <th class="text-end">{{ $t("Monitored Days") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="report.systems.length === 0">
                            <td colspan="6" class="text-center text-muted py-3">{{ $t("reportNoSystems") }}</td>
                        </tr>
                        <tr v-for="s in report.systems" :key="s.id">
                            <td>{{ s.name }}</td>
                            <td class="text-end">
                                <span v-if="s.availability === null" class="text-muted">{{ $t("No data") }}</span>
                                <span v-else :class="availabilityClass(s.availability)">{{ fmtPct(s.availability) }}</span>
                            </td>
                            <td class="text-end">{{ fmtDuration(s.downtimeMinutes) }}</td>
                            <td class="text-end">{{ s.downEvents }}</td>
                            <td class="text-end">{{ s.checks }}</td>
                            <td class="text-end">{{ s.monitoredDays }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p class="text-muted small">{{ $t("reportDowntimeSourceNote") }}</p>

            <!-- Incidents -->
            <h5 class="mt-4">{{ $t("Incidents") }}</h5>
            <div v-if="report.incidents.length === 0" class="text-muted py-2">{{ $t("reportNoIncidents") }}</div>
            <div v-else class="table-responsive">
                <table class="table align-middle">
                    <thead>
                        <tr>
                            <th>{{ $t("Impact") }}</th>
                            <th>{{ $t("Description") }}</th>
                            <th>{{ $t("Affected Systems") }}</th>
                            <th class="text-nowrap">{{ $t("Start") }}</th>
                            <th class="text-nowrap">{{ $t("End") }}</th>
                            <th class="text-end">{{ $t("Duration") }}</th>
                            <th>{{ $t("Status") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="inc in report.incidents" :key="inc.id">
                            <td><span class="badge" :class="impactBadgeClass(inc.impact)">{{ impactLabel(inc.impact) }}</span></td>
                            <td>
                                <div class="fw-bold">{{ inc.title }}</div>
                                <div class="text-muted small">{{ inc.description }}</div>
                            </td>
                            <td>
                                <span v-if="inc.affectedSystems.length === 0" class="text-muted">—</span>
                                <span v-else>{{ inc.affectedSystems.join(", ") }}</span>
                            </td>
                            <td class="text-nowrap"><Datetime :value="inc.startDate" /></td>
                            <td class="text-nowrap">
                                <span v-if="inc.ongoing" class="badge bg-info text-dark">{{ $t("Ongoing") }}</span>
                                <Datetime v-else :value="inc.endDate" />
                            </td>
                            <td class="text-end">{{ fmtDuration(inc.durationMinutes) }}</td>
                            <td class="text-nowrap">{{ inc.incidentStatus }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div class="text-muted small mt-4 report-foot">
                {{ $t("reportGeneratedAt") }}: <Datetime :value="report.generatedAt" />
                <span v-if="report.generatedBy"> · {{ $t("reportGeneratedBy") }}: {{ report.generatedBy }}</span>
            </div>
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
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const firstOfMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
        const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        return {
            slug: "",
            mode: "month", // "month" | "range"
            month: now.getMonth() + 1,
            year: now.getFullYear(),
            startDate: firstOfMonth,
            endDate: today,
            report: null,
            loading: false,
        };
    },

    computed: {
        statusPages() {
            return Object.values(this.$root.statusPageList || {});
        },

        yearOptions() {
            const current = new Date().getFullYear();
            const years = [];
            for (let y = current; y >= current - 5; y--) {
                years.push(y);
            }
            return years;
        },
    },

    methods: {
        /**
         * Ask the server to build the report for the selected page/period.
         * @param {boolean} force Bypass the server-side cache and recompute
         * @returns {void}
         */
        generate(force = false) {
            if (!this.slug) {
                return;
            }
            const params = this.mode === "range"
                ? { mode: "range", startDate: this.startDate, endDate: this.endDate }
                : { mode: "month", year: this.year, month: this.month };
            if (force) {
                params.force = true;
            }

            this.loading = true;
            this.report = null;
            this.$root.getSocket().emit("getRegulatoryReport", this.slug, params, (res) => {
                this.loading = false;
                if (res.ok) {
                    this.report = res.report;
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        /**
         * Human label for a report period (month name or date range).
         * @param {object} period Report period descriptor
         * @returns {string} Period label
         */
        periodLabel(period) {
            if (period.mode === "range") {
                return `${period.startDate} – ${period.endDate}`;
            }
            return `${this.monthLabel(period.month)} ${period.year}`;
        },

        /**
         * Localised month name for a 1-based month number.
         * @param {number} m Month (1-12)
         * @returns {string} Month name
         */
        monthLabel(m) {
            const date = new Date(2000, m - 1, 1);
            return date.toLocaleString(this.$i18n?.locale || "en", { month: "long" });
        },

        /**
         * Format a percentage value (already 0-100), or a dash when null.
         * @param {?number} v Percentage value
         * @returns {string} Formatted percentage
         */
        fmtPct(v) {
            return v === null || v === undefined ? "—" : `${v.toFixed(2)}%`;
        },

        /**
         * Format a duration in minutes as a compact "Xd Yh Zm" string.
         * @param {?number} mins Minutes
         * @returns {string} Human duration
         */
        fmtDuration(mins) {
            if (mins === null || mins === undefined) {
                return "—";
            }
            if (mins <= 0) {
                return "0m";
            }
            const days = Math.floor(mins / 1440);
            const hours = Math.floor((mins % 1440) / 60);
            const minutes = Math.round(mins % 60);
            const parts = [];
            if (days) {
                parts.push(`${days}d`);
            }
            if (hours) {
                parts.push(`${hours}h`);
            }
            if (minutes || parts.length === 0) {
                parts.push(`${minutes}m`);
            }
            return parts.join(" ");
        },

        /**
         * Colour class for an availability percentage.
         * @param {number} v Availability percentage (0-100)
         * @returns {string} Text colour class
         */
        availabilityClass(v) {
            if (v >= 99.9) {
                return "text-success";
            }
            if (v >= 99) {
                return "text-warning";
            }
            return "text-danger";
        },

        /**
         * Human label for an impact level (matches IncidentHistory).
         * @param {string} s Impact key
         * @returns {string} Label
         */
        impactLabel(s) {
            return { none: "None", minor: "Minor", major: "Major", critical: "Critical" }[s] || s;
        },

        /**
         * Bootstrap badge class for an impact level.
         * @param {string} impact Impact key
         * @returns {string} Badge class
         */
        impactBadgeClass(impact) {
            return {
                none: "bg-secondary",
                minor: "bg-warning text-dark",
                major: "bg-warning text-dark",
                critical: "bg-danger",
            }[impact] || "bg-secondary";
        },

        /**
         * Escape a value for CSV output.
         *
         * Besides quoting, neutralize spreadsheet formula injection: a cell whose
         * first character is one of = + - @ (or a leading tab/CR that Excel trims)
         * is treated as a formula by Excel/LibreOffice and would execute when the
         * report is opened. Monitor names and incident text come from lower-trust
         * authors than whoever opens the regulatory CSV, so prefix such cells with
         * a single quote to force them to be read as literal text.
         * @param {*} value Raw value
         * @returns {string} Quoted, escaped CSV cell
         */
        csvCell(value) {
            let s = value === null || value === undefined ? "" : String(value);
            if (/^[=+\-@\t\r]/.test(s)) {
                s = `'${s}`;
            }
            return `"${s.replace(/"/g, '""')}"`;
        },

        /**
         * Build and download the report as a CSV file.
         * @returns {void}
         */
        downloadCSV() {
            const r = this.report;
            const rows = [];
            const row = (arr) => rows.push(arr.map((c) => this.csvCell(c)).join(","));

            row([ "Regulatory Report" ]);
            row([ "Status Page", r.statusPage.title, `/${r.statusPage.slug}` ]);
            row([ "Period", this.periodLabel(r.period) ]);
            row([ "From", r.period.startDate, "To", r.period.endDate ]);
            row([ "Overall Availability (%)", r.summary.overallAvailability ]);
            row([ "Total Downtime (minutes)", r.summary.totalDowntimeMinutes ]);
            row([ "Total Outages", r.summary.totalDownEvents ]);
            row([ "Incidents", r.summary.incidentsCount ]);
            row([ "Generated At", r.generatedAt ]);
            row([ "Generated By", r.generatedBy || "" ]);
            row([]);

            row([ "System", "Availability (%)", "Downtime (minutes)", "Outages", "Checks", "Up", "Down", "Monitored Days" ]);
            for (const s of r.systems) {
                row([ s.name, s.availability ?? "", s.downtimeMinutes, s.downEvents, s.checks, s.up, s.down, s.monitoredDays ]);
            }
            row([]);

            row([ "Impact", "Title", "Description", "Affected Systems", "Start", "End", "Duration (minutes)", "Status" ]);
            for (const inc of r.incidents) {
                row([
                    this.impactLabel(inc.impact),
                    inc.title,
                    inc.description,
                    inc.affectedSystems.join("; "),
                    inc.startDate,
                    inc.ongoing ? "Ongoing" : inc.endDate,
                    inc.durationMinutes,
                    inc.incidentStatus,
                ]);
            }

            // Prepend a UTF-8 BOM so Excel reads it correctly.
            const csv = "﻿" + rows.join("\r\n");
            const blob = new Blob([ csv ], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const periodTag = r.period.mode === "range"
                ? `${r.period.startDate}_${r.period.endDate}`
                : `${r.period.year}-${String(r.period.month).padStart(2, "0")}`;
            a.download = `regulatory-report-${r.statusPage.slug}-${periodTag}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },

        /**
         * Open the browser print dialog (used to save the report as a PDF).
         * @returns {void}
         */
        printReport() {
            window.print();
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

.summary-card {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    padding: 14px 16px;
    height: 100%;

    .label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: $dark-font-color2;
    }

    .value {
        font-size: 22px;
        font-weight: 700;
        margin-top: 4px;
    }
}

.dark {
    .summary-card {
        border-color: rgba(255, 255, 255, 0.1);
    }
}

.report-head h3 {
    font-weight: 700;
}
</style>

<!-- Soca: print isolation — only the report shows when printing / saving as PDF. -->
<style>
@media print {
    body * {
        visibility: hidden !important;
    }

    .report-printable,
    .report-printable * {
        visibility: visible !important;
    }

    .report-printable {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        padding: 0 12px;
    }

    .d-print-none {
        display: none !important;
    }
}
</style>
