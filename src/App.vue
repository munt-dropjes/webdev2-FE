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
import { reactive, provide, onMounted, onUnmounted, ref, watch } from 'vue';
import { apiCall } from './services/api';

const companies = reactive([]);

const history = reactive({
    labels: [],
    datasets: []
});

const graphTrigger = ref(0);

// Load data from Backend API
const loadCompanies = async () => {
    try {
        const data = await apiCall('/api/companies');

        if (data) {
            companies.splice(0, companies.length, ...data);

            // Initialize graph datasets only once
            if (history.datasets.length === 0) {
                initGraphDatasets();
            }
        }
    } catch (e) {
        console.error("Failed to load companies", e);
    }
};

const initGraphDatasets = () => {
    history.datasets = companies.map(c => ({
        label: c.name,
        data: [],
        borderColor: c.color,
        backgroundColor: c.color,
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
        fill: false,
        spanGaps: true
    }));
};

const recordSnapshot = () => {
    if (companies.length === 0) return;

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

    history.labels.push(timeLabel);

    companies.forEach((c, index) => {
        if (!history.datasets[index]) return;
        // Use net_worth directly from API
        history.datasets[index].data.push(c.net_worth);
    });

    if (history.labels.length > 60) {
        history.labels.shift();
        history.datasets.forEach(d => d.data.shift());
    }

    graphTrigger.value++;
};

watch(companies, () => {
    if (history.labels.length > 0 && history.datasets.length > 0) {
        companies.forEach((c, index) => {
            if (history.datasets[index]) {
                const lastIdx = history.datasets[index].data.length - 1;
                if (lastIdx >= 0) {
                    history.datasets[index].data[lastIdx] = c.net_worth;
                }
            }
        });
        graphTrigger.value++;
    }
}, { deep: true });

let timer = null;

onMounted(async () => {
    await loadCompanies();
    recordSnapshot();
    timer = setInterval(recordSnapshot, 60000);
});

onUnmounted(() => {
    if (timer) clearInterval(timer);
});

// Provide updated keys
provide('companies', companies);
provide('reloadCompanies', loadCompanies);
provide('history', history);
provide('graphTrigger', graphTrigger);
</script>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.navbar-nav .nav-link.active { color: #fff !important; font-weight: bold; border-bottom: 2px solid #0d6efd; }
</style>
