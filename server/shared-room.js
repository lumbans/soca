// Soca: multi-user shared dashboard.
//
// Upstream Uptime Kuma is single-user: every authenticated socket joins a room
// named after its own user id, and monitor/heartbeat/status broadcasts target
// that per-user room. For a team (NOC/CISO/DevOps) everyone must see the SAME
// monitors and receive the SAME live updates, so every authenticated socket
// also joins this one shared room and live broadcasts are sent here instead of
// to the data owner's room.
module.exports = {
    SHARED_DASHBOARD_ROOM: "shared-dashboard",
};
