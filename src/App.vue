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
            <li class="nav-item">
              <router-link to="/" class="nav-link" active-class="active">How to Play</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/opdrachten" class="nav-link" active-class="active">Opdrachten</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/aandelen" class="nav-link" active-class="active">Aandelenverdeling</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/grafiek" class="nav-link" active-class="active">Grafiek</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main class="container my-4">
      <div class="row mb-4">
        <div v-for="family in families" :key="family.name" class="col-md-4">
          <div :class="['card', 'text-white', 'shadow-sm', family.bgColor]">
            <div class="card-body d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title mb-0">{{ family.name }}</h6>
                <small>Aandeel waarde: ƒ {{ (family.cash / 100).toLocaleString() }}</small>
              </div>
              <h4 class="mb-0">ƒ {{ family.cash.toLocaleString() }}</h4>
            </div>
          </div>
        </div>
      </div>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { reactive, provide, onMounted, onUnmounted } from 'vue';

const families = reactive([
  { name: 'Haviken', cash: 100000, bgColor: 'haviken', color: '#ff69b4' },
  { name: 'Spechten', cash: 150000, bgColor: 'spechten', color: '#198754' },
  { name: 'Sperwers', cash: 100000, bgColor: 'sperwers', color: '#ffc107' },
  { name: 'Zwaluwen', cash: 200000, bgColor: 'zwaluwen', color: '#0d6efd' },
  { name: 'Valken', cash: 100000, bgColor: 'valken', color: '#fd7e14' },
]);

// history must remain reactive, but we will update it carefully
const history = reactive({
  labels: [],
  datasets: families.map(f => ({
    label: f.name,
    data: [],
    borderColor: f.color,
    backgroundColor: f.color,
    tension: 0.1,      // Lower tension for cleaner lines
    borderWidth: 3,    // Explicit width
    fill: false,       // Do not fill under the line
    pointRadius: 4     // Visible points
  }))
});

const getNetWorth = (family) => {
  let stockValue = 0;
  families.forEach(target => {
    const sharePrice = target.cash / 100;
    const percentageOwned = (family.name === target.name) ? 30 : 10;
    stockValue += (sharePrice * percentageOwned);
  });
  return family.cash + stockValue;
};

const recordSnapshot = () => {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  history.labels.push(timeLabel);
  families.forEach((f, index) => {
    history.datasets[index].data.push(getNetWorth(f));
  });

  if (history.labels.length > 60) {
    history.labels.shift();
    history.datasets.forEach(d => d.data.shift());
  }
};

let timer = null;
onMounted(() => {
  recordSnapshot();
  timer = setInterval(recordSnapshot, 60000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

provide('families', families);
provide('history', history);
</script>

<style>
/* Smooth transition between pages */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.navbar-nav .nav-link.active {
  color: #fff !important;
  font-weight: bold;
  border-bottom: 2px solid #0d6efd;
}

.haviken {
  background-color: #ff69b4 !important;
}
.spechten {
  background-color: #198754 !important;
}
.sperwers {
  background-color: #ffc107 !important;
}
.zwaluwen {
  background-color: #0d6efd !important;
}
.valken {
  background-color: #fd7e14 !important;
}
</style>
