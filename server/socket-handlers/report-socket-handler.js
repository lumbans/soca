// Soca: Regulatory availability report.
//
// Produces an availability + incident (disruption) report for a status page over
// a chosen period (a calendar month, or a custom date range), intended for
// regulatory reporting (e.g. system availability & gangguan reports to a
// financial regulator). Read-only; gated by the "incidents" capability.
//
// Availability % is aggregated from UptimeCalculator daily buckets (same source
// as the 90-day bar). Downtime is measured accurately from actual DOWN events:
// important heartbeats mark every status transition and are never pruned by the
// retention job, so walking them gives exact down durations even for old months.
const { R } = require("redbean-node");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const { checkPermission } = require("../util-server");
const { UptimeCalculator } = require("../uptime-calculator");
const StatusPage = require("../model/status_page");
const { DOWN } = require("../../src/util");

const SECONDS_PER_DAY = 86400;
const MAX_REPORT_DAYS = 366; // UptimeCalculator keeps ~1 year of daily buckets

// Impact severity order, worst first — used to summarise the worst impact seen.
const IMPACT_SEVERITY = { critical: 3, major: 2, minor: 1, none: 0 };

// Soca: in-memory report cache. Building a report walks every monitor's daily
// buckets and DOWN-event history, so we cache the computed result. Ongoing
// periods (still accruing heartbeats) get a short TTL; fully-elapsed periods are
// historical and rarely change, so they get a long TTL. Incident/page mutations
// clear the whole cache via clearReportCache(). The user attribution
// (generatedBy) is stamped per-request, not cached.
const reportCache = new Map(); // key -> { report, expiresAt }
const REPORT_CACHE_MAX = 200;
const TTL_ONGOING_MS = 60 * 1000; // 1 minute for a period that is still accruing data
const TTL_COMPLETE_MS = 60 * 60 * 1000; // 1 hour for a fully-elapsed period

/**
 * Soca: cache key for a report, from the page slug and the resolved window.
 * @param {string} slug Lower-cased status page slug
 * @param {object} win Resolved window (from resolveWindow)
 * @returns {string} Cache key
 */
function reportCacheKey(slug, win) {
    return JSON.stringify([ slug, win.mode, win.startSec, win.endExclusiveSec ]);
}

/**
 * Soca: read a non-expired cached report, or null.
 * @param {string} key Cache key
 * @returns {object|null} Cached report (without generatedBy), or null
 */
function getCachedReport(key) {
    const entry = reportCache.get(key);
    if (!entry) {
        return null;
    }
    if (Date.now() > entry.expiresAt) {
        reportCache.delete(key);
        return null;
    }
    return entry.report;
}

/**
 * Soca: store a report in the cache with a completeness-based TTL.
 * @param {string} key Cache key
 * @param {object} report Report object (without generatedBy)
 * @param {boolean} complete Whether the period has fully elapsed
 * @returns {void}
 */
function setCachedReport(key, report, complete) {
    // Simple bound: evict the oldest entry when full (Map preserves insertion order).
    if (reportCache.size >= REPORT_CACHE_MAX) {
        const oldest = reportCache.keys().next().value;
        if (oldest !== undefined) {
            reportCache.delete(oldest);
        }
    }
    reportCache.set(key, {
        report,
        expiresAt: Date.now() + (complete ? TTL_COMPLETE_MS : TTL_ONGOING_MS),
    });
}

/**
 * Soca: clear the whole report cache. Called when incidents or status pages
 * change, since those affect report contents.
 * @returns {void}
 */
function clearReportCache() {
    reportCache.clear();
}

module.exports.clearReportCache = clearReportCache;

/**
 * Soca: UTC ISO(millis) boundary string for a unix-second timestamp, used to
 * compare against the `heartbeat.time` column (also stored as UTC ISO millis).
 * @param {number} sec Unix seconds
 * @returns {string} "YYYY-MM-DD HH:mm:ss.SSS" in UTC
 */
function boundary(sec) {
    return R.isoDateTimeMillis(dayjs.unix(sec).utc());
}

