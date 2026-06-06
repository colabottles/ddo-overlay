<template>
  <div class="config-page">
    <div class="config-container">
      <header class="config-header">
        <div class="sigil" aria-hidden="true">⚔</div>
        <h1>DDO Stream Overlay</h1>
        <p class="config-subtitle">Configure your character display</p>
      </header>

      <main class="config-main">
        <!-- Left column: character + stats forms -->
        <div class="forms-column">
          <form class="config-form" @submit.prevent="handleSave" aria-label="Character settings">
            <div class="form-group">
              <label for="server">Server</label>
              <div class="select-wrap">
                <select id="server" v-model="form.server">
                  <option v-for="s in DDO_SERVERS" :key="s" :value="s">{{ s }}</option>
                </select>
                <span class="select-arrow" aria-hidden="true">▾</span>
              </div>
            </div>

            <div class="form-row two-col">
              <div class="form-group">
                <label for="charname">Character Name</label>
                <input
                  id="charname"
                  v-model="form.characterName"
                  type="text"
                  placeholder="e.g. Icewinddale"
                  autocomplete="off"
                  spellcheck="false" />
              </div>
              <div class="form-group">
                <label for="lastname">Last Name <span class="optional">(optional)</span></label>
                <input
                  id="lastname"
                  v-model="form.lastName"
                  type="text"
                  placeholder="e.g. of Thrane"
                  autocomplete="off"
                  spellcheck="false" />
              </div>
            </div>

            <button type="submit" class="btn-save" :disabled="!form.characterName.trim()">
              <span class="btn-icon" aria-hidden="true">✦</span>
              Save & Preview
            </button>
          </form>

          <form class="config-form stats-form" @submit.prevent="handleStatsSave"
            aria-label="Character stats">
            <div class="form-section-title">Character Stats</div>

            <div class="stats-block">
              <div class="form-group stat-group" v-for="stat in ['hp', 'sp', 'ac', 'rp']" :key="stat">
                <label :for="stat">{{ stat.toUpperCase() }}</label>
                <input :id="stat" v-model.number="statsForm[stat as keyof DDOStats]" type="number"
                  min="0" placeholder="0" />
              </div>
            </div>

            <div class="stats-block">
              <div class="form-group stat-group"
                v-for="stat in ['str', 'dex', 'con', 'int', 'wis', 'cha']" :key="stat">
                <label :for="stat">{{ stat.toUpperCase() }}</label>
                <input :id="stat" v-model.number="statsForm[stat as keyof DDOStats]" type="number"
                  min="0" placeholder="0" />
              </div>
            </div>

            <button type="submit" class="btn-save">
              <span class="btn-icon" aria-hidden="true">✦</span>
              Save Stats
            </button>
          </form>
        </div>

        <!-- Right column: preview + OBS -->
        <div class="preview-column" v-if="saved">
          <section class="preview-section" aria-label="Live preview">
            <div class="preview-header">
              <span class="section-title">Live Preview</span>
              <button class="btn-refresh" @click="testFetch" :disabled="loading">
                {{ loading ? 'Fetching…' : '↺ Refresh' }}
              </button>
            </div>

            <div class="preview-card" role="status" aria-live="polite">
              <div v-if="loading" class="preview-loading">
                <span class="loading-rune" aria-hidden="true">᛭</span>
                Consulting the ethereal records…
              </div>

              <div v-else-if="error" class="preview-error">
                <span aria-hidden="true">⚠</span> {{ error }}
              </div>

              <template v-else-if="character">
                <div class="preview-name">
                  {{ character.name }}{{ form.lastName ? ' ' + form.lastName : '' }}
                  <span v-if="character.race || character.gender" class="preview-identity">
                    <span v-if="character.race">{{ character.race }}</span>
                    <span v-if="character.race && character.gender"> ◆ </span>
                    <span v-if="character.gender">{{ character.gender }}</span>
                  </span>
                </div>
                <div class="preview-divider" />
                <div class="preview-meta">
                  <span v-if="character.total_level" class="preview-level">Lvl {{
                    character.total_level }}</span>
                  <span v-if="character.classes?.length" class="preview-classes">{{
                    formatClasses(character.classes) }}</span>
                </div>
                <div v-if="character.guild_name" class="preview-guild-row">
                  <span class="preview-guild">{{ character.guild_name }}</span>
                </div>
                <div class="preview-divider" />
                <div class="preview-stats-row">
                  <template v-for="s in ['hp', 'sp', 'ac', 'rp']" :key="s">
                    <span v-if="statVal(s) !== null" class="preview-stat">
                      <span class="preview-stat-label">{{ s.toUpperCase() }}</span> {{ statVal(s) }}
                    </span>
                  </template>
                </div>
                <div class="preview-stats-row">
                  <template v-for="s in ['str', 'dex', 'con', 'int', 'wis', 'cha']" :key="s">
                    <span v-if="statVal(s) !== null" class="preview-stat">
                      <span class="preview-stat-label">{{ s.toUpperCase() }}</span> {{ statVal(s) }}
                    </span>
                  </template>
                </div>
                <div class="preview-divider" />
                <div class="preview-footer">
                  <span class="preview-server">{{ form.server }}</span>
                  <span class="preview-online" :class="character.is_online ? 'online' : 'offline'"
                    :aria-label="character.is_online ? 'Online' : 'Offline'">
                    {{ character.is_online ? '●' : '○' }}
                  </span>
                  <span v-if="character.area_name" class="preview-location">
                    ◈ {{ character.area_name }}<span v-if="character.area_region"> · {{
                      character.area_region }}</span>
                  </span>
                </div>
              </template>
            </div>

            <div class="obs-block">
              <h2 class="section-title">OBS Browser Source URL</h2>
              <div class="obs-url">
                <code>{{ overlayUrl }}</code>
                <button class="btn-copy" @click="copyUrl">{{ copied ? '✓ Copied' : 'Copy'
                  }}</button>
              </div>
              <ul class="obs-tips">
                <li>Width: <strong>300</strong> &nbsp; Height: <strong>280</strong></li>
                <li>Check <strong>"Shutdown source when not visible"</strong></li>
                <li>Check <strong>"Refresh browser when scene becomes active"</strong></li>
              </ul>
            </div>
          </section>
        </div>

        <!-- Placeholder when not yet saved -->
        <div v-else class="preview-placeholder" aria-hidden="true">
          <span class="placeholder-sigil">᛭</span>
          <p>Save a character to see the preview</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DDO_SERVERS, useOverlayConfig, useDDOCharacter, useOverlayStats, type DDOStats } from '~/composables/useDDO'

