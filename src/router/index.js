import {createRouter, createWebHistory} from 'vue-router';
import Rules from '../components/Rules.vue';
import Tasks from '../components/Tasks.vue';
import Stocks from '../components/StockDivider.vue';
import Graph from '../components/Graph.vue';

const routes = [
    {path: '/', component: Rules},
    {path: '/opdrachten', component: Tasks},
    {path: '/aandelen', component: Stocks},
    {path: '/grafiek', component: Graph}
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
