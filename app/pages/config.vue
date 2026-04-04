<template>
  <div class="config-page">
    <div class="config-container">
      <header class="config-header">
        <div class="sigil">⚔</div>
        <h1>DDO Stream Overlay</h1>
        <p class="config-subtitle">Configure your character display</p>
      </header>

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
            placeholder="e.g. Zulkir (First Name)"
            autocomplete="off"
            spellcheck="false" />
        </div>

        <button type="submit" class="btn-save" :disabled="!form.characterName.trim()">
          <span class="btn-icon">✦</span>
          Save & Preview
        </button>
      </form>

      <!-- Preview / test fetch -->
      <div v-if="saved" class="preview-section">
        <div class="preview-header">
          <span class="preview-label">Live Preview</span>
          <button class="btn-refresh" @click="testFetch" :disabled="loading">
            {{ loading ? 'Fetching…' : '↺ Refresh' }}
          </button>
        </div>

        <div v-if="loading" class="preview-loading">
          <span class="loading-rune">᛭</span>
          Consulting the ethereal records…
        </div>

        <div v-else-if="error" class="preview-error">
          <span>⚠</span> {{ error }}
        </div>

        <div v-else-if="character" class="preview-card">
          <div class="preview-name">{{ character.name }}</div>
          <div class="preview-meta">
            <span v-if="character.total_level" class="preview-level">
              Level {{ character.total_level }}
            </span>
            <span v-if="character.classes?.length" class="preview-classes">
              {{ formatClasses(character.classes) }}
            </span>
          </div>
          <div v-if="character.guild_name" class="preview-guild">
            ⚜ {{ character.guild_name }}
          </div>
          <div v-if="character.location?.name" class="preview-location">
            ◈ {{ character.location.name }}
          </div>
          <div class="preview-online" :class="character.is_online ? 'online' : 'offline'">
            {{ character.is_online ? '● Online' : '○ Offline' }}
          </div>
        </div>

        <div class="obs-instructions">
          <h2>OBS Browser Source URL</h2>
          <div class="obs-url">
            <code>{{ overlayUrl }}</code>
            <button class="btn-copy" @click="copyUrl">{{ copied ? '✓ Copied' : 'Copy' }}</button>
          </div>
          <ul class="obs-tips">
            <li>Width: <strong>400</strong> &nbsp; Height: <strong>220</strong></li>
            <li>Check <strong>"Shutdown source when not visible"</strong></li>
            <li>Check <strong>"Refresh browser when scene becomes active"</strong></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DDO_SERVERS, useOverlayConfig, useDDOCharacter } from '~/composables/useDDO'

const { config, loadConfig, saveConfig } = useOverlayConfig()
const { character, loading, error, fetchCharacter } = useDDOCharacter()

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
  return `${base}/overlay?character=${name}&server=${server}`
})

onMounted(() => {
  loadConfig()
  form.characterName = config.value.characterName
  form.server = config.value.server
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
  font-family: 'IM Fell English', Georgia, serif;
  min-height: 100vh;
}

.config-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(201, 168, 76, 0.06) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 80%, rgba(139, 26, 26, 0.06) 0%, transparent 60%),
    var(--stone);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 3rem 1.5rem;
}

.config-container {
  width: 100%;
  max-width: 480px;
}

/* ── Header ───────────────────────────────────────────── */
.config-header {
  text-align: center;
  margin-bottom: 2.5rem;
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

/* ── Form card ────────────────────────────────────────── */
.config-form {
  background: var(--stone-light);
  border: 1px solid var(--gold-dim);
  border-radius: 4px;
  padding: 2rem 1.75rem;
  margin-bottom: 1.5rem;
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

/* ── Select ───────────────────────────────────────────── */
.select-wrap {
  position: relative;
}

.select-wrap select {
  width: 100%;
  appearance: none;
  background: var(--field-bg);
  border: 1px solid var(--field-border);
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

/* ── Text input ───────────────────────────────────────── */
.form-group input[type="text"] {
  width: 100%;
  background: var(--field-bg);
  border: 1px solid var(--field-border);
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

/* ── Save button ──────────────────────────────────────── */
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

/* ── Preview section ──────────────────────────────────── */
.preview-section {
  background: var(--stone-light);
  border: 1px solid var(--gold-dim);
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
  border: 1px solid var(--field-border);
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
  border: 1px solid var(--field-border);
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

.preview-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.9rem;
  color: var(--parchment-dark);
  margin-bottom: 0.4rem;
  flex-wrap: wrap;
}

.preview-guild {
  font-size: 0.85rem;
  color: var(--gold-dim);
  font-style: italic;
  margin-bottom: 0.25rem;
}

.preview-location {
  font-size: 0.85rem;
  color: var(--parchment-dark);
  margin-bottom: 0.5rem;
}

.preview-online {
  font-size: 0.75rem;
  font-family: "Cinzel Decorative", serif;
  letter-spacing: 0.05em;
}

.preview-online.online {
  color: #7ac97a;
}

.preview-online.offline {
  color: #e09090;
}

/* ── OBS instructions ─────────────────────────────────── */
.obs-instructions {
  border-top: 1px solid var(--field-border);
  padding-top: 1.25rem;
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
  border: 1px solid var(--field-border);
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
  border: 1px solid var(--field-border);
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
</style>