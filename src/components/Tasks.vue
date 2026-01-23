<template>
    <div class="opdrachten-container">
        <div class="row">
            <div class="col-md-4">

                <div class="card shadow-sm mb-3">
                    <div class="card-header bg-dark text-white">
                        <h5 class="mb-0">1. Kies Niveau</h5>
                    </div>
                    <div class="card-body">
                        <select v-model="selectedCategory" class="form-select" :disabled="loading">
                            <option value="" disabled>Selecteer Categorie...</option>
                            <option v-for="cat in categories" :key="cat" :value="cat">
                                {{ cat }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="card shadow-sm mb-3" v-if="selectedCategory">
                    <div class="card-header bg-secondary text-white">
                        <h5 class="mb-0">2. Kies Opdracht</h5>
                    </div>
                    <div class="card-body">
                        <select v-model="selectedTaskId" class="form-select">
                            <option value="" disabled>Selecteer Opdracht...</option>
                            <option v-for="task in filteredTasks" :key="task.id" :value="task.id">
                                {{ task.name }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="card border-info shadow-sm" v-if="currentTask">
                    <div class="card-body">
                        <h6 class="text-info text-uppercase small fw-bold">Beloningen: {{ currentTask.name }}</h6>
                        <ul class="list-unstyled mb-0 small">
                            <li><i class="bi bi-trophy-fill text-warning"></i> 1e: ƒ {{ currentTask.reward_p1.toLocaleString() }}</li>
                            <li><i class="bi bi-award text-secondary"></i> 2e: ƒ {{ currentTask.reward_p2.toLocaleString() }}</li>
                            <li><i class="bi bi-award-fill text-danger"></i> 3e: ƒ {{ currentTask.reward_p3.toLocaleString() }}</li>
                            <li v-if="currentTask.reward_p4"><i class="bi bi-person text-muted"></i> 4e: ƒ {{ currentTask.reward_p4.toLocaleString() }}</li>
                            <li v-if="currentTask.reward_p5"><i class="bi bi-person text-muted"></i> 5e: ƒ {{ currentTask.reward_p5.toLocaleString() }}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="col-md-8">
                <div class="card shadow-sm border-primary h-100">

                    <div class="card-body text-center py-5 d-flex flex-column justify-content-center" v-if="!currentTask">
                        <i class="bi bi-list-check display-1 text-muted mb-3"></i>
                        <h4 class="text-muted">Selecteer een opdracht</h4>
                        <p class="text-muted">Kies links een categorie en opdracht om resultaten in te voeren.</p>
                    </div>

                    <div class="card-body" v-else>
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h3 class="h4 mb-0 text-primary">{{ currentTask.name }}</h3>
                            <span class="badge bg-secondary">{{ currentTask.category }}</span>
                        </div>

                        <h6 class="fw-bold border-bottom pb-2 mb-3">Reeds Voltooid</h6>
                        <div class="table-responsive mb-4">
                            <table class="table table-sm table-striped align-middle">
                                <thead class="table-light">
                                <tr>
                                    <th style="width: 50px">Rank</th>
                                    <th>Bedrijf</th>
                                    <th>Tijdstip</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr v-for="entry in currentTask.finished_by" :key="entry.company_id">
                                    <td>
                                        <span v-if="entry.rank === 1" class="badge bg-warning text-dark">1e</span>
                                        <span v-else-if="entry.rank === 2" class="badge bg-secondary">2e</span>
                                        <span v-else-if="entry.rank === 3" class="badge bg-danger">3e</span>
                                        <span v-else class="badge bg-light text-dark border">{{ entry.rank }}e</span>
                                    </td>
                                    <td class="fw-bold">{{ entry.company_name }}</td>
                                    <td class="small text-muted">{{ new Date(entry.completed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</td>
                                </tr>
                                <tr v-if="!currentTask.finished_by || currentTask.finished_by.length === 0">
                                    <td colspan="3" class="text-center text-muted fst-italic py-3">
                                        Nog niemand heeft deze opdracht voltooid.
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <h6 class="fw-bold border-bottom pb-2 mb-3">Nu Voltooien (Klik op volgorde van binnenkomst)</h6>
                        <div class="row g-2">
                            <div v-for="c in remainingCompanies" :key="c.id" class="col-md-4 col-6">
                                <button
                                    @click="submitCompletion(c.id)"
                                    class="btn btn-outline-dark w-100 py-3 position-relative"
                                    :style="{ borderColor: c.color, borderLeftWidth: '5px' }"
                                    :disabled="processing"
                                >
                                    <span class="fw-bold">{{ c.name }}</span>
                                    <div class="small text-muted mt-1">
                                        Volgende Rank: <strong>{{ nextRank }}e</strong>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div v-if="remainingCompanies.length === 0" class="alert alert-success mt-3 text-center">
                            <i class="bi bi-check-circle-fill me-2"></i> Iedereen heeft deze opdracht voltooid!
                        </div>

                        <div v-if="feedback" :class="['alert mt-3', feedbackType === 'error' ? 'alert-danger' : 'alert-success']">
                            {{ feedback }}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, onMounted, computed } from 'vue';
import { apiCall } from '../services/api';

const companies = inject('companies'); // Provided by App.vue
const reloadCompanies = inject('reloadCompanies'); // To update cash after reward

const tasks = ref([]);
const loading = ref(false);
const processing = ref(false); // For button disabling during API call
const selectedCategory = ref('');
const selectedTaskId = ref('');
const feedback = ref('');
const feedbackType = ref('');

// 1. Fetch all tasks from API
const loadTasks = async () => {
    loading.value = true;
    try {
        const data = await apiCall('/api/tasks');
        if (data) {
            tasks.value = data;
        }
    } catch (e) {
        console.error("Failed to load tasks", e);
    } finally {
        loading.value = false;
    }
};

// 2. Compute Unique Categories
const categories = computed(() => {
    const unique = new Set(tasks.value.map(t => t.category));
    return Array.from(unique).sort(); // Alphabetical sort, or custom logic if needed
});

// 3. Filter Tasks by Category
const filteredTasks = computed(() => {
    if (!selectedCategory.value) return [];
    return tasks.value.filter(t => t.category === selectedCategory.value);
});

// 4. Get Current Task Object
const currentTask = computed(() => {
    if (!selectedTaskId.value) return null;
    return tasks.value.find(t => t.id === selectedTaskId.value);
});

// 5. Calculate who is left
const remainingCompanies = computed(() => {
    if (!currentTask.value) return [];
    const finishedIds = (currentTask.value.finished_by || []).map(f => f.company_id);
    // Return companies that are NOT in the finished list
    return companies.filter(c => !finishedIds.includes(c.id));
});

// 6. Predict Next Rank
const nextRank = computed(() => {
    if (!currentTask.value) return 1;
    return (currentTask.value.finished_by?.length || 0) + 1;
});

// 7. Submit Action
const submitCompletion = async (companyId) => {
    processing.value = true;
    feedback.value = '';

    try {
        // API: POST /api/tasks/complete
        // The backend calculates the rank and reward automatically
        const result = await apiCall('/api/tasks/complete', 'POST', {
            company_id: companyId,
            task_id: selectedTaskId.value
        });

        feedbackType.value = 'success';
        feedback.value = `Succes! ${result.company_name} heeft "${result.task_name}" voltooid en ƒ ${result.reward.toLocaleString()} verdiend.`;

        // Refresh Data:
        // 1. Reload Tasks (to update the 'finished_by' list and ranks)
        await loadTasks();
        // 2. Reload Companies (to update cash balance in the header)
        await reloadCompanies();

    } catch (e) {
        feedbackType.value = 'error';
        feedback.value = e.message || "Er ging iets mis.";
    } finally {
        processing.value = false;
        // Clear success message after 3 seconds
        setTimeout(() => {
            if(feedbackType.value === 'success') feedback.value = '';
        }, 4000);
    }
};

onMounted(() => {
    loadTasks();
});
</script>

<style scoped>
.opdrachten-container {
    min-height: 80vh;
}
</style>
