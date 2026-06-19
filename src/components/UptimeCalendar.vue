<template>
    <div class="uptime-calendar">
        <div class="cal-head">
            <span class="cal-name">{{ name }}</span>
            <span v-if="uptime !== null && uptime !== undefined" class="cal-uptime">{{ uptime.toFixed(2) }}% uptime</span>
            <span v-else class="cal-uptime text-muted">{{ $t("notAvailableShort") }}</span>
        </div>
        <div class="cal-row">
            <div v-for="m in months" :key="m.key" class="cal-month">
                <div class="cal-mlabel">{{ m.label }}</div>
                <div class="cal-grid">
                    <div v-for="w in weekdays" :key="'wd'+w" class="cal-wd">{{ w }}</div>
                    <div
                        v-for="(cell, idx) in m.cells"
                        :key="idx"
                        class="cal-cell"
                        :class="[cell.cls, { 'has-note': cell.hasNote, editable: editMode && cell.dk }]"
                        @click="onCellClick(cell)"
                        @mouseover="cell.dk ? showTip($event, cell) : null"
                        @mouseout="cell.dk ? hideTip() : null"
                    ></div>
                </div>
            </div>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-show="tip.show" class="cal-tooltip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }" v-html="tip.html"></div>
    </div>
</template>

<script>
export default {
    props: {
        name: { type: String, default: "" },
        /** Map of 'YYYY-MM-DD' -> status word (up|warn|partial|down|none) */
        days: { type: Object, default: () => ({}) },
        /** Map of 'YYYY-MM-DD' -> note text */
        notes: { type: Object, default: () => ({}) },
        /** Map of 'YYYY-MM-DD' -> { downMin, rt, checks } */
        dayInfo: { type: Object, default: () => ({}) },
        uptime: { type: Number, default: null },
        monitorId: { type: [ Number, String ], default: null },
        editMode: { type: Boolean, default: false },
    },
    emits: [ "edit-note" ],
    data() {
        return {
            weekdays: [ "Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb" ],
            monthNames: [ "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des" ],
            statusLabel: {
                up: "Operational", warn: "Degraded", partial: "Partial outage",
                down: "Major outage", none: "Tidak ada data",
            },
            tip: { show: false, x: 0, y: 0, html: "" },
        };
    },
    computed: {
        // Build the calendar months spanning the last 90 days (oldest → newest).
        months() {
            const pad = (n) => String(n).padStart(2, "0");
            const today = new Date();
            const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
            const start = new Date(end);
            start.setUTCDate(start.getUTCDate() - 89);

            const endKey = `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}`;

            const result = [];
            let y = start.getUTCFullYear();
            let mo = start.getUTCMonth() + 1; // 1-based
            const ey = end.getUTCFullYear();
            const em = end.getUTCMonth() + 1;

            while (y < ey || (y === ey && mo <= em)) {
                const firstWd = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
                const daysIn = new Date(Date.UTC(y, mo, 0)).getUTCDate();
                const cells = [];
                for (let k = 0; k < firstWd; k++) {
                    cells.push({ cls: "cal-empty", title: "" });
                }
                for (let d = 1; d <= daysIn; d++) {
                    const dk = `${y}-${pad(mo)}-${pad(d)}`;
                    if (dk > endKey) {
                        cells.push({ cls: "cal-future", title: "" });
                        continue;
                    }
                    const status = this.days[dk] || "none";
                    const note = this.notes[dk] || "";
                    const di = this.dayInfo[dk] || null;
                    const label = `${d} ${this.monthNames[mo - 1]} ${y}`;
                    cells.push({
                        cls: "cal-" + status,
                        dk,
                        status,
                        label,
                        hasNote: !!note,
                        note,
                        downMin: di ? di.downMin : null,
                        rt: di ? di.rt : null,
                        checks: di ? di.checks : null,
                    });
                }
                result.push({ key: `${y}-${mo}`, label: `${this.monthNames[mo - 1]} ${y}`, cells });
                if (++mo > 12) {
                    mo = 1;
                    y++;
                }
            }
            return result;
        },
    },
    methods: {
        onCellClick(cell) {
            if (this.editMode && cell.dk) {
                this.$emit("edit-note", { monitorId: this.monitorId, day: cell.dk, note: cell.note });
            }
        },
        esc(s) {
            return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        },
        /**
         * Rich tooltip with uptime detail for a calendar day cell
         * @param {Event} event Mouse event
         * @param {object} cell The calendar cell object
         * @returns {void}
         */
        showTip(event, cell) {
            const colorMap = { up: "#1d9e75", warn: "#ba7517", partial: "#d85a30", down: "#e24b4a", none: "#9e9d99" };
            let statusLine;
            if (cell.status === "up") {
                statusLine = "Tidak ada gangguan tercatat pada hari ini.";
            } else if (cell.status === "none") {
                statusLine = "Tidak ada data untuk hari ini.";
            } else {
                const label = { warn: "Degraded performance", partial: "Partial outage", down: "Major outage" }[cell.status] || cell.status;
                if (cell.downMin) {
                    const h = Math.floor(cell.downMin / 60);
                    const m = cell.downMin % 60;
                    statusLine = `${label} — ${h > 0 ? h + " jam " + m + " menit" : m + " menit"}`;
                } else {
                    statusLine = label;
                }
            }
            let html = `<div class="ct-date">${cell.label}</div>`;
            html += `<div class="ct-status"><span class="ct-dot" style="background:${colorMap[cell.status]}"></span><span>${this.esc(statusLine)}</span></div>`;
            if (cell.status !== "none" && (cell.rt != null || cell.checks != null)) {
                const parts = [];
                if (cell.rt != null) {
                    parts.push(`Response ~${cell.rt} ms`);
                }
                if (cell.checks) {
                    parts.push(`${cell.checks} pengecekan`);
                }
                if (parts.length) {
                    html += `<div class="ct-resp">${parts.join(" · ")}</div>`;
                }
            }
            if (cell.note) {
                html += `<div class="ct-note">📝 ${this.esc(cell.note)}</div>`;
            }
            this.tip.html = html;
            this.tip.show = true;
            const target = event.target;
            this.$nextTick(() => {
                const tipEl = this.$el.querySelector(".cal-tooltip");
                if (!tipEl) {
                    return;
                }
                const r = target.getBoundingClientRect();
                const tr = tipEl.getBoundingClientRect();
                let left = r.left + r.width / 2 - tr.width / 2;
                let top = r.top - tr.height - 8;
                if (top < 0) {
                    top = r.bottom + 8;
                }
                left = Math.max(6, Math.min(left, document.documentElement.clientWidth - tr.width - 6));
                this.tip.x = left;
                this.tip.y = top;
            });
        },
        hideTip() {
            this.tip.show = false;
        },
    },
};
</script>

