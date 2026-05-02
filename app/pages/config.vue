<template>
  <div class="config-page">
    <div class="config-container">
      <header class="config-header">
        <div class="sigil">⚔</div>
        <h1>DDO Stream Overlay</h1>
        <p class="config-subtitle">Configure your character display</p>
      </header>

      <!-- Character / server form — always visible -->
      <!-- Two column grid -->
      <div class="config-grid">
        <!-- Character / server form -->
        <form class="config-form" @submit.prevent="handleSave">
          <div class="form-group">
            <label for="server">Server</label>
            <div class="select-wrap">
              <select id="server" v-model="form.server">
                <option v-for="s in DDO_SERVERS" :key="s" :value="s">{{ s }}</option>
              </select>
              <span class="select-arrow">▾</span>
            </div>
          </div>

          <div class="form-group">
            <label for="charname">Character Name</label>
            <input
              id="charname"
              v-model="form.characterName"
              type="text"
              placeholder="e.g. Zulkirjax"
              autocomplete="off"
              spellcheck="false" />
          </div>

          <button type="submit" class="btn-save" :disabled="!form.characterName.trim()">
            <span class="btn-icon">✦</span>
            Save & Preview
          </button>
        </form>

        <!-- Stats form -->
        <form class="config-form" @submit.prevent="handleStatsSave">
          <div class="form-section-title">Character Stats</div>

          <div class="form-row">
            <div class="form-group">
              <label for="hp">HP</label>
              <input id="hp" v-model.number="statsForm.hp" type="number" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label for="sp">SP</label>
              <input id="sp" v-model.number="statsForm.sp" type="number" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label for="ac">AC</label>
              <input id="ac" v-model.number="statsForm.ac" type="number" min="0" placeholder="0" />
            </div>
            <div class="form-group">
              <label for="rp">RP</label>
              <input id="rp" v-model.number="statsForm.rp" type="number" min="0" placeholder="0" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="str">STR</label>
              <input id="str" v-model.number="statsForm.str" type="number" min="0"
                placeholder="0" />
            </div>
            <div class="form-group">
              <label for="dex">DEX</label>
              <input id="dex" v-model.number="statsForm.dex" type="number" min="0"
                placeholder="0" />
            </div>
            <div class="form-group">
              <label for="con">CON</label>
              <input id="con" v-model.number="statsForm.con" type="number" min="0"
                placeholder="0" />
            </div>
            <div class="form-group">
              <label for="int">INT</label>
              <input id="int" v-model.number="statsForm.int" type="number" min="0"
                placeholder="0" />
            </div>
            <div class="form-group">
              <label for="wis">WIS</label>
              <input id="wis" v-model.number="statsForm.wis" type="number" min="0"
                placeholder="0" />
            </div>
            <div class="form-group">
              <label for="cha">CHA</label>
              <input id="cha" v-model.number="statsForm.cha" type="number" min="0"
                placeholder="0" />
            </div>
          </div>

          <button type="submit" class="btn-save">
            <span class="btn-icon">✦</span>
            Save Stats
          </button>
        </form>
      </div>

      <!-- Preview — full width below the grid -->
      <div v-if="saved" class="preview-section">
        <div class="preview-header">
          <span class="preview-label">Live Preview</span>
          <button class="btn-refresh" @click="testFetch" :disabled="loading">
            {{ loading ? 'Fetching…' : '↺ Refresh' }}
          </button>
        </div>

        <div class="preview-inner">
          <div>
            <div v-if="loading" class="preview-loading">
              <span class="loading-rune">᛭</span>
              Consulting the ethereal records…
            </div>

            <div v-else-if="error" class="preview-error">
              <span>⚠</span> {{ error }}
            </div>

            <div v-else-if="character" class="preview-card">
              <div class="preview-name">
                {{ character.name }}
                <span v-if="character.race || character.gender" class="preview-identity">
                  <span v-if="character.race">{{ character.race }}</span>
                  <span v-if="character.race && character.gender"> ◆ </span>
                  <span v-if="character.gender">{{ character.gender }}</span>
                </span>
              </div>
              <div class="preview-divider" />
              <div class="preview-meta">
                <span v-if="character.total_level" class="preview-level">
                  Lvl {{ character.total_level }}
                </span>
                <span v-if="character.classes?.length" class="preview-classes">
                  {{ formatClasses(character.classes) }}
                </span>
              </div>
              <div v-if="character.guild_name" class="preview-guild-row">
                <span class="preview-guild">{{ character.guild_name }}</span>
              </div>
              <div class="preview-divider" />
              <div class="preview-stats-row">
                <span v-if="stats.hp !== null" class="preview-stat"><span
                    class="preview-stat-label">HP</span> {{ stats.hp }}</span>
                <span v-if="stats.sp !== null" class="preview-stat"><span
                    class="preview-stat-label">SP</span> {{ stats.sp }}</span>
                <span v-if="stats.ac !== null" class="preview-stat"><span
                    class="preview-stat-label">AC</span> {{ stats.ac }}</span>
                <span v-if="stats.rp !== null" class="preview-stat"><span
                    class="preview-stat-label">RP</span> {{ stats.rp }}</span>
              </div>
              <div class="preview-stats-row">
                <span v-if="stats.str !== null" class="preview-stat"><span
                    class="preview-stat-label">STR</span> {{ stats.str }}</span>
                <span v-if="stats.dex !== null" class="preview-stat"><span
                    class="preview-stat-label">DEX</span> {{ stats.dex }}</span>
                <span v-if="stats.con !== null" class="preview-stat"><span
                    class="preview-stat-label">CON</span> {{ stats.con }}</span>
                <span v-if="stats.int !== null" class="preview-stat"><span
                    class="preview-stat-label">INT</span> {{ stats.int }}</span>
                <span v-if="stats.wis !== null" class="preview-stat"><span
                    class="preview-stat-label">WIS</span> {{ stats.wis }}</span>
                <span v-if="stats.cha !== null" class="preview-stat"><span
                    class="preview-stat-label">CHA</span> {{ stats.cha }}</span>
              </div>
              <div class="preview-divider" />
              <div class="preview-footer">
                <span class="preview-server">{{ form.server }}</span>
                <span class="preview-online" :class="character.is_online ? 'online' : 'offline'">
                  {{ character.is_online ? '●' : '○' }}
                </span>
                <span v-if="character.area_name" class="preview-location">
                  ◈ {{ character.area_name }}<span v-if="character.area_region"> · {{
                    character.area_region }}</span>
                </span>
              </div>
            </div>
          </div>

          <div class="obs-instructions">
            <h2>OBS Browser Source URL</h2>
            <div class="obs-url">
              <code>{{ overlayUrl }}</code>
              <button class="btn-copy" @click="copyUrl">{{ copied ? '✓ Copied' : 'Copy' }}</button>
            </div>
            <ul class="obs-tips">
              <li>Width: <strong>600</strong> &nbsp; Height: <strong>210</strong></li>
              <li>Check <strong>"Shutdown source when not visible"</strong></li>
              <li>Check <strong>"Refresh browser when scene becomes active"</strong></li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { DDO_SERVERS, useOverlayConfig, useDDOCharacter } from '~/composables/useDDO'
