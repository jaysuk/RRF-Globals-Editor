<template>
    <v-container fluid class="pa-3">

        <!-- Variables card -->
        <v-card class="mb-4">
            <v-card-title class="d-flex align-center pb-0">
                <v-icon left>mdi-variable</v-icon>
                Globals Editor
                <v-spacer />
                <v-chip small color="primary" class="mr-2">{{ globalsCount }}</v-chip>
            </v-card-title>

            <v-card-text class="pb-1">
                <v-text-field
                    v-model="search"
                    label="Search variables"
                    prepend-inner-icon="mdi-magnify"
                    dense outlined clearable hide-details
                />
            </v-card-text>

            <v-simple-table dense class="globals-table">
                <template #default>
                    <thead>
                        <tr>
                            <th class="name-col">Name</th>
                            <th class="type-col-h">Type</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredGlobals.length === 0">
                            <td colspan="3" class="text-center pa-6 text--secondary">
                                <div><v-icon large>mdi-variable-box</v-icon></div>
                                <div>No global variables found</div>
                            </td>
                        </tr>
                        <template v-for="item in filteredGlobals">
                            <!-- Main row -->
                            <tr :key="item.varName">
                                <td class="name-col font-weight-medium">{{ item.varName }}</td>
                                <td class="type-col-h">
                                    <v-chip x-small dark :color="typeColor(item.type)">
                                        {{ typeLabel(item) }}
                                    </v-chip>
                                </td>
                                <td>
                                    <!-- Scalar editor -->
                                    <div v-if="item.type !== 'array'" class="d-flex align-center py-1">
                                        <v-select
                                            v-if="item.type === 'boolean'"
                                            :value="editValues[item.varName]"
                                            @input="v => onEditInput(item.varName, v)"
                                            :items="boolItems"
                                            dense outlined hide-details
                                            style="max-width: 130px"
                                            :disabled="uiFrozen"
                                        />
                                        <v-text-field
                                            v-else
                                            :value="editValues[item.varName]"
                                            @input="v => onEditInput(item.varName, v)"
                                            dense outlined hide-details
                                            style="max-width: 280px"
                                            :disabled="uiFrozen"
                                        />
                                        <v-btn
                                            small color="primary" class="ml-2"
                                            :disabled="uiFrozen || !scalarHasChanges(item)"
                                            @click="applyScalar(item)"
                                        >Set</v-btn>
                                    </div>
                                    <!-- Array preview + expand -->
                                    <div v-else class="d-flex align-center">
                                        <span class="text--secondary text-caption mr-2">{{ arrayPreview(item.value) }}</span>
                                        <v-btn icon x-small @click="toggleExpand(item)">
                                            <v-icon small>{{ isItemExpanded(item) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                                        </v-btn>
                                    </div>
                                </td>
                            </tr>
                            <!-- Expanded array row -->
                            <tr v-if="isItemExpanded(item)" :key="`${item.varName}-exp`">
                                <td colspan="3" class="pa-0 expanded-array-cell">
                                    <v-simple-table dense class="array-inner-table">
                                        <tbody>
                                            <template v-for="(elem, idx) in item.value">
                                                <!-- Sub-array element -->
                                                <tr v-if="Array.isArray(elem)" :key="`${idx}-arr`">
                                                    <td class="index-col text--secondary font-weight-medium">[{{ idx }}]</td>
                                                    <td class="sub-type-col">
                                                        <v-chip x-small dark color="deep-purple">array[{{ elem.length }}]</v-chip>
                                                    </td>
                                                    <td>
                                                        <div class="d-flex align-center py-1">
                                                            <v-text-field
                                                                :value="getArrEdit(item.varName, idx)"
                                                                @input="v => onArrEdit(item.varName, idx, v)"
                                                                dense outlined hide-details
                                                                placeholder="{1, 2, 3}"
                                                                style="max-width: 300px"
                                                                :disabled="uiFrozen"
                                                            />
                                                            <v-btn
                                                                small color="primary" class="ml-2"
                                                                :disabled="uiFrozen || !arrElemHasChanges(item, idx)"
                                                                @click="applyArrElem(item, idx)"
                                                            >Set</v-btn>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <!-- Scalar element -->
                                                <tr v-else :key="idx">
                                                    <td class="index-col text--secondary font-weight-medium">[{{ idx }}]</td>
                                                    <td class="sub-type-col">
                                                        <v-chip x-small dark :color="typeColor(getType(elem))">{{ getType(elem) }}</v-chip>
                                                    </td>
                                                    <td>
                                                        <div class="d-flex align-center py-1">
                                                            <v-select
                                                                v-if="typeof elem === 'boolean'"
                                                                :value="getArrEdit(item.varName, idx)"
                                                                @input="v => onArrEdit(item.varName, idx, v)"
                                                                :items="boolItems"
                                                                dense outlined hide-details
                                                                style="max-width: 130px"
                                                                :disabled="uiFrozen"
                                                            />
                                                            <v-text-field
                                                                v-else
                                                                :value="getArrEdit(item.varName, idx)"
                                                                @input="v => onArrEdit(item.varName, idx, v)"
                                                                dense outlined hide-details
                                                                style="max-width: 280px"
                                                                :disabled="uiFrozen"
                                                            />
                                                            <v-btn
                                                                small color="primary" class="ml-2"
                                                                :disabled="uiFrozen || !arrElemHasChanges(item, idx)"
                                                                @click="applyArrElem(item, idx)"
                                                            >Set</v-btn>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </template>
                                            <tr v-if="item.value.length === 0">
                                                <td colspan="3" class="text-center text--secondary pa-2">(empty array)</td>
                                            </tr>
                                        </tbody>
                                    </v-simple-table>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>

        <!-- Create new variable card -->
        <v-card>
            <v-card-title>
                <v-icon left>mdi-plus-circle-outline</v-icon>
                Create New Variable
            </v-card-title>
            <v-card-text>
                <v-row dense align="center">
                    <v-col cols="12" sm="3">
                        <v-text-field
                            v-model="newVar.name"
                            label="Variable name"
                            outlined dense
                            placeholder="myVariable"
                            :error-messages="newVarNameError"
                            hide-details="auto"
                        />
                    </v-col>
                    <v-col cols="12" sm="2">
                        <v-select
                            v-model="newVar.type"
                            :items="newVarTypes"
                            label="Type"
                            outlined dense hide-details
                        />
                    </v-col>
                    <v-col cols="12" sm="5">
                        <v-select
                            v-if="newVar.type === 'boolean'"
                            v-model="newVar.value"
                            :items="boolItems"
                            label="Value"
                            outlined dense hide-details
                        />
                        <v-text-field
                            v-else
                            v-model="newVar.value"
                            label="Value"
                            outlined dense hide-details
                            :placeholder="newVarPlaceholder"
                        />
                    </v-col>
                    <v-col cols="12" sm="2">
                        <v-btn
                            color="primary" block
                            :disabled="uiFrozen || !isNewVarValid"
                            @click="createVariable"
                        >
                            <v-icon left>mdi-plus</v-icon>
                            Create
                        </v-btn>
                    </v-col>
                </v-row>

                <div v-if="isNewVarValid" class="mt-2 text-caption text--secondary">
                    Will send: <code>{{ newVarPreview }}</code>
                </div>
            </v-card-text>
        </v-card>

        <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" top right>
            {{ snackbar.message }}
        </v-snackbar>

    </v-container>
</template>

<script>
import store from '@/store';
import { mapActions } from 'vuex';

export default {
    name: 'GlobalsManager',

    data: () => ({
        globalsVersion: 0,
        editValues: {},
        loadedValues: {},
        arrayEditValues: {},
        arrayLoadedValues: {},
        search: '',
        expandedNames: [],
        boolItems: [
            { text: 'true', value: 'true' },
            { text: 'false', value: 'false' }
        ],
        newVar: { name: '', type: 'number', value: '' },
        newVarTypes: [
            { text: 'Number', value: 'number' },
            { text: 'Boolean', value: 'boolean' },
            { text: 'String', value: 'string' },
            { text: 'Array', value: 'array' }
        ],
        snackbar: { show: false, message: '', color: 'success' }
    }),

    computed: {
        uiFrozen() {
            return store.getters['uiFrozen'];
        },

        globalsCount() {
            // eslint-disable-next-line no-unused-expressions
            this.globalsVersion;
            try {
                const m = store.state.machine.model.global;
                return m ? m.size : 0;
            } catch (e) { return 0; }
        },

        filteredGlobals() {
            // Referencing globalsVersion forces Vue to re-evaluate this computed
            // whenever the store's Map reference is replaced (OmBrowser pattern).
            // eslint-disable-next-line no-unused-expressions
            this.globalsVersion;
            let globalMap;
            try { globalMap = store.state.machine.model.global; } catch (e) { return []; }
            if (!globalMap) return [];
            const arr = [];
            globalMap.forEach((value, varName) => {
                arr.push({ varName, value, type: this.getType(value) });
            });
            arr.sort((a, b) => a.varName.localeCompare(b.varName));
            if (!this.search) return arr;
            const s = this.search.toLowerCase();
            return arr.filter(g => g.varName.toLowerCase().includes(s));
        },

        newVarNameError() {
            if (!this.newVar.name) return [];
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.newVar.name)) {
                return ['Must start with a letter or underscore, only letters/digits/underscores allowed'];
            }
            if (this.filteredGlobals.some(g => g.varName === this.newVar.name)) {
                return [`'${this.newVar.name}' already exists`];
            }
            return [];
        },

        isNewVarValid() {
            if (!this.newVar.name || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this.newVar.name)) return false;
            if (this.filteredGlobals.some(g => g.varName === this.newVar.name)) return false;
            if (this.newVar.type !== 'boolean' && !this.newVar.value) return false;
            return true;
        },

        newVarPlaceholder() {
            switch (this.newVar.type) {
                case 'number': return '42  or  3.14';
                case 'string': return 'hello world';
                case 'array': return '1, 2, 3  or  {1, 2, 3}';
                default: return '';
            }
        },

        newVarPreview() {
            if (!this.isNewVarValid) return '';
            return `global ${this.newVar.name} = ${this.formatNewVarValue()}`;
        }
    },

    created() {
        this._unwatchGlobals = this.$watch(
            () => store.state.machine && store.state.machine.model
                ? store.state.machine.model.global
                : null,
            (newMap) => {
                this.globalsVersion++;
                this.syncEditValues(newMap);
            },
            { immediate: true }
        );
    },

    beforeDestroy() {
        if (this._unwatchGlobals) this._unwatchGlobals();
    },

    watch: {
        'newVar.type'(type) {
            this.newVar.value = type === 'boolean' ? 'true' : '';
        }
    },

    methods: {
        ...mapActions('machine', ['sendCode']),

        // ── store sync ────────────────────────────────────────────────

        syncEditValues(map) {
            if (!map) return;
            map.forEach((value, varName) => {
                const type = this.getType(value);
                const displayStr = this.valueToDisplay(value);
                if (!(varName in this.loadedValues)) {
                    this.$set(this.editValues, varName, displayStr);
                    this.$set(this.loadedValues, varName, displayStr);
                } else if (displayStr !== this.loadedValues[varName]) {
                    const userEdited = this.editValues[varName] !== this.loadedValues[varName];
                    if (!userEdited) this.$set(this.editValues, varName, displayStr);
                    this.$set(this.loadedValues, varName, displayStr);
                }
                if (type === 'array') this.syncArrayEditValues(varName, value);
            });
        },

        // ── type helpers ───────────────────────────────────────────────

        getType(value) {
            if (value === null || value === undefined) return 'null';
            if (Array.isArray(value)) return 'array';
            return typeof value;
        },

        typeLabel(item) {
            return item.type === 'array' ? `array[${item.value.length}]` : item.type;
        },

        typeColor(type) {
            const map = {
                boolean: 'teal',
                number: 'blue darken-1',
                string: 'orange darken-2',
                array: 'deep-purple',
                object: 'brown',
                null: 'grey'
            };
            return map[type] || 'grey';
        },

        // ── display / formatting ───────────────────────────────────────

        valueToDisplay(value) {
            if (value === null || value === undefined) return 'null';
            if (typeof value === 'boolean') return String(value);
            if (Array.isArray(value)) return `{${value.map(v => this.valueToDisplay(v)).join(', ')}}`;
            return String(value);
        },

        arrayPreview(arr) {
            if (!arr || arr.length === 0) return '(empty)';
            const items = arr.slice(0, 5).map(v =>
                Array.isArray(v) ? `[${v.length}]` : String(v)
            );
            return `[${items.join(', ')}${arr.length > 5 ? ', …' : ''}]`;
        },

        formatForRRF(displayStr, originalType) {
            const s = String(displayStr).trim();
            if (originalType === 'boolean') return s;
            if (originalType === 'number') return s;
            if (originalType === 'string') return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
            if (originalType === 'null') return 'null';
            return s;
        },

        formatArrElemForRRF(displayStr, originalElem) {
            const s = String(displayStr).trim();
            if (typeof originalElem === 'boolean') return s;
            if (typeof originalElem === 'string') return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
            if (Array.isArray(originalElem)) {
                if (s.startsWith('{') && s.endsWith('}')) return s;
                return `{${s}}`;
            }
            return s;
        },

        formatNewVarValue() {
            const val = String(this.newVar.value).trim();
            switch (this.newVar.type) {
                case 'boolean': return val;
                case 'number': return val;
                case 'string': return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
                case 'array': {
                    if (val.startsWith('{') && val.endsWith('}')) return val;
                    return `{${val}}`;
                }
                default: return val;
            }
        },

        // ── edit value state ──────────────────────────────────────────

        onEditInput(varName, value) {
            this.$set(this.editValues, varName, value);
        },

        scalarHasChanges(item) {
            return this.editValues[item.varName] !== this.loadedValues[item.varName];
        },

        syncArrayEditValues(varName, arr) {
            for (let i = 0; i < arr.length; i++) {
                const aKey = `${varName}-${i}`;
                const displayStr = Array.isArray(arr[i])
                    ? `{${arr[i].map(v => this.valueToDisplay(v)).join(', ')}}`
                    : this.valueToDisplay(arr[i]);

                if (!(aKey in this.arrayLoadedValues)) {
                    this.$set(this.arrayEditValues, aKey, displayStr);
                    this.$set(this.arrayLoadedValues, aKey, displayStr);
                } else if (displayStr !== this.arrayLoadedValues[aKey]) {
                    const userEdited = this.arrayEditValues[aKey] !== this.arrayLoadedValues[aKey];
                    if (!userEdited) this.$set(this.arrayEditValues, aKey, displayStr);
                    this.$set(this.arrayLoadedValues, aKey, displayStr);
                }
            }
        },

        getArrEdit(varName, idx) {
            return this.arrayEditValues[`${varName}-${idx}`];
        },

        onArrEdit(varName, idx, value) {
            this.$set(this.arrayEditValues, `${varName}-${idx}`, value);
        },

        arrElemHasChanges(item, idx) {
            const aKey = `${item.varName}-${idx}`;
            return this.arrayEditValues[aKey] !== this.arrayLoadedValues[aKey];
        },

        // ── expansion ────────────────────────────────────────────────

        isItemExpanded(item) {
            return this.expandedNames.includes(item.varName);
        },

        toggleExpand(item) {
            const idx = this.expandedNames.indexOf(item.varName);
            if (idx >= 0) {
                this.expandedNames.splice(idx, 1);
            } else {
                this.expandedNames.push(item.varName);
            }
        },

        // ── send commands ─────────────────────────────────────────────

        async applyScalar(item) {
            const displayVal = this.editValues[item.varName];
            if (displayVal === undefined) return;
            const rrf = this.formatForRRF(displayVal, item.type);
            await this.run(`set global.${item.varName} = ${rrf}`, `global.${item.varName}`);
        },

        async applyArrElem(item, idx) {
            const displayVal = this.getArrEdit(item.varName, idx);
            if (displayVal === undefined) return;
            const originalElem = item.value[idx];
            const rrf = this.formatArrElemForRRF(displayVal, originalElem);
            await this.run(`set global.${item.varName}[${idx}] = ${rrf}`, `global.${item.varName}[${idx}]`);
        },

        async createVariable() {
            if (!this.isNewVarValid) return;
            const rrf = this.formatNewVarValue();
            const code = `global ${this.newVar.name} = ${rrf}`;
            const ok = await this.run(code, `global.${this.newVar.name}`, true);
            if (ok) {
                this.newVar.name = '';
                this.newVar.value = this.newVar.type === 'boolean' ? 'true' : '';
            }
        },

        async run(code, label, isCreate = false) {
            try {
                const result = await this.sendCode(code);
                if (result && /^error/i.test(String(result).trim())) {
                    this.notify(`Error: ${result}`, 'error');
                    return false;
                }
                this.notify(`${isCreate ? 'Created' : 'Updated'} ${label}`, 'success');
                return true;
            } catch (e) {
                this.notify(`Failed: ${e.message || e}`, 'error');
                return false;
            }
        },

        notify(message, color = 'success') {
            this.snackbar = { show: true, message, color };
        }
    }
};
</script>

<style scoped>
.globals-table thead th {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: rgba(255,255,255,0.6) !important;
}

.name-col {
    width: 200px;
    white-space: nowrap;
}

.type-col-h {
    width: 120px;
}

.expanded-array-cell {
    background-color: rgba(0, 0, 0, 0.03);
}

.array-inner-table {
    background: transparent !important;
}

.array-inner-table td {
    border-bottom: none !important;
}

.index-col {
    width: 60px;
    padding-left: 24px !important;
}

.sub-type-col {
    width: 110px;
}
</style>