<style lang="scss" scoped>
.uptime-calendar {
    margin: 0.6rem 0 1rem;

    .cal-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;
    }
    .cal-name { font-weight: 600; }
    .cal-uptime { font-size: 13px; opacity: 0.75; }

    .cal-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
    }
    .cal-mlabel {
        font-size: 11px;
        font-weight: 600;
        opacity: 0.6;
        text-align: center;
        margin-bottom: 5px;
    }
    .cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 16px);
        gap: 3px;
    }
    .cal-wd { font-size: 9px; opacity: 0.5; text-align: center; }
    .cal-cell {
        width: 16px;
        height: 16px;
        border-radius: 3px;
    }
    .cal-empty, .cal-future { background: transparent; }
    .cal-none { background: rgba(128, 128, 128, 0.2); }
    .cal-up { background: #4caf50; }
    .cal-warn { background: #f0a02f; }
    .cal-partial { background: #e8702a; }
    .cal-down { background: #dc3545; }
    .cal-cell[title]:hover { outline: 2px solid rgba(128, 128, 128, 0.5); cursor: default; }
    .cal-cell.editable { cursor: pointer; }
    // Note marker: small blue underline strip inside the cell
    .cal-cell.has-note { box-shadow: inset 0 -4px 0 0 #2f7ce0; }
}

.cal-tooltip {
    position: fixed; z-index: 1080; pointer-events: none;
    background: #1a1a18; color: #f5f5f3;
    font-size: 11px; line-height: 1.45; padding: 8px 11px; border-radius: 7px;
    max-width: 280px; white-space: normal; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);

    .ct-date { font-weight: 600; font-size: 12px; }
    .ct-status { margin-top: 3px; display: flex; align-items: flex-start; gap: 6px; opacity: 0.92; }
    .ct-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; margin-top: 4px; }
    .ct-resp { margin-top: 3px; opacity: 0.75; }
    .ct-note { margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.18); font-weight: 500; }
}
</style>
