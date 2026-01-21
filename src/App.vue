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
                <div v-for="family in families" :key="family.id" class="col-md-4 col-lg">
                    <div class="card text-white shadow-sm mb-2"
                         :style="{ backgroundColor: family.color, borderColor: family.color }">
                        <div class="card-body d-flex justify-content-between align-items-center p-3">
                            <div>
                                <h6 class="card-title mb-0 fw-bold">{{ family.name }}</h6>
                                <small class="opacity-75">Aandeel: ƒ {{ (family.stock_price || 0).toLocaleString() }}</small>
                            </div>
                            <h5 class="mb-0">ƒ {{ (family.cash || 0).toLocaleString() }}</h5>
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
import { reactive, provide, onMounted, onUnmounted, ref, watch } from 'vue';
import { apiCall } from './services/api';

const families = reactive([]); // Will hold Company objects from API

// Graph Data Structure
const history = reactive({
    labels: [],
    datasets: []
});

const graphTrigger = ref(0);

// 1. Fetch Companies from API
const loadFamilies = async () => {
    try {
        // Swagger endpoint is /api/companies, not /api/families
        const data = await apiCall('/api/companies');

        if (data) {
            // Clear and update the array
            families.splice(0, families.length, ...data);

            // If this is the first load, initialize the graph datasets
            if (history.datasets.length === 0) {
                initGraphDatasets();
            }
        }
    } catch (e) {
        console.error("Failed to load companies", e);
    }
};

// 2. Initialize Graph Lines based on loaded families
const initGraphDatasets = () => {
    history.datasets = families.map(f => ({
        label: f.name,
        data: [], // Starts empty
        borderColor: f.color, // Use color directly from DB
        backgroundColor: f.color,
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
        fill: false,
        spanGaps: true
    }));
};

// 3. Record Snapshot (Every Minute)
const recordSnapshot = () => {
    if (families.length === 0) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

    history.labels.push(timeLabel);

    // Push the calculated NET WORTH from the API object
    families.forEach((f, index) => {
        // Ensure dataset exists
        if (!history.datasets[index]) return;

        // Swagger: 'net_worth' is the total value
        history.datasets[index].data.push(f.net_worth);
    });

    // Keep graph clean (last 60 points)
    if (history.labels.length > 60) {
        history.labels.shift();
        history.datasets.forEach(d => d.data.shift());
    }

    graphTrigger.value++;
};

// 4. Watch for updates (Live changes)
watch(families, () => {
    // If we have history points, update the *latest* point with new API data
    if (history.labels.length > 0 && history.datasets.length > 0) {
        families.forEach((f, index) => {
            if (history.datasets[index]) {
                const lastIdx = history.datasets[index].data.length - 1;
                if (lastIdx >= 0) {
                    history.datasets[index].data[lastIdx] = f.net_worth;
                }
            }
        });
        graphTrigger.value++;
    }
}, { deep: true });

let timer = null;

onMounted(async () => {
    await loadFamilies();
    recordSnapshot(); // Record first point immediately after load
    timer = setInterval(recordSnapshot, 60000); // Record every minute
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});

provide('families', families);
provide('reloadFamilies', loadFamilies);
provide('history', history);
provide('graphTrigger', graphTrigger);
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.navbar-nav .nav-link.active { color: #fff !important; font-weight: bold; border-bottom: 2px solid #0d6efd; }
</style>
