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
                    <th v-for="f in families" :key="f.id" class="text-center">
                        {{ f.name }}<br>
                        <small class="fw-normal">Prijs: ƒ {{ (f.stock_price).toLocaleString() }}</small>
                    </th>
                    <th class="text-center bg-success">Totale Netto Waarde</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="owner in families" :key="owner.id">
                    <td class="fw-bold" :style="{ color: owner.color }">{{ owner.name }}</td>

                    <td v-for="target in families" :key="target.id" class="text-center">
                        <div class="small">
                            <span v-if="owner.id === target.id" class="badge bg-secondary">30 stuks</span>
                            <span v-else class="badge border text-dark">10 stuks</span>
                        </div>
                        <div class="text-muted small">
                            ƒ {{ ((owner.id === target.id ? 30 : 10) * target.stock_price).toLocaleString() }}
                        </div>
                    </td>

                    <td class="text-center fw-bold text-success">
                        ƒ {{ (owner.net_worth).toLocaleString() }}
                    </td>
                </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { inject } from 'vue';
const families = inject('families');
</script>