import { useOverlayStats, type DDOStats } from '~/composables/useDDO'


const { config, loadConfig, saveConfig } = useOverlayConfig()
const { character, loading, error, fetchCharacter } = useDDOCharacter()
const { stats, loadStats, saveStats } = useOverlayStats()

const statsForm = reactive<DDOStats>({
  hp: null, sp: null, ac: null, rp: null,
  str: null, dex: null, con: null, int: null, wis: null, cha: null,
})

const form = reactive({
  characterName: '',
  server: 'Shadowdale' as string,
})

const saved = ref(false)
const copied = ref(false)

const overlayUrl = computed(() => {
  const base = import.meta.client ? window.location.origin : ''
  const name = encodeURIComponent(form.characterName.trim())
  const server = encodeURIComponent(form.server)
  const s = statsForm
  return `${base}/overlay?character=${name}&server=${server}&hp=${s.hp ?? ''}&sp=${s.sp ?? ''}&ac=${s.ac ?? ''}&rp=${s.rp ?? ''}&str=${s.str ?? ''}&dex=${s.dex ?? ''}&con=${s.con ?? ''}&int=${s.int ?? ''}&wis=${s.wis ?? ''}&cha=${s.cha ?? ''}`
})

onMounted(() => {
  loadConfig()
  loadStats()
  form.characterName = config.value.characterName
  form.server = config.value.server
  Object.assign(statsForm, stats.value)
  if (form.characterName) {
    saved.value = true
    testFetch()
  }
})

function handleSave() {
  saveConfig({ characterName: form.characterName.trim(), server: form.server })
  saved.value = true
  testFetch()
}

function handleStatsSave() {
  saveStats({ ...statsForm })
}

async function testFetch() {
  await fetchCharacter(form.server, form.characterName)
}