const { config, loadConfig, saveConfig } = useOverlayConfig()
const { character, loading, error, fetchCharacter } = useDDOCharacter()
const { stats, loadStats, saveStats } = useOverlayStats()

const statsForm = reactive<DDOStats>({
  hp: null, sp: null, ac: null, rp: null,
  str: null, dex: null, con: null, int: null, wis: null, cha: null,
})

const form = reactive({
  characterName: '',
  lastName: '',
  server: 'Shadowdale' as string,
})

const saved = ref(false)
const copied = ref(false)

const overlayUrl = computed(() => {
  const base = import.meta.client ? window.location.origin : ''
  const name = encodeURIComponent(form.characterName.trim())
  const last = encodeURIComponent(form.lastName.trim())
  const server = encodeURIComponent(form.server)
  const s = statsForm
  return `${base}/overlay?character=${name}&lastname=${last}&server=${server}&hp=${s.hp ?? ''}&sp=${s.sp ?? ''}&ac=${s.ac ?? ''}&rp=${s.rp ?? ''}&str=${s.str ?? ''}&dex=${s.dex ?? ''}&con=${s.con ?? ''}&int=${s.int ?? ''}&wis=${s.wis ?? ''}&cha=${s.cha ?? ''}`
})

onMounted(() => {
  loadConfig()
  loadStats()
  form.characterName = config.value.characterName
  form.lastName = config.value.lastName ?? ''
  form.server = config.value.server
  Object.assign(statsForm, stats.value)
  if (form.characterName) {
    saved.value = true
    testFetch()
  }
})

