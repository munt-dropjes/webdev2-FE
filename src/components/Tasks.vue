<template>
    <div class="opdrachten-container">
        <div class="row">
            <div class="col-md-4">
                <div class="card shadow-sm mb-4">
                    <div class="card-header bg-dark text-white">
                        <h5 class="mb-0">Opdracht Selectie</h5>
                    </div>
                    <div class="card-body">
                        <label class="form-label fw-bold">1. Kies Niveau</label>
                        <select v-model="selectedLevel" class="form-select mb-3">
                            <option v-for="(data, key) in taskData" :key="key" :value="key">
                                {{ data.label }}
                            </option>
                        </select>

                        <label class="form-label fw-bold">2. Kies Specifieke Taak</label>
                        <select v-model="selectedTaskName" class="form-select">
                            <option v-for="task in taskData[selectedLevel].items" :key="task" :value="task">
                                {{ task }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="card border-info shadow-sm">
                    <div class="card-body">
                        <h6 class="text-info text-uppercase small fw-bold">Beloningen voor
                            {{ taskData[selectedLevel].label }}</h6>
                        <ul class="list-unstyled mb-0">
                            <li><i class="bi bi-trophy-fill text-warning"></i> 1e: +ƒ
                                {{ taskData[selectedLevel].p1.toLocaleString() }}
                            </li>
                            <li><i class="bi bi-award text-muted"></i> 2e: +ƒ
                                {{ taskData[selectedLevel].p2.toLocaleString() }}
                            </li>
                            <li><i class="bi bi-x-circle text-danger"></i> 3e/Fout: ƒ
                                {{ taskData[selectedLevel].p3.toLocaleString() }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="col-md-8">
                <div class="card shadow-sm border-primary">
                    <div class="card-body text-center py-5" v-if="!selectedTaskName">
                        <p class="text-muted">Selecteer een opdracht aan de linkerkant om scores in te voeren.</p>
                    </div>

                    <div class="card-body" v-else>
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h2 class="h4 mb-0 text-primary">{{ selectedTaskName }}</h2>
                            <span class="badge bg-secondary">{{ taskData[selectedLevel].label }}</span>
                        </div>

                        <div class="table-responsive">
                            <table class="table table-bordered align-middle">
                                <thead class="table-light text-center">
                                <tr>
                                    <th style="width: 20%">Positie</th>
                                    <th>Toewijzen aan Familie</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr v-for="pos in [1, 2, 3]" :key="pos">
                                    <td class="text-center fw-bold">
                                        <span v-if="pos === 1" class="text-warning">1e Plaats</span>
                                        <span v-if="pos === 2" class="text-secondary">2e Plaats</span>
                                        <span v-if="pos === 3" class="text-danger">3e / Fout</span>
                                    </td>
                                    <td>
                                        <div class="row g-2">
                                            <div v-for="f in families" :key="f.id" class="col-4">
                                                <button
                                                    @click="applyScore(f.id, pos, f.name)"
                                                    class="btn btn-outline-dark w-100 btn-sm"
                                                    :style="{ borderColor: f.color, color: 'black' }"
                                                >
                                                    {{ f.name }}
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="alert alert-light border small mt-3">
                            <strong>Log:</strong> {{ lastAction }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'; // Import inject
import { apiCall } from '../services/api';

const families = inject('families');
const reloadFamilies = inject('reloadFamilies');
const lastAction = ref('Nog geen scores ingevoerd.');

const selectedLevel = ref('klasse3');
const selectedTaskName = ref('');

const taskData = {
    klasse3: {
        label: '3e Klasse', p1: 25000, p2: 12500, p3: -12500,
        items: ['Kruissjorring', '8-vormige sjorring', 'Blokkenstel inscheren', 'Paalsteek + Schootsteek', 'Bundelsteek', 'Hang de vlaggen in de mast', 'EHBO']
    },
    klasse2: {
        label: '2e Klasse', p1: 50000, p2: 25000, p3: -25000,
        items: ['Dubbele werpanker', 'Diagonaalssjorring', 'Vorkssjorring', 'Steigerssjorring', 'Teruggestoken 8-knoop', 'Tonsjorring', 'Coordinaten kruispeiling', 'EHBO']
    },
    klasse1: {
        label: '1e Klasse', p1: 100000, p2: 50000, p3: -50000,
        items: ['Oogsplits', 'Eindsplits', 'Tussensplits', 'Turkse knoop', '3 op 1 bouwen', 'EHBO']
    },
    algemeen: {
        label: 'Algemeen/Overige', p1: 50000, p2: 25000, p3: -25000,
        items: ['Kaartenhuis 6 verdiepingen', 'Kruiwagen hout halen', 'Koffie aan de staf', '30 Push-ups', '5 Pull-ups', 'Gat graven (Welp-formaat)', 'Roeien over de oprit', 'Plunjezak slepen', 'Verkenner tillen', 'Blauwe boekje uitleggen', 'Handtekening Welpenleiding', 'Klasse eis/insigne behalen', 'Kidnap PL', 'Vissersknoop', 'Lassoknoop', 'Bindersknoop', 'Katteklauw', 'Beksteek', 'Eindsplits achter de rug', 'Oogsplits achter de rug', 'Schildknoop', 'Chirurgenknoop', 'Franse paalsteek', 'Hijs zeilen in toren', 'Dubbele hielingsteek', 'Treksteek', 'Regel zomerkamp trofee 1993', 'Regel zomerkamp trofee 1997', 'Regel orkonde winst LSW', 'Regel Rowanvlag', 'Regel rode veters', 'Regel groepsdas', 'Foto pat vlag bij bunker', 'Maak ontstekingsmechanisme', 'Regel plintentrappetje', 'Maak luchtballon', 'Ideale patrouille indeling', 'Brug zonder touw', 'Plattegrond terrein']
    },
    vragen: {
        label: 'Vragen', p1: 5000, p2: 2500, p3: -2500,
        items: ['Naam Groep 3 (1911)', 'Hopman Grijze Driehoek', 'Oprichting Camerons', 'Locatie 1933-1971', 'Jamboree 1937', 'Naamgeving Camerons', 'Daskleur vroeger', 'Oudste patrouille naam', 'Naam Kaderpatrouille', 'Betekenis D.N.C.', 'Oude patrouille namen', 'Naam Stam 1945', 'Naam Stam 1950', 'Zomerkamp 1954', 'Bouw Spechtenoog', 'Andere naam Spechtenoog', 'Krentenbrood traditie', 'Pavaqua 1957', 'Eerste paraboloide NL', 'De Olifant (1960)', 'Namen clubbladen', 'Sperwers winst LSW', 'Sperwers afkomst', 'Zomerkamp 1964', 'Eerste gezamenlijk kamp', 'Datum fusie', 'Opening ACII', 'Namen 2 hordes', 'Overgebleven horde', 'Eerste Schotland kamp', 'Reden Schotland jaar', 'Oprichting Rowans', 'Betekenis T.N.O.', 'Cathy Kniphorst Akela', 'Hordehol Wantolla', 'Zomerkamp Rowans 90/00', 'Brand TNO datum', 'Zomerkamp welpen 1993', 'Hayo de Jonge rol', 'Gouden 5 / Gouden 10', 'Groepsvlag letter E', 'Rowans Wiltz 1999', 'Bonnet traditie 1997', 'West Highland Way 2001', 'Zomerkamp 2005', 'Ierland 2012', 'Zomerkamp 2013', 'PL Schotland 2014', 'Winnaars Schotland 10', 'Thema 2015', 'Kamp op palen jaar', 'Winnaar paalkamp', 'Leeftijd staf totaal', 'Koorden behaald', 'Lijst Hopmannen', 'Lijst Akela\'s', 'Echte naam Akela']
    }
};

const applyScore = async (familyId, position, familyName) => {
    if(!selectedTaskName.value) {
        alert("Selecteer eerst een taak!");
        return;
    }

    const rewards = taskData[selectedLevel.value];
    let amount = 0;

    if (position === 1) amount = rewards.p1;
    else if (position === 2) amount = rewards.p2;
    else amount = rewards.p3;

    try {
        // 1. Send transaction to Backend
        // Swagger: POST /api/transactions
        await apiCall('/api/transactions', 'POST', {
            company_id: familyId,
            amount: amount,
            description: `${selectedTaskName.value} - Rank ${position}`
        });

        // 2. Refresh data to get new Cash and Net Worth
        await reloadFamilies();

        lastAction.value = `${familyName} kreeg ƒ ${amount.toLocaleString()} voor ${selectedTaskName.value}`;
    } catch (e) {
        console.error(e);
        lastAction.value = "Fout bij opslaan: " + e.message;
    }
};
</script>
