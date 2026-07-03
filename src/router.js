import { createRouter, createWebHistory } from "vue-router";

import EmptyLayout from "./layouts/EmptyLayout.vue";
import Layout from "./layouts/Layout.vue";
import Dashboard from "./pages/Dashboard.vue";
import DashboardHome from "./pages/DashboardHome.vue";
import Details from "./pages/Details.vue";
import EditMonitor from "./pages/EditMonitor.vue";
import EditMaintenance from "./pages/EditMaintenance.vue";
import List from "./pages/List.vue";
const Settings = () => import("./pages/Settings.vue");
import Setup from "./pages/Setup.vue";
import StatusPage from "./pages/StatusPage.vue";
import StatusInsights from "./pages/StatusInsights.vue";
import Entry from "./pages/Entry.vue";
import ManageStatusPage from "./pages/ManageStatusPage.vue";
import AddStatusPage from "./pages/AddStatusPage.vue";
import NotFound from "./pages/NotFound.vue";
import DockerHosts from "./components/settings/Docker.vue";
import ManageMaintenance from "./pages/ManageMaintenance.vue";
import APIKeys from "./components/settings/APIKeys.vue";
import SetupDatabase from "./pages/SetupDatabase.vue";

// Settings - Sub Pages
import Appearance from "./components/settings/Appearance.vue";
import General from "./components/settings/General.vue";
const Notifications = () => import("./components/settings/Notifications.vue");
import ReverseProxy from "./components/settings/ReverseProxy.vue";
import Tags from "./components/settings/Tags.vue";
import MonitorHistory from "./components/settings/MonitorHistory.vue";
const Security = () => import("./components/settings/Security.vue");
import Proxies from "./components/settings/Proxies.vue";
import About from "./components/settings/About.vue";
import RemoteBrowsers from "./components/settings/RemoteBrowsers.vue";
// Soca: user/role management page + permission helpers for route guarding.
import Users from "./components/settings/Users.vue";
import Roles from "./components/settings/Roles.vue";
import AuditLog from "./components/settings/AuditLog.vue";
import { can, permissionsState } from "./permissions-state.js";

const routes = [
    {
        path: "/",
        component: Entry,
    },
    {
        // If it is "/dashboard", the active link is not working
        // If it is "", it overrides the "/" unexpectedly
        // Give a random name to solve the problem.
        path: "/empty",
        component: Layout,
        children: [
            {
                path: "",
                component: Dashboard,
                children: [
                    {
                        name: "DashboardHome",
                        path: "/dashboard",
                        component: DashboardHome,
                        children: [
                            {
                                path: "/dashboard/:id",
                                component: EmptyLayout,
                                children: [
                                    {
                                        path: "",
                                        component: Details,
                                    },
                                    {
                                        path: "/edit/:id",
                                        component: EditMonitor,
                                        meta: { permission: "components" },
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        path: "/add",
                        component: EditMonitor,
                        meta: { permission: "components" },
                        children: [
                            {
                                path: "/clone/:id",
                                component: EditMonitor,
                                meta: { permission: "components" },
                            },
                        ],
                    },
                    {
                        path: "/list",
                        component: List,
                    },
                    {
                        path: "/settings",
                        component: Settings,
                        children: [
                            {
                                path: "general",
                                component: General,
                                meta: { permission: "settings" },
                            },
                            {
                                path: "appearance",
                                component: Appearance,
                            },
                            {
                                path: "users",
                                component: Users,
                                meta: { permission: "users" },
                            },
                            {
                                path: "roles",
                                component: Roles,
                                meta: { permission: "users" },
                            },
                            {
                                path: "audit-log",
                                component: AuditLog,
                                meta: { permission: "users" },
                            },
                            {
                                path: "notifications",
                                component: Notifications,
                                meta: { permission: "settings" },
                            },
                            {
                                path: "reverse-proxy",
                                component: ReverseProxy,
                                meta: { permission: "settings" },
                            },
                            {
                                path: "tags",
                                component: Tags,
                                meta: { permission: "components" },
                            },
                            {
                                path: "monitor-history",
                                component: MonitorHistory,
                                meta: { permission: "settings" },
                            },
                            {
                                path: "docker-hosts",
                                component: DockerHosts,
                                meta: { permission: "settings" },
                            },
                            {
                                path: "remote-browsers",
                                component: RemoteBrowsers,
                                meta: { permission: "settings" },
                            },
                            {
                                path: "security",
                                component: Security,
                            },
                            {
                                path: "api-keys",
                                component: APIKeys,
                                meta: { permission: "settings" },
                            },
                            {
                                path: "proxies",
                                component: Proxies,
                                meta: { permission: "settings" },
                            },
                            {
                                path: "about",
                                component: About,
                            },
                        ],
                    },
                    {
                        path: "/manage-status-page",
                        component: ManageStatusPage,
                        meta: { anyPermission: [ "components", "incidents" ] },
                    },
                    {
                        path: "/add-status-page",
                        component: AddStatusPage,
                        meta: { permission: "components" },
                    },
                    {
                        path: "/maintenance",
                        component: ManageMaintenance,
                        meta: { permission: "components" },
                    },
                    {
                        path: "/add-maintenance",
                        component: EditMaintenance,
                        meta: { permission: "components" },
                    },
                    {
                        path: "/maintenance/edit/:id",
                        component: EditMaintenance,
                        meta: { permission: "components" },
                    },
                    {
                        path: "/maintenance/clone/:id",
                        component: EditMaintenance,
                        meta: { permission: "components" },
                    },
                ],
            },
        ],
    },
    {
        path: "/setup",
        component: Setup,
    },
    {
        path: "/setup-database",
        component: SetupDatabase,
    },
    {
        path: "/status-page",
        component: StatusPage,
    },
    {
        path: "/status",
        component: StatusPage,
    },
    {
        // Soca: dedicated incident history page
        path: "/status/:slug/history",
        component: StatusInsights,
    },
    {
        // Soca: dedicated uptime page
        path: "/status/:slug/uptime",
        component: StatusInsights,
    },
    {
        // Soca: dedicated maintenance history page
        path: "/status/:slug/maintenance",
        component: StatusInsights,
    },
    {
        path: "/status/:slug",
        component: StatusPage,
    },
    {
        path: "/:pathMatch(.*)*",
        component: NotFound,
    },
];

export const router = createRouter({
    linkActiveClass: "active",
    history: createWebHistory(),
    routes,
});

// Soca: gate navigation by role. UX / defense-in-depth only — the server always
// enforces the real permission checks. If permissions aren't loaded yet (before
// login), navigation is allowed and the auth flow takes over.
router.beforeEach((to, from, next) => {
    const meta = to.meta || {};

    // Permissions not known yet (e.g. hard refresh before login completes):
    // let the auth flow decide; the menu hiding + server still enforce access.
    if (!permissionsState.loaded) {
        return next();
    }

    let allowed = true;

    if (meta.permission) {
        allowed = can(meta.permission);
    } else if (meta.anyPermission) {
        allowed = meta.anyPermission.some((p) => can(p));
    }

    if (!allowed) {
        next("/dashboard");
    } else {
        next();
    }
});
