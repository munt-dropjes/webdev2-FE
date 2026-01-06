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
import { onMounted, onUnmounted, inject, ref, watch } from 'vue';
import Chart from 'chart.js/auto';

const history = inject('history');
const chartCanvas = ref(null);
let chartInstance = null;

const initChart = () => {
  if (!chartCanvas.value) return;
  const ctx = chartCanvas.value.getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.labels,
      datasets: history.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 }, // Short animation to prevent lag
      elements: {
        line: {
          borderWidth: 3,
          showLine: true // FORCE lines to show
        }
      },
      scales: {
        y: {
          ticks: { callback: (value) => 'ƒ' + value.toLocaleString() }
        }
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

// Watch history for changes
watch(history, () => {
  if (chartInstance) {
    // We update the chart data references specifically
    chartInstance.data.labels = history.labels;
    chartInstance.data.datasets = history.datasets;
    chartInstance.update('none'); // 'none' means update without reset animation (saves CPU)
  }
}, { deep: true });

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy(); // Clean up memory when leaving the page
  }
});
</script>

<style scoped>
.animate-pulse {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
</style>