/**
 * Soca: measure actual downtime for a monitor within [startSec, endSec) from its
 * DOWN events. Walks important heartbeats (status transitions); the status
 * between two transitions equals the earlier transition's status.
 * @param {number} monitorID Monitor id
 * @param {number} startSec Window start (unix seconds, inclusive)
 * @param {number} endSec Window end (unix seconds, exclusive; already capped at "now")
 * @returns {Promise<{downtimeMinutes: number, downEvents: number, hasData: boolean}>} Downtime summary
 */
async function measureDowntime(monitorID, startSec, endSec) {
    const startMs = startSec * 1000;
    const endMs = endSec * 1000;
    if (endMs <= startMs) {
        return { downtimeMinutes: 0, downEvents: 0, hasData: false };
    }

    // Status just before the window (carry-in): a DOWN period may span the start.
    const carryRow = await R.getRow(
        "SELECT status FROM heartbeat WHERE monitor_id = ? AND important = 1 AND time < ? ORDER BY time DESC LIMIT 1",
        [ monitorID, boundary(startSec) ]
    );
    // Transitions inside the window.
    const rows = await R.getAll(
        "SELECT status, time FROM heartbeat WHERE monitor_id = ? AND important = 1 AND time >= ? AND time < ? ORDER BY time ASC",
        [ monitorID, boundary(startSec), boundary(endSec) ]
    );

    const hasData = carryRow != null || rows.length > 0;
    const isDown = (s) => Number(s) === DOWN;

    let downMs = 0;
    let downEvents = 0;
    let prevStatus = carryRow ? Number(carryRow.status) : null;
    let prevMs = startMs;

    if (isDown(prevStatus)) {
        downEvents += 1; // window opens during an ongoing outage
    }

    for (const beat of rows) {
        let tMs = dayjs.utc(beat.time).valueOf();
        if (Number.isNaN(tMs)) {
            continue;
        }
        tMs = Math.min(Math.max(tMs, startMs), endMs);

        if (isDown(prevStatus)) {
            downMs += tMs - prevMs;
        }
        if (!isDown(prevStatus) && isDown(beat.status)) {
            downEvents += 1; // new outage begins
        }
        prevStatus = Number(beat.status);
        prevMs = tMs;
    }

    // Tail: from the last transition to the end of the window.
    if (isDown(prevStatus)) {
        downMs += endMs - prevMs;
    }

    return {
        downtimeMinutes: Math.round(downMs / 60000),
        downEvents,
        hasData,
    };
}

/**
 * Soca: compute the resolution timestamp (unix seconds) of an incident, or null
 * if it is still ongoing. Prefers the newest "resolved" timeline entry, falling
 * back to last_updated_date when the incident is inactive.
 * @param {object} incident Incident bean
 * @returns {Promise<number|null>} Resolution time in unix seconds, or null
 */
async function incidentResolvedAt(incident) {
    if (incident.active) {
        return null;
    }
    const resolvedRow = await R.getRow(
        "SELECT created_date FROM incident_update WHERE incident_id = ? AND status = 'resolved' ORDER BY created_date DESC LIMIT 1",
        [ incident.id ]
    );
    const iso = (resolvedRow && resolvedRow.created_date) || incident.last_updated_date || incident.created_date;
    const d = dayjs.utc(iso);
    return d.isValid() ? d.unix() : null;
}

/**
 * Soca: names of the monitors (systems) an incident is declared to affect.
 * @param {number} incidentID Incident id
 * @returns {Promise<string[]>} Affected system names
 */
async function incidentAffectedNames(incidentID) {
    return await R.getCol(
        `SELECT monitor.name FROM incident_monitor
         JOIN monitor ON monitor.id = incident_monitor.monitor_id
         WHERE incident_monitor.incident_id = ?
         ORDER BY monitor.name`,
        [ incidentID ]
    );
}

/**
 * Soca: resolve the reporting window (unix-second bounds + labels) from request
 * params, supporting a calendar month or a custom inclusive date range.
 * @param {object} params { mode, year, month, startDate, endDate }
 * @param {number} nowSec Current time in unix seconds
 * @returns {object} Normalised window descriptor
 * @throws {Error} If the params are invalid or the period is unavailable
 */
