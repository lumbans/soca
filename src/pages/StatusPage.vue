<template>
    <div v-if="loadedTheme" class="container mt-3 bm-status-page">
        <!-- Sidebar for edit mode -->
        <div v-if="enableEditMode" class="sidebar" data-testid="edit-sidebar">
            <div class="sidebar-body">
                <div class="my-3">
                    <label for="slug" class="form-label">{{ $t("Slug") }}</label>
                    <div class="input-group">
                        <span id="basic-addon3" class="input-group-text">/status/</span>
                        <input id="slug" v-model="config.slug" type="text" class="form-control" />
                    </div>
                </div>

                <div class="my-3">
                    <label for="title" class="form-label">{{ $t("Title") }}</label>
                    <input id="title" v-model="config.title" type="text" class="form-control" />
                </div>

                <!-- Description -->
                <div class="my-3">
                    <label for="description" class="form-label">{{ $t("Description") }}</label>
                    <textarea
                        id="description"
                        v-model="config.description"
                        class="form-control"
                        data-testid="description-input"
                    ></textarea>
                    <div class="form-text">{{ $t("markdownSupported") }}</div>
                </div>

                <!-- Footer Text -->
                <div class="my-3">
                    <label for="footer-text" class="form-label">{{ $t("Footer Text") }}</label>
                    <textarea
                        id="footer-text"
                        v-model="config.footerText"
                        class="form-control"
                        data-testid="footer-text-input"
                    ></textarea>
                    <div class="form-text">{{ $t("markdownSupported") }}</div>
                </div>

                <div class="my-3">
                    <label for="auto-refresh-interval" class="form-label">{{ $t("Refresh Interval") }}</label>
                    <input
                        id="auto-refresh-interval"
                        v-model="config.autoRefreshInterval"
                        type="number"
                        class="form-control"
                        :min="5"
                        data-testid="refresh-interval-input"
                    />
                    <div class="form-text">
                        {{ $t("Refresh Interval Description", [config.autoRefreshInterval]) }}
                    </div>
                </div>

                <div class="my-3">
                    <label for="switch-theme" class="form-label">{{ $t("Theme") }}</label>
                    <select id="switch-theme" v-model="config.theme" class="form-select" data-testid="theme-select">
                        <option value="auto">{{ $t("Auto") }}</option>
                        <option value="light">{{ $t("Light") }}</option>
                        <option value="dark">{{ $t("Dark") }}</option>
                    </select>
                </div>

                <div class="my-3 form-check form-switch">
                    <input
                        id="showTags"
                        v-model="config.showTags"
                        class="form-check-input"
                        type="checkbox"
                        data-testid="show-tags-checkbox"
                    />
                    <label class="form-check-label" for="showTags">{{ $t("Show Tags") }}</label>
                </div>

                <!-- Show Powered By -->
                <div class="my-3 form-check form-switch">
                    <input
                        id="show-powered-by"
                        v-model="config.showPoweredBy"
                        class="form-check-input"
                        type="checkbox"
                        data-testid="show-powered-by-checkbox"
                    />
                    <label class="form-check-label" for="show-powered-by">{{ $t("Show Powered By") }}</label>
                </div>

                <!-- Show certificate expiry -->
                <div class="my-3 form-check form-switch">
                    <input
                        id="show-certificate-expiry"
                        v-model="config.showCertificateExpiry"
                        class="form-check-input"
                        type="checkbox"
                        data-testid="show-certificate-expiry-checkbox"
                    />
                    <label class="form-check-label" for="show-certificate-expiry">
                        {{ $t("showCertificateExpiry") }}
                    </label>
                </div>

                <!-- Show only last heartbeat -->
                <div class="my-3 form-check form-switch">
                    <input
                        id="show-only-last-heartbeat"
                        v-model="config.showOnlyLastHeartbeat"
                        class="form-check-input"
                        type="checkbox"
                    />
                    <label class="form-check-label" for="show-only-last-heartbeat">
                        {{ $t("showOnlyLastHeartbeat") }}
                    </label>
                </div>

                <!-- Domain Name List -->
                <div class="my-3">
                    <label class="form-label">
                        {{ $t("Domain Names") }}
                        <button
                            class="p-0 bg-transparent border-0"
                            :aria-label="$t('Add a domain')"
                            @click="addDomainField"
                        >
                            <font-awesome-icon icon="plus-circle" class="action text-primary" />
                        </button>
                    </label>

                    <ul class="list-group domain-name-list">
                        <li v-for="(domain, index) in config.domainNameList" :key="index" class="list-group-item">
                            <input
                                v-model="config.domainNameList[index]"
                                type="text"
                                class="no-bg domain-input"
                                placeholder="example.com"
                            />
                            <button
                                class="p-0 bg-transparent border-0"
                                :aria-label="$t('Remove domain', [domain])"
                                @click="removeDomain(index)"
                            >
                                <font-awesome-icon icon="times" class="action remove ms-2 me-3 text-danger" />
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- Analytics -->

                <div class="my-3">
                    <label for="analyticsType" class="form-label">{{ $t("Analytics Type") }}</label>
                    <select
                        id="analyticsType"
                        v-model="config.analyticsType"
                        class="form-select"
                        data-testid="analytics-type-select"
                    >
                        <option :value="null">{{ $t("None") }}</option>
                        <option value="google">{{ $t("Google") }}</option>
                        <option value="umami">{{ $t("Umami") }}</option>
                        <option value="plausible">{{ $t("Plausible") }}</option>
                        <option value="matomo">{{ $t("Matomo") }}</option>
                    </select>
                </div>

                <div v-if="!!config.analyticsType" class="my-3">
                    <label for="analyticsId" class="form-label">{{ $t("Analytics ID") }}</label>
                    <input
                        id="analyticsId"
                        v-model="config.analyticsId"
                        type="text"
                        class="form-control"
                        data-testid="analytics-id-input"
                    />
                </div>

                <div v-if="!!config.analyticsType && config.analyticsType !== 'google'" class="my-3">
                    <label for="analyticsScriptUrl" class="form-label">{{ $t("Analytics Script URL") }}</label>
                    <input
                        id="analyticsScriptUrl"
                        v-model="config.analyticsScriptUrl"
                        type="url"
                        class="form-control"
                        data-testid="analytics-script-url-input"
                    />
                </div>

                <!-- RSS Title -->
                <div class="my-3">
                    <label for="rss-title" class="form-label">{{ $t("RSS Title") }}</label>
                    <input
                        id="rss-title"
                        v-model="config.rssTitle"
                        type="text"
                        class="form-control"
                        data-testid="rss-title-input"
                    />
                    <div class="form-text">
                        {{ $t("Leave blank to use status page title") }}
                    </div>
                </div>

                <!-- Custom CSS -->
                <div class="my-3">
                    <div class="mb-1">{{ $t("Custom CSS") }}</div>
                    <prism-editor
                        v-model="config.customCSS"
                        class="css-editor"
                        data-testid="custom-css-input"
                        :highlight="highlighter"
                        line-numbers
                    ></prism-editor>
                </div>

                <div v-if="$root.can('components')" class="danger-zone">
                    <button class="btn btn-danger me-2" @click="deleteDialog">
                        <font-awesome-icon icon="trash" />
                        {{ $t("Delete") }}
                    </button>
                </div>
            </div>

            <!-- Sidebar Footer -->
            <div class="sidebar-footer">
                <button v-if="$root.can('components')" class="btn btn-success me-2" :disabled="loading" data-testid="save-button" @click="save">
                    <font-awesome-icon icon="save" />
                    {{ $t("Save") }}
                </button>

                <button class="btn btn-danger me-2" @click="discard">
                    <font-awesome-icon icon="undo" />
                    {{ $t("Discard") }}
                </button>
            </div>
        </div>

        <!-- Main Status Page -->
        <div :class="{ edit: enableEditMode }" class="main">
            <!-- Logo & Title -->
            <h1 class="mb-4 title-flex">
                <!-- Logo -->
                <span class="logo-wrapper" @click="showImageCropUploadMethod">
                    <button
                        v-if="editMode"
                        type="button"
                        class="p-0 bg-transparent border-0 small-reset-btn reset-top-left"
                        @click.stop="resetToDefaultImage"
                    >
                        <font-awesome-icon icon="times" class="text-danger" />
                    </button>
                    <img :src="logoURL" alt class="logo me-2" :class="logoClass" />
                    <font-awesome-icon v-if="enableEditMode" class="icon-upload" icon="upload" />
                </span>

                <!-- Uploader -->
                <!--    url="/api/status-page/upload-logo" -->
                <ImageCropUpload
                    v-model="showImageCropUpload"
                    field="img"
                    :width="128"
                    :height="128"
                    :langType="$i18n.locale"
                    img-format="png"
                    :noCircle="true"
                    :noSquare="false"
                    @crop-success="cropSuccess"
                />

                <!-- Title -->
                <Editable v-model="config.title" tag="span" :contenteditable="editMode" :noNL="true" />
            </h1>

            <!-- Admin functions -->
            <div v-if="hasToken" class="mb-2">
                <div v-if="!enableEditMode">
                    <!-- Soca: layout editing is a "components" action. -->
                    <button
                        v-if="$root.can('components')"
                        class="btn btn-primary mb-2 me-2"
                        data-testid="edit-button"
                        @click="edit"
                    >
                        <font-awesome-icon icon="edit" />
                        {{ $t("Edit Status Page") }}
                    </button>

                    <!-- Soca: incident management is decoupled from layout edit mode. -->
                    <button
                        v-if="$root.can('incidents')"
                        class="btn btn-primary mb-2 me-2"
                        data-testid="create-incident-button"
                        @click="createIncident"
                    >
                        <font-awesome-icon icon="bullhorn" />
                        {{ $t("Create Incident") }}
                    </button>

                    <a href="/manage-status-page" class="btn btn-primary mb-2">
                        <font-awesome-icon icon="tachometer-alt" />
                        {{ $t("Go to Dashboard") }}
                    </a>
                </div>

                <div v-else>
                    <button
                        v-if="$root.can('incidents')"
                        class="btn btn-primary btn-add-group me-2"
                        @click="createIncident"
                    >
                        <font-awesome-icon icon="bullhorn" />
                        {{ $t("Create Incident") }}
                    </button>
                </div>
            </div>

            <!-- Incident Edit Form -->
            <IncidentEditForm
                v-if="
                    editIncidentMode &&
                    incident !== null &&
                    (!incident.id || !activeIncidents.some((i) => i.id === incident.id))
                "
                v-model="incident"
                :monitors="affectedMonitorOptions"
                @post="postIncident"
                @cancel="cancelIncident"
            />

            <!-- Active Pinned Incidents -->
            <template v-for="activeIncident in activeIncidents" :key="activeIncident.id">
                <!-- Edit mode for this specific incident -->
                <IncidentEditForm
                    v-if="editIncidentMode && incident !== null && incident.id === activeIncident.id"
                    v-model="incident"
                    :monitors="affectedMonitorOptions"
                    @post="postIncident"
                    @cancel="cancelIncident"
                />

                <!-- Display mode for this incident -->
                <div v-else class="shadow-box mb-4 incident incident-card" role="alert" data-testid="incident">
                    <!-- Soca: colored header bar; the body below stays light for readability -->
                    <div class="incident-header" :class="'bg-' + activeIncident.style">
                        <h4 class="alert-heading mb-0" data-testid="incident-title">{{ activeIncident.title }}</h4>
                        <!-- Soca: impact + lifecycle status badges -->
                        <div class="mt-1">
                            <span
                                v-if="activeIncident.impact && activeIncident.impact !== 'none'"
                                class="badge me-1"
                                :class="impactBadgeClass(activeIncident.impact)"
                            >{{ impactLabel(activeIncident.impact) }}</span>
                            <span class="badge bg-light text-dark">{{
                                statusLabel(activeIncident.incidentStatus)
                            }}</span>
                        </div>
                    </div>

                    <div class="incident-body">
                        <!-- eslint-disable vue/no-v-html -->
                        <div
                            class="content"
                            data-testid="incident-content"
                            v-html="getIncidentHTML(activeIncident.content)"
                        ></div>
                        <!-- eslint-enable vue/no-v-html -->

                    <!-- Soca: affected systems -->
                    <div v-if="activeIncident.affectedMonitors && activeIncident.affectedMonitors.length" class="bm-affected-row mt-2">
                        <span class="bm-affected-label">Sistem terdampak:</span>
                        <span v-for="m in activeIncident.affectedMonitors" :key="m.id" class="bm-affected-chip">{{ m.name }}</span>
                    </div>

                    <!-- Incident Date -->
                    <div class="date mt-3">
                        {{
                            $t("dateCreatedAtFromNow", {
                                date: $root.datetime(activeIncident.createdDate),
                                fromNow: dateFromNow(activeIncident.createdDate),
                            })
                        }}
                        <br />
                        <span v-if="activeIncident.lastUpdatedDate">
                            {{
                                $t("lastUpdatedAtFromNow", {
                                    date: $root.datetime(activeIncident.lastUpdatedDate),
                                    fromNow: dateFromNow(activeIncident.lastUpdatedDate),
                                })
                            }}
                        </span>
                    </div>

                    <!-- Soca: lifecycle timeline -->
                    <div
                        v-if="activeIncident.updates && activeIncident.updates.length"
                        class="incident-timeline mt-3"
                    >
                        <div v-for="(u, idx) in activeIncident.updates" :key="idx" class="timeline-item">
                            <strong>{{ statusLabel(u.status) }}</strong>
                            <span class="ms-1">{{ u.message }}</span>
                            <div class="small timeline-time">{{ $root.datetime(u.createdDate) }}</div>
                        </div>
                    </div>

                    <!-- Soca: post a lifecycle update (incident managers, no layout mode needed) -->
                    <div v-if="hasToken && $root.can('incidents')" class="add-update mt-3">
                        <div class="row g-2 align-items-center">
                            <div class="col-auto">
                                <select
                                    :value="draftField(activeIncident.id, 'status')"
                                    class="form-select form-select-sm"
                                    @change="setDraft(activeIncident.id, 'status', $event.target.value)"
                                >
                                    <option value="investigating">Investigating</option>
                                    <option value="identified">Identified</option>
                                    <option value="monitoring">Monitoring</option>
                                    <option value="update">Update</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div class="col">
                                <input
                                    :value="draftField(activeIncident.id, 'message')"
                                    class="form-control form-control-sm"
                                    :placeholder="$t('Content')"
                                    @input="setDraft(activeIncident.id, 'message', $event.target.value)"
                                />
                            </div>
                            <div class="col-auto">
                                <button class="btn btn-light btn-sm" @click="addIncidentUpdate(activeIncident)">
                                    <font-awesome-icon icon="bullhorn" /> {{ $t("Post") }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div v-if="hasToken && $root.can('incidents')" class="mt-3">
                        <button class="btn btn-light me-2" @click="resolveIncident(activeIncident)">
                            <font-awesome-icon icon="check" />
                            {{ $t("Resolve") }}
                        </button>
                        <button class="btn btn-light me-2" @click="editIncident(activeIncident)">
                            <font-awesome-icon icon="edit" />
                            {{ $t("Edit") }}
                        </button>
                        <button
                            class="btn btn-light me-2"
                            @click="$refs.incidentManageModal.showDelete(activeIncident)"
                        >
                            <font-awesome-icon icon="unlink" />
                            {{ $t("Delete") }}
                        </button>
                    </div>
                    </div><!-- /.incident-body -->
                </div>
            </template>

            <!-- Overall Status (full width) -->
            <div class="shadow-box list p-4 overall-status mb-4">
                <div v-if="Object.keys($root.publicMonitorList).length === 0 && loadedData">
                    <font-awesome-icon icon="question-circle" class="ok" />
                    {{ $t("No Services") }}
                </div>

                <template v-else>
                    <div v-if="allUp">
                        <font-awesome-icon icon="check-circle" class="ok" />
                        {{ $t("All Systems Operational") }}
                    </div>

                    <div v-else-if="partialDown">
                        <font-awesome-icon icon="exclamation-circle" class="warning" />
                        {{ $t("Partially Degraded Service") }}
                    </div>

                    <div v-else-if="allDown">
                        <font-awesome-icon icon="times-circle" class="danger" />
                        {{ $t("Degraded Service") }}
                    </div>

                    <div v-else-if="isMaintenance">
                        <font-awesome-icon icon="wrench" class="status-maintenance" />
                        {{ $t("maintenanceStatus-under-maintenance") }}
                    </div>

                    <div v-else>
                        <font-awesome-icon icon="question-circle" style="color: #efefef" />
                    </div>
                </template>
            </div>

            <!-- Description -->
            <strong v-if="editMode">{{ $t("Description") }}:</strong>
            <Editable
                v-if="enableEditMode"
                v-model="config.description"
                :contenteditable="editMode"
                tag="div"
                class="mb-4 description"
                data-testid="description-editable"
            />
            <!-- eslint-disable vue/no-v-html-->
            <div
                v-if="!enableEditMode"
                class="alert-heading p-2"
                data-testid="description"
                v-html="descriptionHTML"
            ></div>
            <!-- eslint-enable vue/no-v-html-->

            <div v-if="editMode" class="mb-4">
                <div>
                    <button class="btn btn-primary btn-add-group me-2" data-testid="add-group-button" @click="addGroup">
                        <font-awesome-icon icon="plus" />
                        {{ $t("Add Group") }}
                    </button>
                </div>

                <div class="mt-3">
                    <div v-if="sortedMonitorList.length > 0 && loadedData">
                        <label>{{ $t("Add a monitor") }}:</label>
                        <VueMultiselect
                            v-model="selectedMonitor"
                            :options="sortedMonitorList"
                            :multiple="false"
                            :searchable="true"
                            :placeholder="$t('Add a monitor')"
                            label="name"
                            trackBy="name"
                            class="mt-3"
                            data-testid="monitor-select"
                        >
                            <template #option="{ option }">
                                <div class="d-inline-flex">
                                    <span>
                                        {{ option.pathName }}
                                        <Tag v-for="tag in option.tags" :key="tag" :item="tag" :size="'sm'" />
                                    </span>
                                </div>
                            </template>
                        </VueMultiselect>
                    </div>
                    <div v-else class="text-center">
                        {{ $t("No monitors available.") }}
                        <router-link to="/add">{{ $t("Add one") }}</router-link>
                    </div>
                </div>
            </div>

            <!-- Native monitor list — edit mode only (for managing monitors/groups).
                 Public view shows the Soca 90-day uptime bars below instead. -->
            <div v-if="enableEditMode" class="mb-4">
                <div v-if="$root.publicGroupList.length === 0 && loadedData" class="text-center">
                    <!-- 👀 Nothing here, please add a group or a monitor. -->
                    👀 {{ $t("statusPageNothing") }}
                </div>

                <PublicGroupList
                    :edit-mode="enableEditMode"
                    :show-tags="config.showTags"
                    :show-certificate-expiry="config.showCertificateExpiry"
                    :show-only-last-heartbeat="config.showOnlyLastHeartbeat"
                />
            </div>

            <!-- Soca: 90-day uptime calendar (Atlassian-style) -->
            <div v-if="$root.publicGroupList.length > 0" class="bm-uptime mb-4">
                <div class="bm-uptime-head">
                    <span class="bm-section-label">Uptime 90 hari terakhir</span>
                    <router-link class="bm-more-link" :to="'/status/' + slug + '/uptime'">
                        Lihat uptime historis →
                    </router-link>
                </div>
                <p v-if="enableEditMode" class="form-text mb-2">
                    Klik sebuah segmen untuk menambah/ubah catatan harian (kosongkan untuk hapus).
                </p>
                <div v-for="group in $root.publicGroupList" :key="'bmu' + group.id" class="bm-group">
                    <div class="bm-group-name">{{ group.name }}</div>
                    <div v-for="monitor in group.monitorList" :key="'bmm' + monitor.id" class="bm-comp-row">
                        <div class="bm-comp-head">
                            <span class="bm-comp-name">{{ monitor.name }}</span>
                            <span class="bm-pill" :class="monitorPill(monitor.id).cls">
                                {{ monitorPill(monitor.id).icon }} {{ monitorPill(monitor.id).label }}
                            </span>
                        </div>
                        <!-- Soca: live heartbeat pulse (native Kuma) above the 90-day history -->
                        <div class="bm-live">
                            <span class="bm-live-label">Live</span>
                            <div class="bm-live-bar">
                                <HeartbeatBar :key="$root.userHeartbeatBar" size="small" :monitor-id="monitor.id" />
                            </div>
                        </div>
                        <div class="bm-bar">
                            <span
                                v-for="(bar, i) in monitorBars(monitor.id)"
                                :key="i"
                                class="bm-seg"
                                :class="['bm-' + bar.status, { 'bm-has-note': bar.note, 'bm-editable': enableEditMode }]"
                                @mouseover="showBarTip($event, bar, monitor.id)"
                                @mouseout="hideBarTip"
                                @click="enableEditMode && editDailyNote(monitor.id, bar)"
                            ></span>
                        </div>
                        <div class="bm-bar-meta">
                            <span>90 hari lalu</span>
                            <span>{{ monitorUptimeLabel(monitor.id) }}</span>
                            <span>Hari ini</span>
                        </div>
                    </div>
                </div>

                <div class="bm-legend">
                    <span><i class="bm-leg bm-up"></i>Operational</span>
                    <span><i class="bm-leg bm-warn"></i>Degraded</span>
                    <span><i class="bm-leg bm-partial"></i>Partial outage</span>
                    <span><i class="bm-leg bm-down"></i>Major outage</span>
                    <span><i class="bm-leg bm-none"></i>No data</span>
                </div>
            </div>
            <!-- Soca: floating bar hover tooltip -->
            <!-- eslint-disable vue/no-v-html -->
            <div
                v-show="barTip.show"
                class="bm-tooltip"
                :style="{ left: barTip.x + 'px', top: barTip.y + 'px' }"
                v-html="barTip.html"
            ></div>
            <!-- eslint-enable vue/no-v-html -->

            <!-- Soca: two-column area — Past Incidents on the left, maintenance box on the right -->
            <div class="bm-layout" :class="{ 'bm-has-side': hasSideMaintenance }">
                <div class="bm-layout-main">
            <!-- Past Incidents -->
            <div v-if="pastIncidentCount > 0" class="past-incidents-section mb-4">
                <div class="bm-uptime-head mb-3">
                    <h2 class="past-incidents-title mb-0">
                        {{ $t("Past Incidents") }}
                    </h2>
                    <router-link class="bm-more-link" :to="'/status/' + slug + '/history'">
                        Incident history →
                    </router-link>
                </div>

                <div class="past-incidents-content">
                    <div
                        v-for="(dateGroup, dateKey) in groupedIncidentHistory"
                        :key="dateKey"
                        class="incident-date-group mb-4"
                    >
                        <h4 class="incident-date-header">{{ dateKey }}</h4>
                        <div class="shadow-box incident-list-box">
                            <IncidentHistory
                                :incidents="dateGroup"
                                :edit-mode="enableEditMode"
                                :loading="incidentHistoryLoading"
                                @edit-incident="$refs.incidentManageModal.showEdit($event)"
                                @delete-incident="$refs.incidentManageModal.showDelete($event)"
                                @resolve-incident="resolveIncident"
                            />
                        </div>
                    </div>

                    <div v-if="incidentHistoryHasMore" class="load-more-controls d-flex justify-content-center mt-3">
                        <button
                            class="btn btn-outline-secondary btn-sm"
                            :disabled="incidentHistoryLoading"
                            @click="loadMoreIncidentHistory"
                        >
                            <span
                                v-if="incidentHistoryLoading"
                                class="spinner-border spinner-border-sm me-1"
                                role="status"
                            ></span>
                            {{ $t("Load More") }}
                        </button>
                    </div>
                </div>
            </div>
                </div><!-- /.bm-layout-main -->

                <!-- Soca: maintenance box (tabs + table) beside Past Incidents -->
                <aside v-if="hasSideMaintenance" class="bm-layout-side">
                    <div class="bm-maint-box shadow-box">
                        <div class="bm-maint-tabs">
                            <button
                                type="button"
                                class="bm-maint-tab"
                                :class="{ active: maintTab === 'active' }"
                                @click="maintTab = 'active'"
                            >
                                {{ $t("Maintenance") }}
                            </button>
                            <button
                                type="button"
                                class="bm-maint-tab"
                                :class="{ active: maintTab === 'scheduled' }"
                                @click="maintTab = 'scheduled'"
                            >
                                {{ $t("Scheduled Maintenance") }}
                            </button>
                        </div>

                        <!-- Active / ongoing -->
                        <div v-show="maintTab === 'active'" class="bm-maint-tabbody">
                            <div v-if="maintenanceList.length === 0" class="bm-maint-empty">
                                Tidak ada maintenance yang sedang berlangsung.
                            </div>
                            <table v-else class="bm-maint-table">
                                <thead>
                                    <tr>
                                        <th>Judul</th>
                                        <th>Status</th>
                                        <th>Tanggal &amp; Waktu</th>
                                        <th>Sistem Terdampak</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in maintenanceList" :key="'act' + m.id">
                                        <td class="bm-mt-title">{{ m.title }}</td>
                                        <td>
                                            <span class="bm-mt-badge bm-mt-active">
                                                <span class="bm-maint-dot"></span>{{ $t("In Progress") }}
                                            </span>
                                        </td>
                                        <td class="bm-mt-time">
                                            <template v-if="maintTimeRange(m)">
                                                <div>{{ maintTimeRange(m).start }}</div>
                                                <div v-if="maintTimeRange(m).end">s/d {{ maintTimeRange(m).end }}</div>
                                                <div class="bm-mt-tz">UTC{{ m.timezoneOffset }}</div>
                                            </template>
                                            <span v-else class="bm-mt-none">—</span>
                                        </td>
                                        <td class="bm-mt-systems">
                                            <template v-if="m.affectedMonitors && m.affectedMonitors.length">
                                                <span v-for="s in m.affectedMonitors" :key="s.id" class="bm-mt-chip">{{ s.name }}</span>
                                            </template>
                                            <span v-else class="bm-mt-none">—</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Scheduled / upcoming -->
                        <div v-show="maintTab === 'scheduled'" class="bm-maint-tabbody">
                            <div v-if="upcomingMaintenanceList.length === 0" class="bm-maint-empty">
                                Tidak ada maintenance yang terjadwal.
                            </div>
                            <table v-else class="bm-maint-table">
                                <thead>
                                    <tr>
                                        <th>Judul</th>
                                        <th>Status</th>
                                        <th>Tanggal &amp; Waktu</th>
                                        <th>Sistem Terdampak</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="m in upcomingMaintenanceList" :key="'up' + m.id">
                                        <td class="bm-mt-title">{{ m.title }}</td>
                                        <td>
                                            <span class="bm-mt-badge bm-mt-scheduled">{{ $t("Scheduled") }}</span>
                                        </td>
                                        <td class="bm-mt-time">
                                            <template v-if="maintTimeRange(m)">
                                                <div>{{ maintTimeRange(m).start }}</div>
                                                <div v-if="maintTimeRange(m).end">s/d {{ maintTimeRange(m).end }}</div>
                                                <div class="bm-mt-tz">UTC{{ m.timezoneOffset }}</div>
                                            </template>
                                            <span v-else class="bm-mt-none">—</span>
                                        </td>
                                        <td class="bm-mt-systems">
                                            <template v-if="m.affectedMonitors && m.affectedMonitors.length">
                                                <span v-for="s in m.affectedMonitors" :key="s.id" class="bm-mt-chip">{{ s.name }}</span>
                                            </template>
                                            <span v-else class="bm-mt-none">—</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="bm-maint-box-foot">
                            <router-link class="bm-more-link" :to="'/status/' + slug + '/maintenance'">
                                Riwayat maintenance →
                            </router-link>
                        </div>
                    </div>
                </aside>
            </div><!-- /.bm-layout -->

            <!-- Incident Manage Modal -->
            <IncidentManageModal
                v-if="enableEditMode"
                ref="incidentManageModal"
                :slug="slug"
                :monitors="affectedMonitorOptions"
                @incident-updated="loadIncidentHistory"
            />

            <footer class="mt-5 mb-4">
                <div class="custom-footer-text text-start">
                    <strong v-if="enableEditMode">{{ $t("Custom Footer") }}:</strong>
                </div>
                <Editable
                    v-if="enableEditMode"
                    v-model="config.footerText"
                    tag="div"
                    :contenteditable="enableEditMode"
                    :noNL="false"
                    class="alert-heading p-2"
                    data-testid="custom-footer-editable"
                />
                <!-- eslint-disable vue/no-v-html-->
                <div
                    v-if="!enableEditMode"
                    class="alert-heading p-2"
                    data-testid="footer-text"
                    v-html="footerHTML"
                ></div>
                <!-- eslint-enable vue/no-v-html-->

                <p v-if="config.showPoweredBy" data-testid="powered-by">
                    {{ $t("Powered by") }}
                    <a target="_blank" rel="noopener noreferrer" href="https://github.com/louislam/uptime-kuma">
                        {{ $t("Uptime Kuma") }}
                    </a>
                </p>

                <div class="refresh-info mb-2">
                    <div>{{ $t("lastUpdatedAt", { date: lastUpdateTimeDisplay }) }}</div>
                    <div data-testid="update-countdown-text">
                        {{ $t("statusPageRefreshIn", [updateCountdownText]) }}
                    </div>
                </div>
            </footer>
        </div>

        <Confirm
            ref="confirmDelete"
            btn-style="btn-danger"
            :yes-text="$t('Yes')"
            :no-text="$t('No')"
            @yes="deleteStatusPage"
        >
            {{ $t("deleteStatusPageMsg") }}
        </Confirm>

        <component is="style" v-if="config.customCSS" type="text/css">
            {{ config.customCSS }}
        </component>
    </div>
</template>

<script>
import axios from "axios";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Favico from "favico.js";
// import highlighting library (you can use any library you want just return html string)
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-css";
import "prismjs/themes/prism-tomorrow.css"; // import syntax highlighting styles
import ImageCropUpload from "vue-image-crop-upload";
// import Prism Editor
import { PrismEditor } from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css"; // import the styles somewhere
import { useToast } from "vue-toastification";
import { marked } from "marked";
import DOMPurify from "dompurify";
import Confirm from "../components/Confirm.vue";
import PublicGroupList from "../components/PublicGroupList.vue";
import HeartbeatBar from "../components/HeartbeatBar.vue";
import IncidentHistory from "../components/IncidentHistory.vue";
import IncidentManageModal from "../components/IncidentManageModal.vue";
import IncidentEditForm from "../components/IncidentEditForm.vue";
import { getResBaseURL } from "../util-frontend";
import {
    STATUS_PAGE_ALL_DOWN,
    STATUS_PAGE_ALL_UP,
    STATUS_PAGE_MAINTENANCE,
    STATUS_PAGE_PARTIAL_DOWN,
    UP,
    MAINTENANCE,
} from "../util.ts";
import Tag from "../components/Tag.vue";
import VueMultiselect from "vue-multiselect";

const toast = useToast();
dayjs.extend(duration);

const leavePageMsg = "Do you really want to leave? you have unsaved changes!";

// eslint-disable-next-line no-unused-vars
let feedInterval;

const favicon = new Favico({
    animation: "none",
});

export default {
    components: {
        PublicGroupList,
        HeartbeatBar,
        ImageCropUpload,
        Confirm,
        PrismEditor,
        Tag,
        VueMultiselect,
        IncidentHistory,
        IncidentManageModal,
        IncidentEditForm,
    },

    // Leave Page for vue route change
    beforeRouteLeave(to, from, next) {
        if (this.editMode) {
            const answer = window.confirm(leavePageMsg);
            if (answer) {
                next();
            } else {
                next(false);
            }
        }
        next();
    },

    props: {
        /** Override for the status page slug */
        overrideSlug: {
            type: String,
            required: false,
            default: null,
        },
    },

    data() {
        return {
            slug: null,
            enableEditMode: false,
            enableEditIncidentMode: false,
            hasToken: false,
            config: {
                analyticsType: null,
            },
            selectedMonitor: null,
            incident: null,
            previousIncident: null,
            // Soca: per-incident draft for posting a lifecycle update { [id]: { status, message } }
            incidentUpdateDraft: {},
            // Soca: 90-day uptime calendar { [monitorId]: { bars: [...], uptime } }
            uptimeCalendar: {},
            // Soca: floating hover tooltip for bar segments
            barTip: { show: false, x: 0, y: 0, html: "" },
            showImageCropUpload: false,
            imgDataUrl: "/icon.svg",
            loadedTheme: false,
            loadedData: false,
            baseURL: "",
            clickedEditButton: false,
            maintenanceList: [],
            // Soca: scheduled (upcoming) and ended (past) maintenance windows
            upcomingMaintenanceList: [],
            pastMaintenanceList: [],
            // Soca: active tab inside the single maintenance box ("active" | "scheduled")
            maintTab: "active",
            lastUpdateTime: dayjs(),
            updateCountdown: null,
            updateCountdownText: null,
            loading: true,
            incidentHistory: [],
            incidentHistoryLoading: false,
            incidentHistoryNextCursor: null,
            incidentHistoryHasMore: false,
        };
    },
    computed: {
        logoURL() {
            if (this.imgDataUrl.startsWith("data:")) {
                return this.imgDataUrl;
            } else {
                return this.baseURL + this.imgDataUrl;
            }
        },

        /**
         * If the monitor is added to public list, which will not be in this list.
         * @returns {object[]} List of monitors
         */
        sortedMonitorList() {
            let result = [];

            for (let id in this.$root.monitorList) {
                if (this.$root.monitorList[id] && !(id in this.$root.publicMonitorList)) {
                    let monitor = this.$root.monitorList[id];
                    result.push(monitor);
                }
            }

            result.sort((m1, m2) => {
                if (m1.active !== m2.active) {
                    if (m1.active === 0) {
                        return 1;
                    }

                    if (m2.active === 0) {
                        return -1;
                    }
                }

                if (m1.weight !== m2.weight) {
                    if (m1.weight > m2.weight) {
                        return -1;
                    }

                    if (m1.weight < m2.weight) {
                        return 1;
                    }
                }

                return m1.pathName.localeCompare(m2.pathName);
            });

            return result;
        },

        editMode() {
            // Soca: layout editing requires the "components" permission.
            return this.enableEditMode && this.$root.socket.connected && this.$root.can("components");
        },

        editIncidentMode() {
            return this.enableEditIncidentMode;
        },

        isPublished() {
            return this.config.published;
        },

        logoClass() {
            if (this.editMode) {
                return {
                    "edit-mode": true,
                };
            }
            return {};
        },

        incidentClass() {
            return "bg-" + this.incident.style;
        },

        maintenanceClass() {
            return "bg-maintenance";
        },

        overallStatus() {
            if (Object.keys(this.$root.publicLastHeartbeatList).length === 0) {
                return -1;
            }

            let status = STATUS_PAGE_ALL_UP;
            let hasUp = false;

            for (let id in this.$root.publicLastHeartbeatList) {
                let beat = this.$root.publicLastHeartbeatList[id];

                if (beat.status === MAINTENANCE) {
                    return STATUS_PAGE_MAINTENANCE;
                } else if (beat.status === UP) {
                    hasUp = true;
                } else {
                    status = STATUS_PAGE_PARTIAL_DOWN;
                }
            }

            if (!hasUp) {
                status = STATUS_PAGE_ALL_DOWN;
            }

            return status;
        },

        allUp() {
            return this.overallStatus === STATUS_PAGE_ALL_UP;
        },

        partialDown() {
            return this.overallStatus === STATUS_PAGE_PARTIAL_DOWN;
        },

        allDown() {
            return this.overallStatus === STATUS_PAGE_ALL_DOWN;
        },

        isMaintenance() {
            return this.overallStatus === STATUS_PAGE_MAINTENANCE;
        },

        incidentHTML() {
            if (this.incident && this.incident.content != null) {
                return DOMPurify.sanitize(marked(this.incident.content));
            } else {
                return "";
            }
        },

        descriptionHTML() {
            if (this.config.description != null) {
                return DOMPurify.sanitize(marked(this.config.description));
            } else {
                return "";
            }
        },

        footerHTML() {
            if (this.config.footerText != null) {
                return DOMPurify.sanitize(marked(this.config.footerText));
            } else {
                return "";
            }
        },

        lastUpdateTimeDisplay() {
            return this.$root.datetime(this.lastUpdateTime);
        },

        /**
         * Get all active pinned incidents for display at the top
         * @returns {object[]} List of active pinned incidents
         */
        activeIncidents() {
            return this.incidentHistory.filter((i) => i.active && i.pin);
        },

        /**
         * Soca: whether the right-hand maintenance sidebar has anything to show
         * (active or upcoming). Drives the two-column layout on the status page.
         * @returns {boolean} True if the sidebar should be rendered
         */
        hasSideMaintenance() {
            return this.maintenanceList.length > 0 || this.upcomingMaintenanceList.length > 0;
        },

        /**
         * Soca: flat list of public monitors (systems) for the affected-systems selector.
         * @returns {object[]} List of { id, name }
         */
        affectedMonitorOptions() {
            const out = [];
            for (const group of this.$root.publicGroupList || []) {
                for (const monitor of group.monitorList || []) {
                    out.push({ id: monitor.id, name: monitor.name });
                }
            }
            return out;
        },

        /**
         * Count of past incidents (non-active or unpinned)
         * @returns {number} Number of past incidents
         */
        pastIncidentCount() {
            return this.incidentHistory.filter((i) => !(i.active && i.pin)).length;
        },

        /**
         * Group past incidents (non-active or unpinned) by date for display
         * Active+pinned incidents are shown separately at the top, not in this section
         * @returns {object} Incidents grouped by date string
         */
        groupedIncidentHistory() {
            const groups = {};
            const pastIncidents = this.incidentHistory.filter((i) => !(i.active && i.pin));
            for (const incident of pastIncidents) {
                const dateKey = this.formatDateKey(incident.createdDate);
                if (!groups[dateKey]) {
                    groups[dateKey] = [];
                }
                groups[dateKey].push(incident);
            }
            return groups;
        },
    },
    watch: {
        /**
         * If connected to the socket and logged in, request private data of this statusPage
         * @param {boolean} loggedIn Is the client logged in?
         * @returns {void}
         */
        "$root.loggedIn"(loggedIn) {
            if (loggedIn) {
                this.$root.getSocket().emit("getStatusPage", this.slug, (res) => {
                    if (res.ok) {
                        this.config = res.config;

                        if (!this.config.customCSS) {
                            this.config.customCSS = "body {\n" + "  \n" + "}\n";
                        }
                    } else {
                        this.$root.toastError(res.msg);
                    }
                });
            }
        },

        /**
         * Selected a monitor and add to the list.
         * @param {object} monitor Monitor to add
         * @returns {void}
         */
        selectedMonitor(monitor) {
            if (monitor) {
                if (this.$root.publicGroupList.length === 0) {
                    this.addGroup();
                }

                const firstGroup = this.$root.publicGroupList[0];

                firstGroup.monitorList.push(monitor);
                this.selectedMonitor = null;
            }
        },

        // Set Theme
        "config.theme"() {
            this.$root.statusPageTheme = this.config.theme;
            this.loadedTheme = true;
        },

        "config.title"(title) {
            document.title = title;
        },

        "$root.monitorList"() {
            let count = Object.keys(this.$root.monitorList).length;

            // Since publicGroupList is getting from public rest api, monitors' tags may not present if showTags = false
            if (count > 0) {
                for (let group of this.$root.publicGroupList) {
                    for (let monitor of group.monitorList) {
                        if (monitor.tags === undefined && this.$root.monitorList[monitor.id]) {
                            monitor.tags = this.$root.monitorList[monitor.id].tags;
                        }
                    }
                }
            }
        },
    },
    async created() {
        this.hasToken = "token" in this.$root.storage();

        // Soca: if logged in, authenticate the socket now (status pages normally skip
        // socket IO) so the user's role/permissions load and admin controls can be
        // gated per role — without having to enter layout edit mode first.
        if (this.hasToken) {
            this.$root.initSocketIO(true);
        }

        // Browser change page
        // https://stackoverflow.com/questions/7317273/warn-user-before-leaving-web-page-with-unsaved-changes
        window.addEventListener("beforeunload", (e) => {
            if (this.editMode) {
                (e || window.event).returnValue = leavePageMsg;
                return leavePageMsg;
            } else {
                return null;
            }
        });

        // Special handle for dev
        this.baseURL = getResBaseURL();
    },
    async mounted() {
        this.slug = this.overrideSlug || this.$route.params.slug;

        if (!this.slug) {
            this.slug = "default";
        }

        this.getData()
            .then((res) => {
                this.config = res.data.config;

                if (!this.config.domainNameList) {
                    this.config.domainNameList = [];
                }

                if (this.config.icon) {
                    this.imgDataUrl = this.config.icon;
                }

                this.maintenanceList = res.data.maintenanceList;
                this.$root.publicGroupList = res.data.publicGroupList;

                // Soca: load the 90-day uptime calendar (best-effort)
                this.loadUptimeCalendar();

                this.loading = false;

                feedInterval = setInterval(
                    () => {
                        this.updateHeartbeatList();
                    },
                    Math.max(5, this.config.autoRefreshInterval) * 1000
                );

                this.incident = res.data.incident;
                this.maintenanceList = res.data.maintenanceList;
                // Soca: upcoming/past maintenance (fallback to [] for older payloads)
                this.upcomingMaintenanceList = res.data.upcomingMaintenanceList || [];
                this.pastMaintenanceList = res.data.pastMaintenanceList || [];
                // Default to the tab that has content (ongoing first, else scheduled)
                this.maintTab = this.maintenanceList.length > 0 ? "active" : "scheduled";
                this.$root.publicGroupList = res.data.publicGroupList;

                this.loading = false;

                // Configure auto-refresh loop
                feedInterval = setInterval(
                    () => {
                        this.updateHeartbeatList();
                    },
                    Math.max(5, this.config.autoRefreshInterval) * 1000
                );

                this.updateUpdateTimer();
            })
            .catch(function (error) {
                if (error.response.status === 404) {
                    location.href = "/page-not-found";
                }
                console.log(error);
            });

        this.updateHeartbeatList();
        this.loadIncidentHistory();

        // Go to edit page if ?edit present
        // null means ?edit present, but no value
        if (this.$route.query.edit || this.$route.query.edit === null) {
            this.edit();
        }
    },
    methods: {
        /**
         * Get status page data
         * It should be preloaded in window.preloadData
         * @returns {Promise<any>} Status page data
         */
        getData: function () {
            if (window.preloadData) {
                return new Promise((resolve) =>
                    resolve({
                        data: window.preloadData,
                    })
                );
            } else {
                return axios.get("/api/status-page/" + this.slug);
            }
        },

        /**
         * Provide syntax highlighting for CSS
         * @param {string} code Text to highlight
         * @returns {string} Highlighted CSS
         */
        highlighter(code) {
            return highlight(code, languages.css);
        },

        /**
         * Update the heartbeat list and update favicon if necessary
         * @returns {void}
         */
        updateHeartbeatList() {
            // If editMode, it will use the data from websocket.
            if (!this.editMode) {
                axios.get("/api/status-page/heartbeat/" + this.slug).then((res) => {
                    const { heartbeatList, uptimeList } = res.data;

                    this.$root.heartbeatList = heartbeatList;
                    this.$root.uptimeList = uptimeList;

                    const heartbeatIds = Object.keys(heartbeatList);
                    const downMonitors = heartbeatIds.reduce((downMonitorsAmount, currentId) => {
                        const monitorHeartbeats = heartbeatList[currentId];
                        const lastHeartbeat = monitorHeartbeats.at(-1);

                        if (lastHeartbeat) {
                            return lastHeartbeat.status === 0 ? downMonitorsAmount + 1 : downMonitorsAmount;
                        } else {
                            return downMonitorsAmount;
                        }
                    }, 0);

                    favicon.badge(downMonitors);

                    this.loadedData = true;
                    this.lastUpdateTime = dayjs();
                    this.updateUpdateTimer();
                });
            }
        },

        /**
         * Setup timer to display countdown to refresh
         * @returns {void}
         */
        updateUpdateTimer() {
            clearInterval(this.updateCountdown);

            this.updateCountdown = setInterval(() => {
                // rounding here as otherwise we sometimes skip numbers in cases of time drift
                const countdown = dayjs.duration(
                    Math.round(
                        this.lastUpdateTime.add(Math.max(5, this.config.autoRefreshInterval), "seconds").diff(dayjs()) /
                            1000
                    ),
                    "seconds"
                );

                if (countdown.as("seconds") < 0) {
                    clearInterval(this.updateCountdown);
                } else {
                    this.updateCountdownText = countdown.format("mm:ss");
                }
            }, 1000);
        },

        /**
         * Enable editing mode
         * @returns {void}
         */
        edit() {
            if (this.hasToken) {
                this.$root.initSocketIO(true);
                this.enableEditMode = true;
                this.clickedEditButton = true;

                // Try to fix #1658
                this.loadedData = true;
            }
        },

        /**
         * Save the status page
         * @returns {void}
         */
        save() {
            this.loading = true;
            let startTime = new Date();
            this.config.slug = this.config.slug.trim().toLowerCase();

            this.$root
                .getSocket()
                .emit("saveStatusPage", this.slug, this.config, this.imgDataUrl, this.$root.publicGroupList, (res) => {
                    if (res.ok) {
                        this.enableEditMode = false;
                        this.$root.publicGroupList = res.publicGroupList;

                        // Add some delay, so that the side menu animation would be better
                        let endTime = new Date();
                        let time = 100 - (endTime - startTime) / 1000;

                        if (time < 0) {
                            time = 0;
                        }

                        setTimeout(() => {
                            this.loading = false;
                            location.href = "/status/" + this.config.slug;
                        }, time);
                    } else {
                        this.loading = false;
                        toast.error(res.msg);
                    }
                });
        },

        /**
         * Show dialog confirming deletion
         * @returns {void}
         */
        deleteDialog() {
            this.$refs.confirmDelete.show();
        },

        /**
         * Request deletion of this status page
         * @returns {void}
         */
        deleteStatusPage() {
            this.$root.getSocket().emit("deleteStatusPage", this.slug, (res) => {
                if (res.ok) {
                    this.enableEditMode = false;
                    location.href = "/manage-status-page";
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        /**
         * Returns label for a specified monitor
         * @param {object} monitor Object representing monitor
         * @returns {string} Monitor label
         */
        monitorSelectorLabel(monitor) {
            return `${monitor.name}`;
        },

        /**
         * Add a group to the status page
         * @returns {void}
         */
        addGroup() {
            let groupName = this.$t("Untitled Group");

            if (this.$root.publicGroupList.length === 0) {
                groupName = this.$t("Services");
            }

            this.$root.publicGroupList.unshift({
                name: groupName,
                monitorList: [],
            });
        },

        /**
         * Add a domain to the status page
         * @returns {void}
         */
        addDomainField() {
            this.config.domainNameList.push("");
        },

        /**
         * Discard changes to status page
         * @returns {void}
         */
        discard() {
            location.href = "/status/" + this.slug;
        },

        /**
         * Set URL of new image after successful crop operation
         * @param {string} imgDataUrl URL of image in data:// format
         * @returns {void}
         */
        cropSuccess(imgDataUrl) {
            this.imgDataUrl = imgDataUrl;
        },

        /**
         * Show image crop dialog if in edit mode
         * @returns {void}
         */
        showImageCropUploadMethod() {
            if (this.editMode) {
                this.showImageCropUpload = true;
            }
        },

        /**
         * Reset logo image to default (public/icon.svg)
         * @returns {void}
         */
        resetToDefaultImage() {
            if (!this.editMode) {
                return;
            }

            this.imgDataUrl = "/icon.svg";
            this.config.icon = this.imgDataUrl;
            toast.success(this.$t("imageResetConfirmation"));
        },

        /**
         * Create an incident for this status page
         * @returns {void}
         */
        createIncident() {
            this.enableEditIncidentMode = true;

            if (this.incident) {
                this.previousIncident = this.incident;
            }

            this.incident = {
                title: "",
                content: "",
                style: "primary",
                // Soca: lifecycle defaults
                incidentStatus: "investigating",
                impact: "major",
                // Soca: affected systems (monitor ids)
                affectedMonitors: [],
            };
        },

        /**
         * Post the incident to the status page
         * @returns {void}
         */
        postIncident() {
            if (this.incident.title === "" || this.incident.content === "") {
                this.$root.toastError("Please input title and content");
                return;
            }

            this.$root.getSocket().emit("postIncident", this.slug, this.incident, (res) => {
                if (res.ok) {
                    this.enableEditIncidentMode = false;
                    this.incident = null;
                    this.loadIncidentHistory();
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        /**
         * Edit an incident inline
         * @param {object} incident - The incident to edit
         * @returns {void}
         */
        editIncident(incident) {
            this.previousIncident = this.incident;
            this.incident = {
                ...incident,
                // Soca: convert affected monitor objects to ids for the form selector
                affectedMonitors: (incident.affectedMonitors || []).map((m) => m.id),
            };
            this.enableEditIncidentMode = true;
        },

        /**
         * Cancel creation or editing of incident
         * @returns {void}
         */
        cancelIncident() {
            this.enableEditIncidentMode = false;

            if (this.previousIncident) {
                this.incident = this.previousIncident;
                this.previousIncident = null;
            }
        },

        /**
         * Unpin the incident
         * @returns {void}
         */
        unpinIncident() {
            this.$root.getSocket().emit("unpinIncident", this.slug, () => {
                this.incident = null;
            });
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

        /**
         * Soca: read a field of the per-incident update draft
         * @param {number} id Incident id
         * @param {string} field "status" | "message"
         * @returns {string} Current draft value
         */
        draftField(id, field) {
            const d = this.incidentUpdateDraft[id];
            if (d && d[field] !== undefined) {
                return d[field];
            }
            return field === "status" ? "identified" : "";
        },

        /**
         * Soca: set a field of the per-incident update draft
         * @param {number} id Incident id
         * @param {string} field "status" | "message"
         * @param {string} value New value
         * @returns {void}
         */
        setDraft(id, field, value) {
            const current = this.incidentUpdateDraft[id] || { status: "identified", message: "" };
            this.incidentUpdateDraft[id] = { ...current, [field]: value };
        },

        /**
         * Soca: post a lifecycle update (timeline) to an active incident
         * @param {object} activeIncident The incident to update
         * @returns {void}
         */
        addIncidentUpdate(activeIncident) {
            const draft = this.incidentUpdateDraft[activeIncident.id] || { status: "identified", message: "" };
            if (!draft.message || draft.message.trim() === "") {
                this.$root.toastError(this.$t("Please input content"));
                return;
            }
            this.$root
                .getSocket()
                .emit("addIncidentUpdate", this.slug, activeIncident.id, draft.status, draft.message, (res) => {
                    if (res.ok) {
                        this.incidentUpdateDraft[activeIncident.id] = { status: "identified", message: "" };
                        // Refresh the history (activeIncidents is computed from it) to show the new update.
                        this.loadIncidentHistory();
                    } else {
                        this.$root.toastError(res.msg);
                    }
                });
        },

        /**
         * Soca: load the 90-day uptime calendar for this status page (best-effort).
         * @returns {void}
         */
        loadUptimeCalendar() {
            axios
                .get("/api/status-page/" + this.slug + "/uptime-calendar")
                .then((r) => {
                    this.uptimeCalendar = (r.data && r.data.calendar) || {};
                })
                .catch(() => {});
        },

        /**
         * Soca: 90-day bar array (oldest→newest) for a monitor.
         * @param {number} mid Monitor id
         * @returns {object[]} Array of day objects
         */
        monitorBars(mid) {
            return (this.uptimeCalendar[mid] && this.uptimeCalendar[mid].bars) || [];
        },

        /**
         * Soca: 90-day uptime % label for a monitor.
         * @param {number} mid Monitor id
         * @returns {string} Label
         */
        monitorUptimeLabel(mid) {
            const u = this.uptimeCalendar[mid] && this.uptimeCalendar[mid].uptime;
            return u === null || u === undefined ? "Belum ada data" : `${u.toFixed(2)}% uptime`;
        },

        /**
         * Soca: current status pill for a monitor (from the latest heartbeat).
         * @param {number} mid Monitor id
         * @returns {object} { cls, icon, label }
         */
        monitorPill(mid) {
            const beat = this.$root.publicLastHeartbeatList && this.$root.publicLastHeartbeatList[mid];
            const st = beat ? beat.status : null;
            if (st === 1) {
                return { cls: "bm-pill-ok", icon: "✓", label: "Operational" };
            }
            if (st === 0) {
                return { cls: "bm-pill-down", icon: "✕", label: "Major outage" };
            }
            if (st === 3) {
                return { cls: "bm-pill-maint", icon: "🛠", label: "Under maintenance" };
            }
            if (st === 2) {
                return { cls: "bm-pill-warn", icon: "⚠", label: "Pending" };
            }
            return { cls: "bm-pill-none", icon: "", label: "No data" };
        },

        /**
         * Soca: show the rich hover tooltip for a bar segment.
         * @param {Event} event Mouse event
         * @param {object} bar Day object { date, status, checks, down, rt }
         * @param {number} monitorId The monitor this bar belongs to
         * @returns {void}
         */
        showBarTip(event, bar, monitorId) {
            const labels = {
                up: "Operational",
                warn: "Degraded performance",
                partial: "Partial outage",
                down: "Major outage",
                none: "Tidak ada data",
            };
            const colorMap = { up: "#1d9e75", warn: "#ba7517", partial: "#d85a30", down: "#e24b4a", none: "#9e9d99" };
            let html = `<div class="bt-date">${this.esc(bar.date)}</div>`;
            html += `<div class="bt-status"><span class="bt-dot" style="background:${colorMap[bar.status]}"></span><span>${this.esc(labels[bar.status] || bar.status)}</span></div>`;
            if (bar.status !== "none" && (bar.rt != null || bar.checks)) {
                const parts = [];
                if (bar.rt != null) {
                    parts.push(`Response ~${bar.rt} ms`);
                }
                if (bar.checks) {
                    parts.push(`${bar.checks} pengecekan`);
                }
                if (parts.length) {
                    html += `<div class="bt-resp">${parts.join(" · ")}</div>`;
                }
            }

            // Soca: per-day admin note
            if (bar.note) {
                html += `<div class="bt-note">📝 ${this.esc(bar.note)}</div>`;
            }

            // Soca: related incidents on this day with an impact. If an incident declares
            // affected systems, it only shows on those monitors' bars (explicit relation). If it
            // declares none (legacy/page-wide), fall back to showing it only when this monitor was
            // actually affected that day (degraded/partial/down).
            const monitorAffected = bar.status === "warn" || bar.status === "partial" || bar.status === "down";
            const related = (this.incidentHistory || []).filter((inc) => {
                if (this.incidentUtcDay(inc.createdDate) !== bar.date) {
                    return false;
                }
                if (!inc.impact || inc.impact === "none") {
                    return false;
                }
                if (inc.affectedMonitors && inc.affectedMonitors.length) {
                    return inc.affectedMonitors.some((m) => String(m.id) === String(monitorId));
                }
                return monitorAffected;
            });
            if (related.length) {
                html += `<div class="bt-rel-title">Related</div>`;
                html += related
                    .map(
                        (inc) =>
                            `<div class="bt-rel">${this.esc(inc.title)}<span class="bt-rel-tag"> — ${this.esc(this.impactLabel(inc.impact))} · ${this.esc(this.statusLabel(inc.incidentStatus))}</span></div>`
                    )
                    .join("");
            }

            this.barTip.html = html;
            this.barTip.show = true;
            const target = event.target;
            this.$nextTick(() => {
                const tipEl = this.$el.querySelector(".bm-tooltip");
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
                this.barTip.x = left;
                this.barTip.y = top;
            });
        },

        /**
         * Soca: hide the bar hover tooltip.
         * @returns {void}
         */
        hideBarTip() {
            this.barTip.show = false;
        },

        /**
         * Soca: add/edit/clear a per-day note for a monitor (admin, edit mode).
         * @param {number} monitorId Monitor id
         * @param {object} bar The day object { date, note, ... }
         * @returns {void}
         */
        editDailyNote(monitorId, bar) {
            this.hideBarTip();
            // eslint-disable-next-line no-alert
            const note = window.prompt(`Catatan untuk ${bar.date} (kosongkan untuk hapus):`, bar.note || "");
            if (note === null) {
                return; // cancelled
            }
            this.$root.getSocket().emit("setMonitorDailyNote", monitorId, bar.date, note, (res) => {
                if (res.ok) {
                    bar.note = note.trim() || null;
                    this.loadUptimeCalendar();
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        /**
         * Soca: the UTC calendar day (YYYY-MM-DD) of an incident's created date.
         * Matches the bar's UTC day keys so related incidents line up with the right segment.
         * @param {string} createdDate Stored created date ("YYYY-MM-DD HH:mm:ss" UTC or ISO)
         * @returns {string} UTC day string, or "" if unparseable
         */
        incidentUtcDay(createdDate) {
            if (!createdDate) {
                return "";
            }
            const iso = createdDate.includes("T") ? createdDate : createdDate.replace(" ", "T") + "Z";
            const d = new Date(iso);
            if (isNaN(d)) {
                return "";
            }
            return d.toISOString().slice(0, 10);
        },

        /**
         * Soca: minimal HTML escape for tooltip content.
         * @param {string} s Input
         * @returns {string} Escaped string
         */
        esc(s) {
            return String(s || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
        },

        /**
         * Get HTML for incident content
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
         * Get the relative time difference of a date from now
         * @param {any} date Date to get time difference
         * @returns {string} Time difference
         */
        dateFromNow(date) {
            return dayjs.utc(date).fromNow();
        },

        /**
         * Remove a domain from the status page
         * @param {number} index Index of domain to remove
         * @returns {void}
         */
        removeDomain(index) {
            this.config.domainNameList.splice(index, 1);
        },

        /**
         * Generate sanitized HTML from maintenance description
         * @param {string} description Text to sanitize
         * @returns {string} Sanitized HTML
         */
        maintenanceHTML(description) {
            if (description) {
                return DOMPurify.sanitize(marked(description));
            } else {
                return "";
            }
        },

        /**
         * Soca: compact start/end date-time for a maintenance window (first timeslot),
         * formatted in the maintenance's own timezone. Returns null when there is no
         * fixed timeslot (e.g. manual maintenance).
         * @param {object} m Public maintenance object
         * @returns {{start: string, end: (string|null)}|null} Formatted range or null
         */
        maintTimeRange(m) {
            const slot = m.timeslotList && m.timeslotList[0];
            if (!slot || !slot.startDate) {
                return null;
            }
            const tz = m.timezone || "UTC";
            const fmt = (d) => dayjs(d).tz(tz, true).format("DD MMM HH:mm");
            return {
                start: fmt(slot.startDate),
                end: slot.endDate ? fmt(slot.endDate) : null,
            };
        },

        /**
         * Load incident history for the status page
         * @returns {void}
         */
        loadIncidentHistory() {
            this.loadIncidentHistoryWithCursor(null);
        },

        /**
         * Load incident history using cursor-based pagination
         * @param {string|null} cursor - Cursor for pagination (created_date of last item)
         * @param {boolean} append - Whether to append to existing list
         * @returns {void}
         */
        loadIncidentHistoryWithCursor(cursor, append = false) {
            this.incidentHistoryLoading = true;

            if (this.enableEditMode) {
                this.$root.getSocket().emit("getIncidentHistory", this.slug, cursor, (res) => {
                    this.incidentHistoryLoading = false;
                    if (res.ok) {
                        if (append) {
                            this.incidentHistory = [...this.incidentHistory, ...res.incidents];
                        } else {
                            this.incidentHistory = res.incidents;
                        }
                        this.incidentHistoryNextCursor = res.nextCursor;
                        this.incidentHistoryHasMore = res.hasMore;
                    } else {
                        console.error("Failed to load incident history:", res.msg);
                        this.$root.toastError(res.msg);
                    }
                });
            } else {
                const url = cursor
                    ? `/api/status-page/${this.slug}/incident-history?cursor=${encodeURIComponent(cursor)}`
                    : `/api/status-page/${this.slug}/incident-history`;
                axios
                    .get(url)
                    .then((res) => {
                        this.incidentHistoryLoading = false;
                        if (res.data.ok) {
                            if (append) {
                                this.incidentHistory = [...this.incidentHistory, ...res.data.incidents];
                            } else {
                                this.incidentHistory = res.data.incidents;
                            }
                            this.incidentHistoryNextCursor = res.data.nextCursor;
                            this.incidentHistoryHasMore = res.data.hasMore;
                        }
                    })
                    .catch((error) => {
                        this.incidentHistoryLoading = false;
                        console.error("Failed to load incident history:", error);
                    });
            }
        },

        /**
         * Load more incident history using cursor-based pagination
         * @returns {void}
         */
        loadMoreIncidentHistory() {
            if (this.incidentHistoryHasMore && this.incidentHistoryNextCursor) {
                this.loadIncidentHistoryWithCursor(this.incidentHistoryNextCursor, true);
            }
        },

        /**
         * Format date key for grouping (e.g., "December 8, 2025")
         * @param {string} dateStr - ISO date string
         * @returns {string} Formatted date key
         */
        formatDateKey(dateStr) {
            if (!dateStr) {
                return this.$t("Unknown");
            }
            const date = new Date(dateStr);
            return date.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        },

        /**
         * Resolve an incident
         * @param {object} incident - The incident to resolve
         * @returns {void}
         */
        resolveIncident(incident) {
            this.$root.getSocket().emit("resolveIncident", this.slug, incident.id, (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.loadIncidentHistory();
                }
            });
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.overall-status {
    font-weight: bold;
    font-size: 25px;

    .ok {
        color: $primary;
    }

    .warning {
        color: $warning;
    }

    .danger {
        color: $danger;
    }
}

h1 {
    font-size: 30px;

    img {
        vertical-align: middle;
        height: 60px;
        width: 60px;
    }
}

.main {
    transition: all ease-in-out 0.1s;

    &.edit {
        margin-left: 300px;
    }
}

.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 300px;
    height: 100vh;

    border-right: 1px solid #ededed;

    .danger-zone {
        border-top: 1px solid #ededed;
        padding-top: 15px;
    }

    .sidebar-body {
        padding: 0 10px 10px 10px;
        overflow-x: hidden;
        overflow-y: auto;
        height: calc(100% - 70px);
    }

    .sidebar-footer {
        border-top: 1px solid #ededed;
        border-right: 1px solid #ededed;
        padding: 10px;
        width: 300px;
        height: 70px;
        position: fixed;
        left: 0;
        bottom: 0;
        background-color: white;
        display: flex;
        align-items: center;
    }
}

footer {
    text-align: center;
    font-size: 14px;
}

.description span {
    min-width: 50px;
}

.title-flex {
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo-wrapper {
    display: inline-block;
    position: relative;

    &:hover {
        .icon-upload {
            transform: scale(1.2);
        }
    }

    .icon-upload {
        transition: all $easing-in 0.2s;
        position: absolute;
        bottom: 6px;
        font-size: 20px;
        left: -14px;
        background-color: white;
        padding: 5px;
        border-radius: 10px;
        cursor: pointer;
        box-shadow: 0 15px 70px rgba(0, 0, 0, 0.9);
    }

    /* Reset button placed at top-left of the logo */
    .reset-top-left {
        transition:
            transform $easing-in 0.18s,
            box-shadow $easing-in 0.18s,
            background-color $easing-in 0.18s;
        font-size: 18px;
        width: 18px;
        height: 18px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: white;
        border: none;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        transform-origin: center;

        &:hover {
            background-color: rgba(0, 0, 0, 0.06);
            transform: scale(1.18);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
        }

        &:hover ~ .icon-upload {
            transform: none !important;
        }
    }

    .small-reset-btn {
        transition:
            transform $easing-in 0.18s,
            box-shadow $easing-in 0.18s,
            background-color $easing-in 0.18s;
        font-size: 18px;
        width: 18px;
        height: 18px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;

        &:hover {
            background-color: rgba(0, 0, 0, 0.04);
            transform: scale(1.18);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
        }
    }
}

.logo {
    transition: all $easing-in 0.2s;

    &.edit-mode {
        cursor: pointer;

        &:hover {
            transform: scale(1.2);
        }
    }
}

// Soca: incident card — colored header, light body
.incident-card {
    overflow: hidden; // clip the colored header to the rounded corners
    padding: 0;
    background: #ffffff;
    color: #1a1a18;
    border: 1px solid #e3e3df;
}

.incident-header {
    padding: 0.85rem 1.5rem;

    .alert-heading {
        margin: 0;
        font-size: 1.3rem;
    }

    // Ensure readable title text on each style background
    &.bg-danger,
    &.bg-dark,
    &.bg-primary,
    &.bg-success {
        color: #ffffff;
    }

    &.bg-info,
    &.bg-warning,
    &.bg-light {
        color: #1a1a18;
    }
}

.incident-body {
    padding: 1.25rem 1.5rem 1.5rem;
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
    background: rgba(128, 128, 128, 0.15);
    border: 1px solid rgba(128, 128, 128, 0.25);
}

.dark .incident-card {
    background: $dark-bg;
    color: $dark-font-color;
    border-color: $dark-border-color;
}

.incident {
    .content {
        &[contenteditable="true"] {
            min-height: 60px;
        }
    }

    .date {
        font-size: 12px;
    }

    // Soca: lifecycle timeline — colors inherit the incident text color (with
    // opacity) so they stay readable on any incident style background.
    .incident-timeline {
        border-top: 1px solid rgba(128, 128, 128, 0.35);
        padding-top: 0.5rem;

        .timeline-item {
            padding: 0.4rem 0;
            border-left: 2px solid rgba(128, 128, 128, 0.4);
            padding-left: 0.75rem;
            margin-bottom: 0.25rem;
        }

        .timeline-time {
            color: inherit;
            opacity: 0.75;
        }
    }
}

// Soca: 90-day uptime calendar
.bm-uptime {
    .bm-section-label {
        font-size: 13px;
        color: #9e9d99;
        margin-bottom: 0.75rem;
    }

    .bm-group {
        margin-bottom: 1.5rem;
    }

    .bm-group-name {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #9e9d99;
        margin-bottom: 0.5rem;
    }

    .bm-comp-row {
        margin-bottom: 1.1rem;
    }

    .bm-comp-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.35rem;
    }

    // Soca: live heartbeat pulse row (native Kuma HeartbeatBar) with a "Live" caption
    .bm-live {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.4rem;
        opacity: 0.95;
    }

    .bm-live-bar {
        flex: 1;
        min-width: 0;
    }

    .bm-live-label {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #1d9e75;

        // pulsing dot
        &::before {
            content: "";
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #1d9e75;
            animation: bm-live-pulse 1.6s ease-in-out infinite;
        }
    }

    .bm-comp-name {
        font-weight: 600;
    }

    .bm-pill {
        font-size: 12px;
        font-weight: 600;
    }
    .bm-pill-ok { color: #1d9e75; }
    .bm-pill-down { color: #e24b4a; }
    .bm-pill-warn { color: #ba7517; }
    .bm-pill-maint { color: #185fa5; }
    .bm-pill-none { color: #9e9d99; }

    .bm-bar {
        display: flex;
        gap: 2px;
        height: 34px;
    }

    .bm-seg {
        flex: 1 1 0;
        border-radius: 2px;
        min-width: 0;
        cursor: pointer;
        transition: opacity 0.1s;
    }

    .bm-seg:hover {
        opacity: 0.7;
    }
    // Soca: a day with an admin note gets a small marker
    .bm-seg.bm-has-note {
        box-shadow: inset 0 0 0 2px rgba(24, 95, 165, 0.85);
    }

    .bm-seg.bm-editable {
        cursor: pointer;
    }

    .bm-bar-meta {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #9e9d99;
        margin-top: 0.3rem;
    }

    .bm-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 12px;
        color: #6c6c6c;
        margin-top: 0.5rem;

        span {
            display: inline-flex;
            align-items: center;
        }

        .bm-leg {
            width: 11px;
            height: 11px;
            border-radius: 2px;
            margin-right: 5px;
            display: inline-block;
        }
    }
}

// Soca: bar status palette (shared by segments and legend)
.bm-up { background: #1d9e75; }
.bm-warn { background: #e3b341; }
.bm-partial { background: #e8833a; }
.bm-down { background: #e24b4a; }
.bm-none { background: #e6e6e3; }

// Soca: pulsing dot for the "Live" caption
@keyframes bm-live-pulse {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.35;
        transform: scale(0.7);
    }
}

// Soca: floating tooltip (light)
.bm-tooltip {
    position: fixed;
    z-index: 1080;
    pointer-events: none;
    background: #ffffff;
    color: #1a1a18;
    border: 1px solid #e3e3df;
    font-size: 11px;
    line-height: 1.45;
    padding: 8px 11px;
    border-radius: 7px;
    max-width: 280px;
    white-space: normal;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);

    .bt-date {
        font-weight: 600;
        font-size: 12px;
    }

    .bt-status {
        margin-top: 3px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .bt-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        flex-shrink: 0;
    }

    .bt-resp {
        margin-top: 3px;
        opacity: 0.7;
    }

    .bt-note {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
        font-weight: 500;
    }

    .bt-rel-title {
        margin-top: 8px;
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        opacity: 0.55;
    }

    .bt-rel {
        margin-top: 3px;
        padding-left: 10px;
        position: relative;
    }

    .bt-rel::before {
        content: "•";
        position: absolute;
        left: 0;
        opacity: 0.6;
    }

    .bt-rel .bt-rel-tag {
        opacity: 0.7;
    }
}

// Soca: section head row (label left, "see more" link right)
.bm-uptime-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.75rem;
}

.bm-more-link {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    color: #185fa5;
    text-decoration: none;
}

.bm-more-link:hover {
    text-decoration: underline;
}

// Soca: two-column status layout — main content on the left, maintenance sidebar on the right
.bm-layout.bm-has-side {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
}

.bm-layout-main {
    flex: 1 1 auto;
    min-width: 0; // allow the 90-day uptime bars to shrink instead of overflowing
}

.bm-layout-side {
    flex: 0 0 clamp(360px, 38%, 460px);
    position: sticky;
    top: 1rem;
}

@media (max-width: 991px) {
    .bm-layout.bm-has-side {
        flex-direction: column;
    }

    .bm-layout-side {
        flex-basis: auto;
        width: 100%;
        position: static;
        top: auto;
        order: -1; // surface maintenance above the status content on small screens
    }
}

// Soca: single maintenance box with tabs (Maintenance / Scheduled Maintenance)
.bm-maint-box {
    border-radius: 14px;
    padding: 0;
    overflow: hidden;
}

// Distinct coloured header bar for the maintenance box
.bm-maint-tabs {
    display: flex;
    background: linear-gradient(135deg, #15314f, #1d4b7a);
}

.bm-maint-tab {
    flex: 1 1 0;
    border: none;
    background: none;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    padding: 0.8rem 0.5rem;
    cursor: pointer;
}

// Active tab differs by background only (no underline / no text change)
.bm-maint-tab.active {
    background: rgba(255, 255, 255, 0.16);
}

.bm-maint-tabbody {
    padding: 0;
}

.bm-maint-empty {
    font-size: 13px;
    opacity: 0.6;
    padding: 1.25rem 1.1rem;
}

.bm-maint-box-foot {
    padding: 0.7rem 1.1rem 0.95rem;
    border-top: 1px solid rgba(128, 128, 128, 0.12);
}

.bm-maint-box-foot .bm-more-link {
    font-size: 12px;
}

// Maintenance table inside the tabbed box
.bm-maint-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 12.5px;
}

.bm-maint-table th {
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    opacity: 0.55;
    padding: 0.6rem 0.5rem;
    border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.bm-maint-table th:first-child,
.bm-maint-table td:first-child {
    padding-left: 1.1rem;
}

.bm-maint-table th:last-child,
.bm-maint-table td:last-child {
    padding-right: 1.1rem;
}

.bm-maint-table th:nth-child(1) { width: 28%; }
.bm-maint-table th:nth-child(2) { width: 24%; }
.bm-maint-table th:nth-child(3) { width: 26%; }
.bm-maint-table th:nth-child(4) { width: 22%; }

.bm-maint-table td {
    padding: 0.7rem 0.5rem;
    vertical-align: top;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
    word-break: break-word;
}

.bm-maint-table tr:last-child td {
    border-bottom: none;
}

.bm-mt-title {
    font-weight: 700;
}

// Status label — coloured text only (no background)
.bm-mt-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    white-space: nowrap;
}

.bm-mt-badge .bm-maint-dot {
    display: none;
}

.bm-mt-active {
    color: #185fa5;
}

.bm-mt-scheduled {
    color: #c1820a;
}

.dark .bm-mt-active {
    color: #5a9bd8;
}

.dark .bm-mt-scheduled {
    color: #e0b85a;
}

// Date/time cell
.bm-mt-time {
    line-height: 1.45;
    white-space: nowrap;
}

.bm-mt-tz {
    font-size: 11px;
    opacity: 0.6;
    margin-top: 2px;
}

// Affected systems chips
.bm-mt-chip {
    display: inline-block;
    font-size: 11px;
    background: rgba(24, 95, 165, 0.1);
    color: #185fa5;
    border-radius: 6px;
    padding: 1px 7px;
    margin: 0 4px 4px 0;
}

.bm-mt-none {
    opacity: 0.45;
}

.dark .bm-mt-chip {
    background: rgba(120, 170, 220, 0.16);
    color: #9ec3e8;
}

// Soca: maintenance announcement card (active / upcoming / past)
// Per-state theming is driven by the CSS custom properties below.
.bm-maint {
    --maint-accent: #185fa5;
    --maint-accent-soft: #4f8fd1;
    --maint-bg-1: #f3f8fe;
    --maint-bg-2: #e8f1fc;
    --maint-border: #cfe2f6;
    --maint-title: #14456f;
    --maint-desc: #3a566f;
    --maint-time: #5b748d;

    display: flex;
    align-items: flex-start;
    gap: 0.85rem;
    position: relative;
    overflow: hidden;
    border: 1px solid var(--maint-border);
    border-radius: 14px;
    padding: 1rem 1.15rem;
    background: linear-gradient(135deg, var(--maint-bg-1), var(--maint-bg-2));
    box-shadow: 0 1px 2px rgba(15, 39, 64, 0.04);

    // Accent rail on the left edge
    &::before {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: 4px;
        background: var(--maint-accent);
    }

    .bm-maint-badge {
        flex: 0 0 auto;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--maint-accent);
        color: #fff;
        font-size: 16px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    .bm-maint-body {
        flex: 1 1 auto;
        min-width: 0;
    }

    .bm-maint-head {
        display: flex;
        align-items: center;
        gap: 0.6rem;
    }

    .bm-maint-title {
        flex: 1;
        min-width: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--maint-title);
        line-height: 1.3;
    }

    .bm-maint-tag {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        background: var(--maint-accent);
        color: #fff;
        border-radius: 999px;
        padding: 3px 11px;
        white-space: nowrap;
    }

    .bm-maint-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
        animation: bm-maint-pulse 1.6s infinite;
    }

    .bm-maint-desc {
        margin-top: 0.35rem;
        color: var(--maint-desc);
        font-size: 14px;
        line-height: 1.5;
    }

    .bm-maint-time {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-top: 0.6rem;
        color: var(--maint-time);
        font-size: 13px;
    }

    .bm-maint-time-icon {
        color: var(--maint-accent-soft);
        font-size: 13px;
    }
    // Tighten the embedded MaintenanceTime pills to match the row
    .timeslot {
        margin-top: 0;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid var(--maint-border);
        color: var(--maint-time);
    }
}

@keyframes bm-maint-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6);
    }

    70% {
        box-shadow: 0 0 0 6px rgba(255, 255, 255, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    }
}

/* Soca: upcoming (scheduled) maintenance — amber accent */
.bm-maint-upcoming {
    --maint-accent: #c1820a;
    --maint-accent-soft: #d6a23a;
    --maint-bg-1: #fefaf1;
    --maint-bg-2: #fcf2dd;
    --maint-border: #f1e2bd;
    --maint-title: #7a5500;
    --maint-desc: #6b5a33;
    --maint-time: #87723f;
}

/* Soca: past (completed) maintenance — muted/green-gray accent */
.bm-maint-past {
    --maint-accent: #5a9a6b;
    --maint-accent-soft: #7fb38c;
    --maint-bg-1: #f7faf8;
    --maint-bg-2: #eef4f0;
    --maint-border: #d8e4dc;
    --maint-title: #3f5a48;
    --maint-desc: #5a6b60;
    --maint-time: #6d7e73;
}

.dark .bm-maint {
    --maint-accent: #2f7dc7;
    --maint-accent-soft: #5a9bd8;
    --maint-bg-1: #16212e;
    --maint-bg-2: #1a2836;
    --maint-border: #2c4259;
    --maint-title: #cfe2f6;
    --maint-desc: #a9c2db;
    --maint-time: #8aa6c0;
    box-shadow: none;

    .bm-maint-badge {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    }

    .timeslot {
        background: rgba(255, 255, 255, 0.06);
    }
}

.dark .bm-maint-upcoming {
    --maint-accent: #d4a23a;
    --maint-accent-soft: #e0b85a;
    --maint-bg-1: #221d12;
    --maint-bg-2: #2a2316;
    --maint-border: #463c22;
    --maint-title: #e8c878;
    --maint-desc: #c9b483;
    --maint-time: #b7a36f;
}

.dark .bm-maint-past {
    --maint-accent: #5a9a6b;
    --maint-accent-soft: #79ad88;
    --maint-bg-1: #161d19;
    --maint-bg-2: #1a2420;
    --maint-border: #2c3a31;
    --maint-title: #a7c2b1;
    --maint-desc: #8fa597;
    --maint-time: #7e948a;
}

.maintenance-bg-info {
    color: $maintenance;
}

.maintenance-icon {
    font-size: 35px;
    vertical-align: middle;
}

.dark .shadow-box {
    background-color: #0d1117;
}

.status-maintenance {
    color: $maintenance;
    margin-right: 5px;
}

.mobile {
    h1 {
        font-size: 22px;
    }

    .overall-status {
        font-size: 20px;
    }
}

.dark {
    .sidebar {
        background-color: $dark-header-bg;
        border-right-color: $dark-border-color;

        .danger-zone {
            border-top-color: $dark-border-color;
        }

        .sidebar-footer {
            border-right-color: $dark-border-color;
            border-top-color: $dark-border-color;
            background-color: $dark-header-bg;
        }
    }
}

.domain-name-list {
    li {
        display: flex;
        align-items: center;
        padding: 10px 0 10px 10px;

        .domain-input {
            flex-grow: 1;
            background-color: transparent;
            border: none;
            color: $dark-font-color;
            outline: none;

            &::placeholder {
                color: #1d2634;
            }
        }
    }
}

.bg-maintenance {
    .alert-heading {
        font-weight: bold;
    }
}

.refresh-info {
    opacity: 0.7;
}

.past-incidents-title {
    font-size: 26px;
    font-weight: normal;
}

.past-incidents-section {
    .past-incidents-content {
        padding: 0;
    }
}

.incident-date-group {
    .incident-date-header {
        font-size: 1rem;
        font-weight: normal;
        color: var(--bs-secondary);
        margin-bottom: 0.75rem;
    }

    .incident-list-box {
        padding: 0;
    }
}
</style>

<!-- Soca: square (non-rounded) corners for every box/section on the status page.
     Non-scoped + gated by .bm-status-page so it also reaches child components
     (IncidentHistory, etc.) but never leaks to other pages. -->
<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
.bm-status-page .shadow-box,
.bm-status-page .bm-maint-box,
.bm-status-page .bm-maint,
.bm-status-page .incident,
.bm-status-page .incident-card,
.bm-status-page .incident-header,
.bm-status-page .incident-list-box,
.bm-status-page .incident-item,
.bm-status-page .incident-list-box-body,
.bm-status-page .bm-uptime,
.bm-status-page .bm-tooltip,
.bm-status-page .bm-seg,
.bm-status-page .bm-leg {
    border-radius: 0 !important;
}

/* Flat look: drop the drop-shadow but keep a solid fill + thin border as separator.
   (.shadow-box has no background of its own on the light theme — it only looked
   like a card because of the shadow, so it turned transparent once that was gone.) */
.bm-status-page .shadow-box,
.bm-status-page .bm-maint-box {
    box-shadow: none !important;
    background-color: #ffffff !important;
    border: 1px solid #c5ccd3 !important;
}

.dark .bm-status-page .shadow-box,
.dark .bm-status-page .bm-maint-box {
    background-color: #0d1117 !important;
    border-color: rgba(255, 255, 255, 0.22) !important;
}

/* Sharpen faint grey text for readability.
   Opacity-based labels: raise opacity (theme-safe). */
.bm-status-page .bm-maint-table th {
    opacity: 0.9 !important;
}

.bm-status-page .bm-mt-tz,
.bm-status-page .bm-maint-empty {
    opacity: 0.85 !important;
}

.bm-status-page .bm-mt-none {
    opacity: 0.7 !important;
}

/* Fixed-grey labels: use a darker grey on light theme, lighter on dark theme. */
.bm-status-page .bm-section-label,
.bm-status-page .bm-group-name,
.bm-status-page .bm-bar-meta {
    color: #5f6873 !important;
}

.dark .bm-status-page .bm-section-label,
.dark .bm-status-page .bm-group-name,
.dark .bm-status-page .bm-bar-meta {
    color: #b3b9c0 !important;
}
</style>
