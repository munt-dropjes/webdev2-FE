<template>
    <div class="card shadow-sm border-0">
        <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="bi bi-graph-up me-2"></i>Live Koersverloop</h5>
            <span class="badge rounded-pill bg-danger animate-pulse">LIVE</span>
        </div>
        <div class="card-body">
            <div style="position: relative; height: 450px; width: 100%;">
                <canvas ref="chartCanvas"></canvas>
            </div>
        </div>
    </div>
</template>

<script setup>
import {onMounted, onUnmounted, inject, ref, watch, shallowRef, toRaw} from 'vue';
import Chart from 'chart.js/auto';

const history = inject('history');
const graphTrigger = inject('graphTrigger');
const chartCanvas = ref(null);
const chartInstance = shallowRef(null);

const initChart = () => {
    if (!chartCanvas.value) return;
    const ctx = chartCanvas.value.getContext('2d');

    chartInstance.value = new Chart(ctx, {
        type: 'line',
        data: {
            labels: history.labels,
            datasets: history.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            elements: {
                line: {
                    borderWidth: 3,
                    showLine: true,
                    tension: 0.3
                },
                point: {
                    radius: 3,
                    hitRadius: 10
                }
            },
            scales: {
                y: {
                    ticks: {callback: (value) => 'ƒ ' + value.toLocaleString()}
                }
            },
            plugins: {
                legend: {position: 'bottom'}
            }
        }
    });
};

onMounted(() => {
    initChart();
});

watch(graphTrigger, () => {
    if (chartInstance.value) {
        chartInstance.value.data.labels = [...history.labels];

        chartInstance.value.data.datasets.forEach((dataset, index) => {
            dataset.data = [...history.datasets[index].data];
        });

        requestAnimationFrame(() => {
            chartInstance.value.update('none');
        });
    }
});

onUnmounted(() => {
    if (chartInstance.value) {
        chartInstance.value.destroy();
        chartInstance.value = null;
    }
});
</script>

<style scoped>
.animate-pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }
    50% {
        opacity: 0.4;
    }
    100% {
        opacity: 1;
    }
}
</style>
