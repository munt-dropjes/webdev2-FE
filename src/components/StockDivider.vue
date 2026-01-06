<template>
  <div class="card shadow-sm">
    <div class="card-header bg-primary text-white">
      <h5 class="mb-0">Aandelenverdeling & Marktwaarde</h5>
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-dark">
        <tr>
          <th>Eigenaar</th>
          <th v-for="f in families" :key="f.name" class="text-center">{{ f.name }} (1%)</th>
          <th class="text-center bg-success">Totale Waarde</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="owner in families" :key="owner.name">
          <td class="fw-bold">{{ owner.name }}</td>
          <td v-for="target in families" :key="target.name" class="text-center">
            <span v-if="owner.name === target.name" class="badge bg-info text-dark">30% Eigen</span>
            <span v-else class="badge bg-light text-dark border">10% Deel</span>
            <div class="small text-muted">ƒ {{ calculateValue(owner.name, target).toLocaleString() }}</div>
          </td>
          <td class="text-center fw-bold text-success">ƒ {{ calculateNetWorth(owner).toLocaleString() }}</td>
        </tr>
        <tr class="table-warning">
          <td><strong>De Bank</strong></td>
          <td v-for="f in families" :key="f.name" class="text-center">
            <span class="badge bg-dark">50%</span>
            <div class="small text-muted">ƒ {{ ((f.cash / 100) * 50).toLocaleString() }}</div>
          </td>
          <td class="text-center">—</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
const families = inject('families');

const calculateValue = (ownerName, target) => {
  const pricePerShare = target.cash / 100;
  const percentage = (ownerName === target.name) ? 30 : 10;
  return pricePerShare * percentage;
};

const calculateNetWorth = (owner) => {
  return families.reduce((total, target) => total + calculateValue(owner.name, target), owner.cash);
};
</script>
