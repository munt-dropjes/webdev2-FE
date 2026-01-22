<template>
    <div id="app">
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-primary">
            <div class="container">
        <span class="navbar-brand fw-bold text-uppercase">
          <i class="bi bi-graph-up-arrow me-2"></i>Aandelen Spel
        </span>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item"><router-link to="/" class="nav-link" active-class="active">Regels</router-link></li>
                        <li class="nav-item"><router-link to="/opdrachten" class="nav-link" active-class="active">Opdrachten</router-link></li>
                        <li class="nav-item"><router-link to="/aandelen" class="nav-link" active-class="active">Aandelenverdeling</router-link></li>
                        <li class="nav-item"><router-link to="/grafiek" class="nav-link" active-class="active">Grafiek</router-link></li>
                    </ul>
                </div>
            </div>
        </nav>

        <main class="container my-4">
            <div class="row mb-4">
                <div v-for="company in companies" :key="company.id" class="col-md-4 col-lg">
                    <div class="card text-white shadow-sm mb-2"
                         :style="{ backgroundColor: company.color, borderColor: company.color }">
                        <div class="card-body d-flex justify-content-between align-items-center p-3">
                            <div>
                                <h6 class="card-title mb-0 fw-bold">{{ company.name }}</h6>
                                <small class="opacity-75">Aandeel: ƒ {{ (company.stock_price || 0).toLocaleString() }}</small>
                            </div>
                            <h5 class="mb-0">ƒ {{ (company.cash || 0).toLocaleString() }}</h5>
                        </div>
                    </div>
                </div>
            </div>

            <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                    <component :is="Component"/>
                </transition>
            </router-view>
        </main>
    </div>
</template>

<script setup>
import { reactive, provide, onMounted, onUnmounted, ref } from 'vue';
import { apiCall } from './services/api';

const companies = reactive([]);

// The Single Source of Truth for the Graph
const history = reactive({
    labels: [],
    datasets: []
});

const graphTrigger = ref(0);
const lastRecordedTime = ref(null);

// Helper: Ensure the graph lines (datasets) exist
const ensureGraphStructure = () => {
    if (history.datasets.length === 0 && companies.length > 0) {
        console.log("Initializing Graph Structure with companies:", companies.length);
        history.datasets = companies.map(c => ({
            id: c.id,
            label: c.name,
            data: [], // Starts empty, will be filled by loadHistory
            borderColor: c.color,
            backgroundColor: c.color,
            tension: 0.3,
            borderWidth: 3,
            pointRadius: 3,
            pointHoverRadius: 6,
            fill: false,
            spanGaps: true
        }));
        // Explicitly notify graph to re-render structure
        graphTrigger.value++;
    }
};

const loadCompanies = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const data = await apiCall('/api/companies');
        if (data) {
            companies.splice(0, companies.length, ...data);
            // Immediately try to setup graph structure when companies arrive
            ensureGraphStructure();
        }
    } catch (e) {
        console.error("Failed to load companies", e);
    }
};

const loadHistory = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    // Safety: Companies must be loaded first
    if (companies.length === 0) {
        return;
    }

    ensureGraphStructure();

    let sinceParam = '';

    if (lastRecordedTime.value) {
        // APPEND MODE: Use the last known time from the DB (already UTC string)
        // Add 1 second to avoid duplicates
        // We parse it, add 1000ms, and convert back to UTC string
        const lastDate = new Date(lastRecordedTime.value.replace(' ', 'T') + 'Z');
        const nextTick = new Date(lastDate.getTime() + 1000);
        sinceParam = nextTick.toISOString().slice(0, 19).replace('T', ' ');
    } else {
        // INIT MODE: Last 65 minutes
        const d = new Date(Date.now() - 65 * 60000);
        // FIX: Use toISOString() to get clean UTC ("2026-01-22 08:38:53")
        sinceParam = d.toISOString().slice(0, 19).replace('T', ' ');
    }

    console.log("Requesting History Since (UTC):", sinceParam);

    try {
        const rawData = await apiCall(`/api/history/${encodeURIComponent(sinceParam)}`);

        if (rawData && Array.isArray(rawData) && rawData.length > 0) {
            const groupedByTime = {};
            let maxTimeStr = lastRecordedTime.value;

            rawData.forEach(record => {
                if (!maxTimeStr || record.recorded_at > maxTimeStr) {
                    maxTimeStr = record.recorded_at;
                }

                const timeLabel = record.recorded_at.substring(11, 16);

                if (!groupedByTime[timeLabel]) {
                    groupedByTime[timeLabel] = {};
                }
                groupedByTime[timeLabel][record.company_id] = record.net_worth;
            });

            lastRecordedTime.value = maxTimeStr;

            const newLabels = Object.keys(groupedByTime).sort();

            newLabels.forEach(time => {
                // Prevent duplicates
                if (history.labels.length === 0 || history.labels[history.labels.length - 1] !== time) {
                    history.labels.push(time);

                    history.datasets.forEach(ds => {
                        const val = groupedByTime[time][ds.id] ?? null;
                        ds.data.push(val);
                    });
                }
            });

            graphTrigger.value++;
        }
    } catch (e) {
        console.error("Failed to load graph history", e);
    }
};

const performHeartbeat = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        // 1. Snapshot
        await apiCall('/api/history/save', 'POST');
        // 2. Refresh Cash
        await loadCompanies();
        // 3. Append History
        await loadHistory();
    } catch (e) {
        console.error("Heartbeat failed", e);
    }
};

let timer = null;

onMounted(async () => {
    // STRICT ORDERING:
    // 1. Load Companies (So we have IDs and Colors)
    await loadCompanies();

    // 2. Load History (Now that we have companies, we can map the data)
    await loadHistory();

    // 3. Start Timer
    timer = setInterval(performHeartbeat, 60000);
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});

provide('companies', companies);
provide('reloadCompanies', loadCompanies);
provide('history', history);
provide('graphTrigger', graphTrigger);
</script>