function statVal(key: string): number | null {
  return stats.value[key as keyof DDOStats]
}

function handleSave() {
  saveConfig({ characterName: form.characterName.trim(), lastName: form.lastName.trim(), server: form.server })
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
  margin: 0;
  padding: 0;
}

:root {
  --gold: #FFD97A;
  --gold-mid: #C9A84C;
  --gold-dim: #7a6330;
  --parchment: #F0E6C8;
  --parchment-dim: #C8B98A;
  --ink: #0e0b06;
  --stone: #1e1608;
  --stone-light: #2a1e0c;
  --field-bg: #120e07;
  --field-border: #5a4820;
  --field-border-focus: #FFD97A;
}

html,
body {
  background: var(--stone);
  color: var(--parchment);
  font-family: 'Cormorant Unicase', serif;
  font-size: 1rem;
  /* no scroll */
  height: 100vh;
  overflow: hidden;
}

/* Full-height page, no scroll */
.config-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0.75rem 1.25rem;
}

.config-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
  gap: 0.5rem;
}

/* Header */
.config-header {
  text-align: center;
  flex-shrink: 0;
  padding-bottom: 0.4rem;
}

.sigil {
  font-size: 1.5rem;
  color: var(--gold);
  display: block;
  margin-bottom: 0.25rem;
}

.config-header h1 {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.04em;
  margin-bottom: 0.2rem;
}

.config-subtitle {
  font-style: italic;
  color: var(--parchment-dim);
  font-size: 1rem;
}

/* Main two-column layout, fills remaining height */
.config-main {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

/* Forms column */
.forms-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;
}

/* Shared form card */
.config-form {
  background: var(--stone-light);
  border: 2px solid var(--gold-dim);
  border-radius: 4px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-group label {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--parchment-dim);
}

.optional {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.85rem;
  letter-spacing: 0;
  text-transform: none;
  color: var(--gold-dim);
  font-style: italic;
}

/* Two-col form row */
.form-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

/* Select */
.select-wrap {
  position: relative;
}

.select-wrap select {
  width: 100%;
  appearance: none;
  background: var(--field-bg);
  border: 2px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment);
  font-family: 'Cormorant Unicase', serif;
  font-size: 1rem;
  padding: 0.5rem 2rem 0.5rem 0.6rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.select-wrap select:focus {
  outline: none;
  border-color: var(--field-border-focus);
  box-shadow: 0 0 0 2px rgba(255, 217, 122, 0.2);
}

.select-arrow {
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gold-dim);
  pointer-events: none;
  font-size: 0.75rem;
}

/* Text inputs */
.form-group input[type="text"] {
  width: 100%;
  background: var(--field-bg);
  border: 2px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment);
  font-family: 'Cormorant Unicase', serif;
  font-size: 1rem;
  padding: 0.5rem 0.6rem;
  transition: border-color 0.2s;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: var(--field-border-focus);
  box-shadow: 0 0 0 2px rgba(255, 217, 122, 0.2);
}

.form-group input[type="text"]::placeholder {
  color: var(--gold-dim);
  font-style: italic;
}

/* Stats form */
.form-section-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--parchment-dim);
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--field-border);
}

.stats-block {
  display: flex;
  gap: 0.5rem;
}

.stat-group {
  flex: 1;
}

.stat-group label {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--parchment-dim);
  text-align: center;
}

.stat-group input[type="number"] {
  width: 100%;
  background: var(--field-bg);
  border: 2px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment);
  font-family: 'Cinzel Decorative', serif;
  font-size: 1rem;
  padding: 0.4rem 0.25rem;
  text-align: center;
  transition: border-color 0.2s;
  /* hide spinners */
  -moz-appearance: textfield;
  appearance: textfield;
}

.stat-group input[type="number"]::-webkit-inner-spin-button,
.stat-group input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  appearance: none;
}

