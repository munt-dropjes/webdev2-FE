<template>
    <div class="container">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary">
                <i class="bi bi-list-columns-reverse me-2"></i>
                {{ isAdmin ? 'Transactie Overzicht (Admin)' : 'Mijn Transactie Geschiedenis' }}
            </h2>
            <button @click="loadTransactions" class="btn btn-outline-primary btn-sm">
                <i class="bi bi-arrow-clockwise"></i> Verversen
            </button>
        </div>

        <div v-if="isAdmin" class="card shadow-sm mb-4">
            <div class="card-body py-2">
                <div class="row align-items-center">
                    <div class="col-auto fw-bold">Filter op bedrijf:</div>
                    <div class="col-auto">
                        <select v-model="filterCompanyId" class="form-select form-select-sm">
                            <option :value="null">Alle Bedrijven</option>
                            <option v-for="c in companies" :key="c.id" :value="c.id">{{ c.name }}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="card shadow-sm">
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                    <thead class="table-light">
                    <tr>
                        <th>Tijdstip</th>
                        <th>Bedrijf</th>
                        <th>Omschrijving</th>
                        <th class="text-end">Bedrag</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="tx in filteredTransactions" :key="tx.id">
                        <td class="small text-muted">
                            {{ new Date(tx.created_at).toLocaleString() }}
                        </td>
                        <td>
                 <span class="badge" :style="getCompanyStyle(tx.company_id)">
                    {{ getCompanyName(tx.company_id) }}
                 </span>
                        </td>
                        <td>{{ tx.description }}</td>
                        <td class="text-end fw-bold" :class="tx.amount >= 0 ? 'text-success' : 'text-danger'">
                            {{ tx.amount >= 0 ? '+' : '' }} ƒ {{ tx.amount.toLocaleString() }}
                        </td>
                    </tr>
                    <tr v-if="filteredTransactions.length === 0">
                        <td colspan="4" class="text-center py-4 text-muted">
                            Geen transacties gevonden.
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue';
import { apiCall } from '../services/api';
import { useAuth } from '../composables/useAuth';

const companies = inject('companies');
const { isAdmin, myCompanyId } = useAuth(); // Import role and ID

const transactions = ref([]);
const filterCompanyId = ref(null);

// UI Helpers
const getCompany = (id) => companies.find(c => c.id === id);
const getCompanyName = (id) => getCompany(id)?.name || 'Onbekend';
const getCompanyStyle = (id) => {
    const c = getCompany(id);
    return c ? { backgroundColor: c.color, color: '#fff' } : { backgroundColor: '#6c757d', color: '#fff' };
};

// Data Fetching
const loadTransactions = async () => {
    try {
        const data = await apiCall('/api/transactions');
        if (data) {
            // Sort by newest first
            transactions.value = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    } catch (e) {
        console.error("Failed to load transactions", e);
    }
};

// FILTER LOGIC
const filteredTransactions = computed(() => {
    let list = transactions.value;

    if (isAdmin.value) {
        // 1. Admin Logic: Show All OR Filter by Dropdown
        if (filterCompanyId.value) {
            list = list.filter(t => t.company_id === filterCompanyId.value);
        }
    } else {
        // 2. Company Logic: STRICTLY show only own data
        if (myCompanyId.value) {
            list = list.filter(t => t.company_id === myCompanyId.value);
        } else {
            // Safety: If ID is missing, show nothing to prevent leaks
            list = [];
        }
    }

    return list;
});

onMounted(() => {
    loadTransactions();
});
</script>
