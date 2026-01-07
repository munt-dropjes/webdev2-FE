<template>
    <div class="container mt-5">
        <div class="card mx-auto shadow-sm" style="max-width: 400px;">
            <div class="card-body">
                <h3 class="card-title text-center mb-4">Login</h3>
                <form @submit.prevent="handleLogin">
                    <div class="mb-3">
                        <label class="form-label">Username</label>
                        <input v-model="username" type="text" class="form-control" required />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Password</label>
                        <input v-model="password" type="password" class="form-control" required />
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Login</button>
                    <p v-if="error" class="text-danger mt-3 text-center small">{{ error }}</p>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiCall } from '../services/api';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const handleLogin = async () => {
    try {
        // Matches your backend route: POST /login
        const response = await apiCall('/login', 'POST', {
            username: username.value,
            password: password.value
        });

        if (response && response.token) {
            localStorage.setItem('authToken', response.token);
            router.push('/'); // Go to main game page
        } else {
            error.value = "Login failed";
        }
    } catch (e) {
        error.value = "Invalid credentials";
    }
};
</script>