.stat-group input[type="number"]:focus {
  outline: none;
  border-color: var(--field-border-focus);
  box-shadow: 0 0 0 2px rgba(255, 217, 122, 0.2);
}

/* Save button */
.btn-save {
  width: 100%;
  background: linear-gradient(180deg, #8a6a28 0%, #5a4418 100%);
  border: 1px solid var(--gold-mid);
  border-radius: 3px;
  color: var(--parchment);
  font-family: 'Cinzel Decorative', serif;
  font-size: 1rem;
  letter-spacing: 0.08em;
  padding: 0.6rem 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
  margin-top: 0.2rem;
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(180deg, #a07c30 0%, #6a5020 100%);
}

.btn-save:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 217, 122, 0.5);
}

.btn-save:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 0.65rem;
}

/* Preview column */
.preview-column {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.preview-section {
  background: var(--stone-light);
  border: 2px solid var(--gold-dim);
  border-radius: 4px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.section-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--parchment-dim);
}

.btn-refresh {
  background: none;
  border: 2px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment-dim);
  font-family: 'Cormorant Unicase', serif;
  font-size: 1rem;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  border-color: var(--gold);
  color: var(--gold);
}

.btn-refresh:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 217, 122, 0.4);
}

.btn-refresh:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Preview card */
.preview-card {
  border: 2px solid var(--field-border);
  border-radius: 3px;
  padding: 0.75rem 1rem;
  background: var(--field-bg);
  flex-shrink: 0;
}

.preview-loading {
  color: var(--gold-dim);
  font-style: italic;
  font-size: 1rem;
}

.loading-rune {
  display: inline-block;
  animation: spin 2s linear infinite;
  margin-right: 0.4rem;
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
  color: #FF9999;
  font-size: 1rem;
  padding: 0.5rem;
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 3px;
  background: rgba(139, 26, 26, 0.15);
}

.preview-name {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.1rem;
  color: #ffffff;
  margin-bottom: 0.2rem;
}

.preview-divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 217, 122, 0.4);
  margin: 0.25rem 0;
}

.preview-identity {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.85rem;
  color: var(--parchment);
  font-style: italic;
  margin-left: 0.5rem;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin-bottom: 0;
}

.preview-level {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.75rem;
  color: var(--gold);
  letter-spacing: 0.08em;
}

.preview-classes {
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-size: 1rem;
  color: var(--parchment);
}

.preview-guild {
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-size: 1rem;
  color: var(--gold);
}

.preview-guild-row {
  display: flex;
  align-items: center;
  margin-top: 0.1rem;
}

.preview-stats-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin-top: 0.15rem;
}

.preview-stat {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.9rem;
  color: var(--parchment);
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.preview-stat-label {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.6rem;
  color: var(--gold);
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
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffffff;
}

.preview-location {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.85rem;
  color: var(--parchment);
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-online.online {
  color: #90EE90;
  font-size: 0.6rem;
}

.preview-online.offline {
  color: #FF9999;
  font-size: 0.6rem;
}

/* OBS block */
.obs-block {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.obs-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.obs-url code {
  background: var(--field-bg);
  border: 2px solid var(--field-border);
  border-radius: 3px;
  padding: 0.35rem 0.6rem;
  font-size: 0.85rem;
  color: var(--parchment-dim);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Courier New', monospace;
}

.btn-copy {
  background: none;
  border: 2px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment-dim);
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s;
}

.btn-copy:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.btn-copy:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 217, 122, 0.4);
}

.obs-tips {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 1rem;
  color: var(--parchment-dim);
  line-height: 1.8;
}

.obs-tips li::before {
  content: '▸ ';
  color: var(--gold-dim);
}

.obs-tips strong {
  color: var(--parchment);
}

/* Placeholder */
.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 2px dashed var(--gold-dim);
  border-radius: 4px;
  color: var(--gold-dim);
  font-style: italic;
  font-size: 1rem;
}

.placeholder-sigil {
  font-size: 2rem;
  opacity: 0.4;
}
</style>