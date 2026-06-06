<template>
  <div class="config-page">
    <div class="config-container">
      <header class="config-header">
        <div class="sigil" aria-hidden="true">⚔</div>
        <h1>DDO Stream Overlay</h1>
        <p class="config-subtitle">Configure your character display</p>
      </header>

      <main class="config-main">
        <div class="top-row">
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

            <div class="name-row">
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
              <div class="form-group">
                <label for="archetype">Archetype <span class="optional">(optional)</span></label>
                <input
                  id="archetype"
                  v-model="form.archetype"
                  type="text"
                  placeholder="e.g. Daggertooth"
                  autocomplete="off"
                  spellcheck="false" />
              </div>
            </div>

            <button type="submit" class="btn-save" :disabled="!form.characterName.trim()">
              <span class="btn-icon" aria-hidden="true">✦</span>
              Save & Preview
            </button>
          </form>

          <form class="config-form" @submit.prevent="handleStatsSave" aria-label="Character stats">
            <div class="form-section-title">Character Stats</div>

            <div class="stats-block">
              <div class="form-group stat-group" v-for="stat in ['hp', 'sp', 'ac', 'rp']"
                :key="stat">
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

        <div class="bottom-row" v-if="saved">
          <section class="config-form preview-section" aria-label="Live preview">
            <div class="preview-header">
              <span class="form-section-title" style="border: none; padding: 0; margin: 0;">Live
                Preview</span>
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
                  <span v-if="form.archetype" class="preview-archetype">({{ form.archetype
                    }})</span>
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
                      character.area_region
                      }}</span>
                  </span>
                </div>
              </template>
            </div>
          </section>

          <section class="config-form obs-section" aria-label="OBS browser source settings">
            <h2 class="form-section-title">OBS Browser Source URL</h2>
            <div class="obs-url">
              <code>{{ overlayUrl }}</code>
              <button class="btn-copy" @click="copyUrl">{{ copied ? '✓ Copied' : 'Copy' }}</button>
            </div>
            <ul class="obs-tips">
              <li>Width: <strong>400</strong> &nbsp; Height: <strong>280</strong></li>
              <li>Check <strong>"Shutdown source when not visible"</strong></li>
              <li>Check <strong>"Refresh browser when scene becomes active"</strong></li>
            </ul>
          </section>
        </div>

        <div v-else class="bottom-row">
          <div class="preview-placeholder" aria-hidden="true">
            <span class="placeholder-sigil">᛭</span>
            <p>Save a character to see the preview</p>
          </div>
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
  archetype: '',
  server: 'Shadowdale' as string,
})

const saved = ref(false)
const copied = ref(false)

const overlayUrl = computed(() => {
  const base = import.meta.client ? window.location.origin : ''
  const name = encodeURIComponent(form.characterName.trim())
  const last = encodeURIComponent(form.lastName.trim())
  const arch = encodeURIComponent(form.archetype.trim())
  const server = encodeURIComponent(form.server)
  const s = statsForm
  return `${base}/overlay?character=${name}&lastname=${last}&archetype=${arch}&server=${server}&hp=${s.hp ?? ''}&sp=${s.sp ?? ''}&ac=${s.ac ?? ''}&rp=${s.rp ?? ''}&str=${s.str ?? ''}&dex=${s.dex ?? ''}&con=${s.con ?? ''}&int=${s.int ?? ''}&wis=${s.wis ?? ''}&cha=${s.cha ?? ''}`
})

onMounted(() => {
  loadConfig()
  loadStats()
  form.characterName = config.value.characterName
  form.lastName = config.value.lastName ?? ''
  form.archetype = config.value.archetype ?? ''
  form.server = config.value.server
  Object.assign(statsForm, stats.value)
  if (form.characterName) {
    saved.value = true
    testFetch()
  }
})