function formatClasses(classes: Array<{ name: string; level: number }>) {
  return classes.map(c => `${c.name} ${c.level}`).join(' / ')
}

async function copyUrl() {
  if (!import.meta.client) return
  await navigator.clipboard.writeText(overlayUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<style>
*,
*::before,
*::after {
  box-sizing: content-box;
}

:root {
  --gold: #c9a84c;
  --gold-light: #e8c97a;
  --gold-dim: #7a6330;
  --parchment: #f2e8d0;
  --parchment-dark: #d4c49a;
  --ink: #0e0b06;
  --ink-mid: #1c1508;
  --red-accent: #8b1a1a;
  --shadow: rgba(0, 0, 0, 0.6);
  --stone: #2a2016;
  --stone-light: #362a18;
  --field-bg: #120e07;
  --field-border: #5a4820;
  --field-border-focus: #c9a84c;
}

html,
body {
  margin: 0;
  padding: 0;
  background: var(--stone);
  color: var(--parchment);
  font-family: 'Cormorant Unicase', serif;
  min-height: 100vh;
}

.config-page {
  background:
    radial-gradient(ellipse at 20% 20%, rgba(201, 168, 76, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 80%, rgba(139, 26, 26, 0.06) 0%, transparent 60%),
    var(--stone);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.config-container {
  width: 100%;
  max-width: 960px;
}

.config-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

/* Two column grid */
.config-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: initial;
}

/* Tighten form padding to fit */
.config-form {
  padding: 1.5rem;
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.btn-save {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
}

/* Preview spans full width */
.preview-section {
  padding: 1.25rem 1.5rem;
}

/* Preview inner layout */
.preview-inner {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 1.5rem;
  align-items: start;
}

/* OBS instructions */
.obs-instructions {
  border-top: 3px solid var(--field-border);
  border-left: 3px solid var(--field-border);
  padding: 1.25rem 1.5rem;
}

.obs-instructions h2 {
  font-family: "Cinzel Decorative", serif;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--parchment-dark);
  margin: 0 0 0.75rem;
}

.obs-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.obs-url code {
  background: var(--field-bg);
  border: 3px solid var(--field-border);
  border-radius: 3px;
  padding: 0.4rem 0.6rem;
  font-size: 0.78rem;
  color: var(--parchment-dark);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
}

.btn-copy {
  background: none;
  border: 3px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment-dark);
  font-family: "Cinzel Decorative", serif;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s;
}

.btn-copy:hover {
  border-color: var(--gold);
  color: var(--gold-light);
}

.btn-copy:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.4);
}

.obs-tips {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.85rem;
  color: var(--parchment-dark);
  line-height: 2;
}

.obs-tips li::before {
  content: '▸ ';
  color: var(--gold-dim);
}

.obs-tips strong {
  color: var(--parchment);
}

.sigil {
  font-size: 2.25rem;
  color: var(--gold);
  display: block;
  margin-bottom: 0.75rem;
  text-shadow: 0 0 20px rgba(201, 168, 76, 0.35);
}

.config-header h1 {
  font-family: "Cinzel Decorative", serif;
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--gold-light);
  margin: 0 0 0.5rem;
  letter-spacing: 0.04em;
  text-shadow: 0 2px 8px var(--shadow);
}

.config-subtitle {
  font-family: "Cormorant Unicase", serif;
  font-style: italic;
  color: var(--parchment-dark);
  margin: 0;
  font-size: 1rem;
  opacity: 0.85;
}

/* Form card */
.config-form {
  background: var(--stone-light);
  border: 3px solid var(--gold-dim);
  border-radius: 4px;
  padding: 2rem 1.75rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-of-type {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-family: "Cinzel Decorative", serif;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--parchment-dark);
  margin-bottom: 0.5rem;
}

/* Select */
.select-wrap {
  position: relative;
}

.select-wrap select {
  width: 100%;
  appearance: none;
  background: var(--field-bg);
  border: 3px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment);
  font-family: "Cormorant Unicase", serif;
  font-size: 1rem;
  padding: 0.65rem 0 0.65rem 0.5rem;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  line-height: 1.4;
}

.select-wrap select:hover {
  border-color: var(--gold-dim);
}

.select-wrap select:focus {
  outline: none;
  border-color: var(--field-border-focus);
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.2);
}

.select-arrow {
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gold-dim);
  pointer-events: none;
  font-size: 0.75rem;
  line-height: 1;
}