function resolveWindow(params, nowSec) {
    const mode = params && params.mode === "range" ? "range" : "month";
    let startD;
    let endExclusiveD;

    if (mode === "range") {
        const dateRe = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRe.test(String(params.startDate || "")) || !dateRe.test(String(params.endDate || ""))) {
            throw new Error("Invalid date range (expected YYYY-MM-DD)");
        }
        startD = dayjs.utc(`${params.startDate}T00:00:00Z`);
        // Inclusive end date -> exclusive next-day boundary.
        endExclusiveD = dayjs.utc(`${params.endDate}T00:00:00Z`).add(1, "day");
        if (!startD.isValid() || !endExclusiveD.isValid() || !endExclusiveD.isAfter(startD)) {
            throw new Error("Start date must be on or before end date");
        }
    } else {
        const y = parseInt(params && params.year, 10);
        const m = parseInt(params && params.month, 10);
        if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12 || y < 2000 || y > 3000) {
            throw new Error("Invalid year or month");
        }
        startD = dayjs.utc(`${y}-${String(m).padStart(2, "0")}-01T00:00:00Z`);
        endExclusiveD = startD.add(1, "month");
    }

    const startSec = startD.unix();
    const endExclusiveSec = endExclusiveD.unix();

    if (startSec > nowSec) {
        throw new Error("The selected period is in the future");
    }
    if ((nowSec - startSec) / SECONDS_PER_DAY > MAX_REPORT_DAYS) {
        throw new Error("The selected period is older than a year; daily data is no longer available");
    }
    if ((endExclusiveSec - startSec) / SECONDS_PER_DAY > MAX_REPORT_DAYS) {
        throw new Error("The selected range is too long (maximum ~1 year)");
    }

    return {
        mode,
        startSec,
        endExclusiveSec,
        startDate: startD.format("YYYY-MM-DD"),
        endDate: endExclusiveD.subtract(1, "day").format("YYYY-MM-DD"),
        year: startD.year(),
        month: startD.month() + 1,
        complete: nowSec >= endExclusiveSec,
    };
}

/**
 * Socket handler for the regulatory report.
 * @param {Socket} socket Socket.io instance to add listeners on
 * @returns {void}
 */
