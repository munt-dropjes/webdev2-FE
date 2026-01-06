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
import { onMounted, onUnmounted, inject, ref, watch, shallowRef } from 'vue';
import Chart from 'chart.js/auto';

const history = inject('history');
const graphTrigger = inject('graphTrigger'); // We listen to this now!
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
      animation: { duration: 0 }, // Disable animation for instant updates
      elements: {
        line: {
          borderWidth: 3,
          showLine: true,
          tension: 0.3
        },
        point: { radius: 0, hitRadius: 20 }
      },
      scales: {
        y: { ticks: { callback: (value) => 'ƒ ' + value.toLocaleString() } }
      },
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
};

onMounted(() => {
  initChart();
});

// WATCH FIX: Instead of watching the heavy history object, we watch the simple counter
watch(graphTrigger, () => {
  if (chartInstance.value) {
    // Manually ensure the chart has the latest data references
    chartInstance.value.data.labels = history.labels;
    chartInstance.value.data.datasets = history.datasets;

    // Smooth update
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
.animate-pulse { animation: pulse 2s infinite; }
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
</style>