/* Text input */
.form-group input[type="text"] {
  width: 100%;
  background: var(--field-bg);
  border: 3px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment);
  font-family: "Cormorant Unicase", serif;
  font-size: 1rem;
  padding: 0.65rem 0 0.65rem 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  line-height: 1.4;
}

.form-group input[type="text"]:hover {
  border-color: var(--gold-dim);
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: var(--field-border-focus);
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.2);
}

.form-group input[type="text"]::placeholder {
  color: #5a4820;
  font-style: italic;
}

.form-section-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--parchment-dark);
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--field-border);
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.form-row .form-group {
  flex: 1;
  min-width: 60px;
  margin-bottom: 0;
}

.form-row .form-group input[type="number"] {
  width: 100%;
  background: var(--field-bg);
  border: 3px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment);
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.9rem;
  padding: 0.65rem 0.5rem;
  text-align: center;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-row .form-group input[type="number"]:focus {
  outline: none;
  border-color: var(--field-border-focus);
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.2);
}

/* hide number input spinners */
.form-row .form-group input[type="number"]::-webkit-inner-spin-button,
.form-row .form-group input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
}

.form-row .form-group input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Save button */
.btn-save {
  width: 100%;
  background: linear-gradient(180deg, #8a6a28 0%, #5a4418 100%);
  border: 1px solid var(--gold);
  border-radius: 3px;
  color: var(--parchment);
  font-family: "Cinzel Decorative", serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  padding: 0.85rem 0 1rem 0.75rem;
  cursor: pointer;
  transition: background 0.2s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.75rem;
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(180deg, #a07c30 0%, #6a5020 100%);
  box-shadow: 0 2px 12px rgba(201, 168, 76, 0.2);
}

.btn-save:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.5);
}

.btn-save:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 0.65rem;
  opacity: 0.8;
}

/* Preview section */
.preview-section {
  background: var(--stone-light);
  border: 3px solid var(--gold-dim);
  border-radius: 4px;
  padding: 1.5rem 1.75rem;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.preview-label {
  font-family: "Cinzel Decorative", serif;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--parchment-dark);
}

.btn-refresh {
  background: none;
  border: 3px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment-dark);
  font-family: "Cormorant Unicase", serif;
  font-size: 0.85rem;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold-light);
}

.btn-refresh:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.4);
}

.btn-refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.preview-loading {
  text-align: center;
  color: var(--gold-dim);
  font-style: italic;
  padding: 1rem;
}

.loading-rune {
  display: inline-block;
  animation: spin 2s linear infinite;
  margin-right: 0.5rem;
  color: var(--gold);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.preview-error {
  color: #e09090;
  padding: 0.75rem;
  border: 1px solid rgba(139, 26, 26, 0.5);
  border-radius: 3px;
  background: rgba(139, 26, 26, 0.12);
  font-size: 0.9rem;
}

.preview-card {
  border: 3px solid var(--field-border);
  border-radius: 3px;
  padding: 1rem;
  background: var(--field-bg);
  margin-bottom: 1.5rem;
}

.preview-name {
  font-family: "Cinzel Decorative", serif;
  font-size: 1.2rem;
  color: var(--gold-light);
  margin-bottom: 0.3rem;
}

.preview-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg,
      transparent 0%,
      rgba(201, 168, 76, 0.5) 20%,
      rgba(201, 168, 76, 0.5) 80%,
      transparent 100%);
  margin: 0.3rem 0;
}

.preview-identity {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.78rem;
  color: #b0a070;
  font-style: italic;
  margin-left: 0.5rem;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.9rem;
  color: var(--parchment-dark);
  margin-bottom: 0;
}

.preview-level {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.65rem;
  color: #d4a84c;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.preview-classes {
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-size: 0.9rem;
  color: #e2d4a8;
  flex-shrink: 0;
}

.preview-sep {
  font-size: 0.4rem;
  color: rgba(201, 168, 76, 0.6);
  flex-shrink: 0;
}

.preview-guild {
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-size: 0.85rem;
  color: #c8a84c;
}

.preview-guild-row {
  display: flex;
  align-items: center;
  margin-top: 0.1rem;
}

.preview-stats-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
  margin-top: 0.15rem;
}

.preview-stat {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.85rem;
  color: #e2d4a8;
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.preview-stat-label {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.58rem;
  color: #c9a84c;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.preview-server {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #a08840;
}

.preview-location {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.78rem;
  color: #b0a070;
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-online.online {
  color: #7ac97a;
}

.preview-online.offline {
  color: #c07070;
}
</style>