module.exports.reportSocketHandler = (socket) => {
    // Soca: build the regulatory report for a status page + period.
    // params: { mode: "month"|"range", year, month, startDate, endDate }
    socket.on("getRegulatoryReport", async (slug, params, callback) => {
        try {
            checkPermission(socket, "incidents");

            const nowSec = Math.floor(Date.now() / 1000);
            const win = resolveWindow(params || {}, nowSec);
            const normalizedSlug = String(slug || "").toLowerCase();
            const force = !!(params && params.force);

            // Serve from cache when possible (generatedBy is stamped per request).
            const cacheKey = reportCacheKey(normalizedSlug, win);
            if (!force) {
                const cached = getCachedReport(cacheKey);
                if (cached) {
                    callback({
                        ok: true,
                        report: { ...cached, generatedBy: socket.username || null, cached: true },
                    });
                    return;
                }
            }

            const statusPageID = await StatusPage.slugToID(normalizedSlug);
            if (!statusPageID) {
                throw new Error("Status Page Not Found");
            }
            const statusPage = await R.findOne("status_page", " id = ? ", [ statusPageID ]);

            const todayKey = nowSec - (nowSec % SECONDS_PER_DAY);
            // Reporting window end (do not report beyond "now" for an ongoing period).
            const periodEndSec = Math.min(win.endExclusiveSec, nowSec);
            const periodMinutes = Math.max(0, Math.round((periodEndSec - win.startSec) / 60));

            // Daily buckets to pull so the window reaches its start.
            const daysBack = Math.min(MAX_REPORT_DAYS, Math.floor((todayKey - win.startSec) / SECONDS_PER_DAY) + 1);

            // Public monitors (systems) on this status page, with their names.
            const monitors = await R.getAll(
                `SELECT DISTINCT monitor.id AS id, monitor.name AS name
                 FROM monitor_group
                 JOIN \`group\` ON monitor_group.group_id = \`group\`.id
                 JOIN monitor ON monitor.id = monitor_group.monitor_id
                 WHERE \`group\`.public = 1 AND \`group\`.status_page_id = ?
                 ORDER BY monitor.name`,
                [ statusPageID ]
            );

            const systems = [];
            let overallUp = 0;
            let overallTotal = 0;
            let totalDowntimeMinutes = 0;
            let totalDownEvents = 0;

            for (const mon of monitors) {
                // Availability from daily buckets (checks up / total).
                let up = 0;
                let down = 0;
                let monitoredDays = 0;
                try {
                    const calc = await UptimeCalculator.getUptimeCalculator(mon.id);
                    const arr = calc.getDataArray(daysBack, "day");
                    for (const d of arr) {
                        if (d.timestamp >= win.startSec && d.timestamp < win.endExclusiveSec) {
                            const dUp = d.up || 0;
                            const dDown = d.down || 0;
                            up += dUp;
                            down += dDown;
                            if (dUp + dDown > 0) {
                                monitoredDays += 1;
                            }
                        }
                    }
                } catch (e) {
                    // No calculator/daily data for this monitor yet.
                }

                // Accurate downtime from DOWN events within the reporting window.
                const dt = await measureDowntime(mon.id, win.startSec, periodEndSec);

                const total = up + down;
                const availability = total > 0 ? up / total : null;

                overallUp += up;
                overallTotal += total;
                totalDowntimeMinutes += dt.downtimeMinutes;
                totalDownEvents += dt.downEvents;

                systems.push({
                    id: mon.id,
                    name: mon.name,
                    checks: total,
                    up,
                    down,
                    monitoredDays,
                    availability: availability != null ? +(availability * 100).toFixed(4) : null,
                    downtimeMinutes: dt.downtimeMinutes,
                    downEvents: dt.downEvents,
                });
            }

            // Incidents (disruptions) active at any point during the window.
            const rows = await R.find(
                "incident",
                " status_page_id = ? AND created_date < ? ORDER BY created_date ASC ",
                [ statusPageID, R.isoDateTime(dayjs.unix(win.endExclusiveSec).utc()) ]
            );

            const incidents = [];
            const impactCounts = { critical: 0, major: 0, minor: 0, none: 0 };
            let worstImpact = "none";

            for (const inc of rows) {
                const startD = dayjs.utc(inc.created_date);
                const startSec = startD.isValid() ? startD.unix() : win.startSec;
                const resolvedSec = await incidentResolvedAt(inc);

                // Skip incidents resolved before the window started.
                if (resolvedSec != null && resolvedSec < win.startSec) {
                    continue;
                }

                const endSec = resolvedSec != null ? resolvedSec : nowSec;
                const durationMinutes = Math.max(0, Math.round((endSec - startSec) / 60));
                const impact = inc.impact || "none";

                if (impactCounts[impact] !== undefined) {
                    impactCounts[impact] += 1;
                }
                if ((IMPACT_SEVERITY[impact] || 0) > (IMPACT_SEVERITY[worstImpact] || 0)) {
                    worstImpact = impact;
                }

                incidents.push({
                    id: inc.id,
                    title: inc.title,
                    description: inc.content,
                    impact,
                    incidentStatus: inc.incident_status || "investigating",
                    ongoing: resolvedSec == null,
                    startDate: inc.created_date,
                    endDate: resolvedSec != null ? R.isoDateTime(dayjs.unix(resolvedSec).utc()) : null,
                    durationMinutes,
                    affectedSystems: await incidentAffectedNames(inc.id),
                });
            }

            const overallAvailability = overallTotal > 0 ? +((overallUp / overallTotal) * 100).toFixed(4) : null;

            // Cacheable report body (no per-user fields).
            const report = {
                statusPage: {
                    slug: statusPage.slug,
                    title: statusPage.title,
                },
                period: {
                    mode: win.mode,
                    year: win.year,
                    month: win.month,
                    startDate: win.startDate,
                    endDate: win.endDate,
                    periodMinutes,
                    // True once the whole period has elapsed (i.e. a final report).
                    complete: win.complete,
                },
                summary: {
                    systemsCount: systems.length,
                    overallAvailability,
                    totalDowntimeMinutes,
                    totalDownEvents,
                    incidentsCount: incidents.length,
                    impactCounts,
                    worstImpact,
                },
                systems,
                incidents,
                generatedAt: R.isoDateTime(dayjs.utc()),
            };

            setCachedReport(cacheKey, report, win.complete);

            callback({
                ok: true,
                report: { ...report, generatedBy: socket.username || null, cached: false },
            });
        } catch (error) {
            callback({
                ok: false,
                msg: error.message,
            });
        }
    });
};