function handleSave() {
  saveConfig({ characterName: form.characterName.trim(), lastName: form.lastName.trim(), archetype: form.archetype.trim(), server: form.server })
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

function statVal(key: string): number | null {
  return stats.value[key as keyof DDOStats]
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
}

.config-page {
  padding: 2rem 1.5rem;
}

.config-container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.config-header {
  text-align: center;
}

.sigil {
  font-size: 2rem;
  color: var(--gold);
  display: block;
  margin-bottom: 0.5rem;
}

.config-header h1 {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--gold);
  letter-spacing: 0.04em;
  margin-bottom: 0.4rem;
}

.config-subtitle {
  font-style: italic;
  color: var(--parchment-dim);
  font-size: 1rem;
}

/* Rows */
.config-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 1.5rem;
}

.top-row,
.bottom-row {
  display: contents;
}

.config-form {
  height: 100%;
}

@media (max-width: 680px) {
  .top-row,
  .bottom-row {
    grid-template-columns: 1fr;
  }
}

/* Shared form card */
.config-form {
  background: var(--stone-light);
  border: 2px solid var(--gold-dim);
  border-radius: 4px;
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-section-title {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--parchment-dim);
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--field-border);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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

.name-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 1rem;
}

/* Select */
.select-wrap {
  position: relative;
}

/* All inputs and select: border-box individually so width: 100% is safe */
.form-group input[type="text"],
.select-wrap select,
.stat-group input[type="number"] {
  box-sizing: border-box;
  width: 100%;
  background: var(--field-bg);
  border: 2px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment);
  font-size: 1rem;
  transition: border-color 0.2s;
}

.select-wrap select {
  appearance: none;
  font-family: 'Cormorant Unicase', serif;
  padding: 0.6rem 2rem 0.6rem 0.6rem;
  cursor: pointer;
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

.form-group input[type="text"] {
  font-family: 'Cormorant Unicase', serif;
  padding: 0.6rem 0.6rem;
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

/* Stats */
.stats-block {
  display: flex;
  gap: 0.5rem;
}

.stat-group {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
  font-family: 'Cinzel Decorative', serif;
  padding: 0.5rem 0.25rem;
  text-align: center;
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
  padding: 0.75rem 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
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

/* Preview section */
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.preview-card {
  background: var(--field-bg);
  border: 2px solid var(--field-border);
  border-radius: 3px;
  padding: 0.85rem 1rem;
}

.preview-loading {
  color: var(--gold-dim);
  font-style: italic;
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

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.preview-error {
  color: #FF9999;
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

.preview-identity {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.85rem;
  color: var(--parchment);
  font-style: italic;
  margin-left: 0.4rem;
}

.preview-divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 217, 122, 0.4);
  margin: 0.3rem 0;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: nowrap;
  white-space: nowrap;
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

.preview-archetype {
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-size: 0.85rem;
  color: var(--parchment);
}

.preview-guild-row {
  display: flex;
  align-items: center;
  margin-top: 0.1rem;
}

.preview-guild {
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-size: 1rem;
  color: var(--gold);
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
  justify-content: flex-start;
  gap: 0.75rem;
  margin-top: 0.15rem;
}

.preview-server {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffffff;
  flex-shrink: 0;
}

.preview-location {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.85rem;
  color: var(--parchment);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-online.online {
  color: #90EE90;
  font-size: 0.6rem;
  flex-shrink: 0;
  animation: pulse 2.5s ease-in-out infinite;
}

.preview-online.offline {
  color: #FF9999;
  font-size: 0.6rem;
  flex-shrink: 0;
}

/* OBS section */
.obs-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.obs-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.obs-url code {
  box-sizing: border-box;
  min-width: 0;
  flex: 1 1 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--field-bg);
  border: 2px solid var(--field-border);
  border-radius: 3px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  color: var(--parchment-dim);
  font-family: 'Courier New', monospace;
  display: block;
}

.btn-copy {
  background: none;
  border: 2px solid var(--field-border);
  border-radius: 3px;
  color: var(--parchment-dim);
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s;
  flex-shrink: 0;
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
  line-height: 2;
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
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  border: 2px dashed var(--gold-dim);
  border-radius: 4px;
  color: var(--gold-dim);
  font-style: italic;
}

.placeholder-sigil {
  font-size: 2rem;
  opacity: 0.4;
}
</style>