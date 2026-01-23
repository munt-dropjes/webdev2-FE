<template>
    <div>
        <div v-if="isOpen" class="modal-backdrop show"></div>
        <div v-if="isOpen" class="modal d-block" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title">Aandelen Kopen</h5>
                        <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
                    </div>
                    <div class="modal-body">
                        <form @submit.prevent="executeTrade">
                            <div class="mb-3">
                                <label class="form-label">Koper (Wie betaalt?)</label>
                                <select v-model="form.buyer_id" class="form-select" required>
                                    <option disabled value="">Selecteer Koper...</option>
                                    <option v-for="c in companies" :key="c.id" :value="c.id">
                                        {{ c.name }} (Kas: ƒ {{ c.cash.toLocaleString() }})
                                    </option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Welk Aandeel?</label>
                                <select v-model="form.stock_company_id" class="form-select" required>
                                    <option disabled value="">Selecteer Aandeel...</option>
                                    <option v-for="c in companies" :key="c.id" :value="c.id">
                                        {{ c.name }} (Huidige koers: ƒ {{ c.stock_price.toLocaleString() }})
                                    </option>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Aantal aandelen</label>
                                <input type="number" v-model="form.amount" class="form-control" min="1" required>
                                <div class="form-text" v-if="estimatedCost > 0">
                                    Totaal kosten: <strong>ƒ {{ estimatedCost.toLocaleString() }}</strong>
                                </div>
                            </div>

                            <div v-if="error" class="alert alert-danger">{{ error }}</div>
                            <div v-if="success" class="alert alert-success">{{ success }}</div>

                            <button type="submit" class="btn btn-success w-100" :disabled="loading">
                                <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                                {{ loading ? 'Bezig...' : 'Koop Aandelen' }}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, computed, inject } from 'vue';
import { apiCall } from '../services/api';

const props = defineProps(['isOpen']);
const emit = defineEmits(['close']);
const companies = inject('companies');
const reloadCompanies = inject('reloadCompanies');

const loading = ref(false);
const error = ref('');
const success = ref('');

const form = reactive({
    buyer_id: '',
    stock_company_id: '',
    amount: 1
});

const estimatedCost = computed(() => {
    if (!form.stock_company_id || !form.amount) return 0;
    const target = companies.find(c => c.id === form.stock_company_id);
    return target ? target.stock_price * form.amount : 0;
});

const executeTrade = async () => {
    loading.value = true;
    error.value = '';

    try {
        await apiCall('/api/stocks/trade', 'POST', {
            buyer_id: form.buyer_id,
            stock_company_id: form.stock_company_id,
            amount: form.amount,
            seller_id: null
        });

        success.value = 'Transactie geslaagd!';
        if (reloadCompanies) await reloadCompanies();

        setTimeout(() => {
            success.value = '';
            emit('close');
        }, 1500);

    } catch (e) {
        error.value = e.message || 'Transactie mislukt';
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.modal-backdrop { opacity: 0.5; background: black; }
</style>
