# Features — Soca Status (Uptime Kuma 2.4.0 fork)

Customized **Uptime Kuma 2.4.0** for Soca. This document lists the **existing**
features, separating **Soca customizations** from **upstream Uptime Kuma**, with
pointers to the relevant source files for handover.

> Base: Uptime Kuma `2.4.0` · Node ≥ 20.4.0 · DB: SQLite or MariaDB

---

## A. Soca customizations

### A.1 Incident lifecycle & timeline
- **Lifecycle status**: `Investigating → Identified → Monitoring → Resolved`.
- **Impact level**: `None / Minor / Major / Critical` (colored badge).
- **Timeline updates / post**: post lifecycle updates; each is stored with status + message + timestamp; newest first.
- **Auto-seed**: first timeline entry is created automatically when an incident is posted; resolving records a `resolved` entry.

Code:
- DB: `db/knex_migrations/2026-06-19-0000-add-incident-lifecycle.js` (columns `incident_status`, `impact`; table `incident_update`)
- Model: `server/model/incident.js` (`toPublicJSON`, `resolve`)
- Server: `server/socket-handlers/status-page-socket-handler.js` (`postIncident`, `editIncident`, `resolveIncident`, `addIncidentUpdate`)
- Aggregation: `server/model/status_page.js` (`attachIncidentUpdates`)
- UI: `src/components/IncidentEditForm.vue`, `src/components/IncidentManageModal.vue`, `src/components/IncidentHistory.vue`, `src/pages/StatusPage.vue`

### A.2 Incident ↔ affected systems (monitors)
- Select the **affected systems (monitors)** when creating/editing an incident.
- Shown as **"Sistem terdampak"** chips on the incident card and in history.
- Drives the bar tooltip relation (see A.5): an incident only appears on the bars of monitors it actually affects.

Code:
- DB: `db/knex_migrations/2026-06-19-0002-add-incident-monitor.js` (table `incident_monitor`)
- Server: `setIncidentMonitors()` in `status-page-socket-handler.js`; `affectedMonitors` attached in `status_page.js`
- UI: checkboxes in `IncidentEditForm.vue` / `IncidentManageModal.vue`; chips in `StatusPage.vue` / `IncidentHistory.vue`

### A.3 90-day uptime bar (Atlassian-style)
- Per-monitor **90-day daily status bar** with color palette (Operational / Degraded / Partial outage / Major outage / No data) and **% uptime**.
- Built from 2.x `UptimeCalculator` daily buckets; backend returns a ready-to-render array (UTC day keys — **no timezone off-by-one**).
- **Status pill** (current state from latest heartbeat) + legend + overall status banner.

Code:
- API: `GET /api/status-page/:slug/uptime-calendar` in `server/routers/status-page-router.js`
- UI: `bm-uptime` section + `monitorBars`/`monitorPill`/`monitorUptimeLabel` in `src/pages/StatusPage.vue`

### A.4 Live heartbeat pulse + "Live" caption
- Native Kuma real-time heartbeat pulse shown **above** the 90-day bar, with a pulsing **● LIVE** caption (merged "daily + 90-day" into one row).

Code: `HeartbeatBar` usage + `.bm-live` in `src/pages/StatusPage.vue`

### A.5 Rich hover tooltip (light)
- On hover of a day segment: **date, status, response time, checks, daily note, related incidents**.
- **Related incidents** appear only when the incident is related to that monitor (explicit affected-systems relation; falls back to status-based gating for incidents with no declared systems) **and** has an impact.

Code: `showBarTip` / `.bm-tooltip` in `src/pages/StatusPage.vue`

### A.6 Per-monitor daily notes
- Admin clicks a day segment (edit mode) to **add / edit / clear** a note for that day.
- Note shows in the tooltip (📝) and the monthly calendar; marked segment gets a small indicator.

Code:
- DB: `db/knex_migrations/2026-06-19-0001-add-monitor-daily-note.js` (table `monitor_daily_note`)
- Server: `setMonitorDailyNote` in `status-page-socket-handler.js`; notes attached in the uptime-calendar route
- UI: `editDailyNote` in `StatusPage.vue`; `src/components/UptimeCalendar.vue`

### A.7 Maintenance above the monitor list
- Active/scheduled maintenance shown as a prominent card **above** the monitor list on the public page.

Code: `bm-maint` block in `src/pages/StatusPage.vue`

### A.8 Incident card styling
- Colored **header** (per incident style) with a **light body** so the timeline/content stays readable; dark-mode aware.

Code: `.incident-card` / `.incident-header` / `.incident-body` in `src/pages/StatusPage.vue`

### A.9 Dedicated History & Uptime pages
- `/status/:slug/history` and `/status/:slug/uptime` — tabbed page with **month navigation**, incident history (impact/status badges + timeline), and a **monthly uptime calendar grid** per monitor.
- Links ("Incident history →", "Lihat uptime historis →") from the status page.

Code: `src/pages/StatusInsights.vue`, `src/components/UptimeCalendar.vue`, routes in `src/router.js`

### A.10 Public status page reskin
- Single unified per-monitor component (no duplicate "daily" + "90-day"); native monitor list shown only in edit mode (for management). Public view is read-only.

---

## B. Database additions (auto-migrated)

All via **knex migrations** (run automatically on fresh install and on upgrade; DB-agnostic for SQLite & MariaDB):

| Migration | Adds |
|---|---|
| `2026-06-19-0000-add-incident-lifecycle.js` | `incident.incident_status`, `incident.impact`, table `incident_update` |
| `2026-06-19-0001-add-monitor-daily-note.js` | table `monitor_daily_note` |
| `2026-06-19-0002-add-incident-monitor.js` | table `incident_monitor` |

No manual SQL is required on deploy.

---

## C. Access control
- Every incident/note operation requires an authenticated admin session — `checkLogin(socket)` in `server/util-server.js`.
  Handlers: `postIncident`, `editIncident`, `addIncidentUpdate`, `resolveIncident`, `deleteIncident`, `unpinIncident`, `setMonitorDailyNote`.
- Uptime Kuma is **single-admin** (no roles/permissions); whoever holds the admin credentials can manage everything. 2FA available in Settings.
- Public visitors are **read-only** (view incidents, timeline, history, affected systems, uptime bars).

---

## D. Deployment
- `Dockerfile` + `Dockerfile.dockerignore` — self-contained image (BuildKit).
- `deploy/deploy.sh` — rsync source to server, build, restart service (no git required).
- `deploy/soca.service` — systemd unit.
- `deploy/README.md` — full runbook (Docker & systemd), nginx HTTPS, data preservation.

---

## E. Not yet implemented
- ⬜ **Subscribe (email / webhook)** — public subscription + notify subsystem (deferred).

---

## F. Upstream Uptime Kuma 2.4.0 (still available)
- Many **monitor types**: HTTP(s), TCP, Ping, DNS, Keyword, JSON-query, gRPC, Docker, databases, Steam/GameDig, Push, and more.
- **Notifications**: 90+ channels (SMTP/email, Telegram, Slack, Discord, generic webhook, etc.).
- **Status pages**: multiple, slug + custom domain, theme, custom CSS, logo, status badge (SVG), RSS feed.
- **Maintenance**: scheduled (single / recurring / cron).
- **Incident history** with cursor pagination (enriched here with lifecycle/impact/timeline).
- **2FA**, retry/interval, TLS certificate expiry, tags, proxies, aggregate stats (`stat_daily/hourly/minutely`).
