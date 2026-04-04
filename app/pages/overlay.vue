<template>
  <div class="overlay-root">
    <div v-if="loading && !character" class="overlay-card loading-card">
      <span class="corner corner-tl" /><span class="corner corner-tr" />
      <span class="corner corner-bl" /><span class="corner corner-br" />
      <div class="rune-spin">+</div>
    </div>

    <div v-else-if="!config.characterName" class="overlay-card error-card">
      <span class="corner corner-tl" /><span class="corner corner-tr" />
      <span class="corner corner-bl" /><span class="corner corner-br" />
      <span class="error-text">No character configured — visit /config</span>
    </div>

    <div v-else-if="character && !character.is_online" class="overlay-card offline-card">
      <span class="corner corner-tl" /><span class="corner corner-tr" />
      <span class="corner corner-bl" /><span class="corner corner-br" />
      <div class="char-name">{{ character.name }}</div>
      <div class="offline-tag">○ Offline</div>
    </div>

    <div v-else-if="character" class="overlay-card char-card">
      <span class="corner corner-tl" /><span class="corner corner-tr" />
      <span class="corner corner-bl" /><span class="corner corner-br" />

      <div class="card-header">
        <div class="char-name">{{ character.name }}</div>
        <div class="online-pip">●</div>
      </div>

      <div class="card-body">
        <div class="char-meta">
          <span v-if="character.total_level" class="char-level">
            Lvl {{ character.total_level }}
          </span>
          <span v-if="formattedClasses" class="char-classes">
            {{ formattedClasses }}
          </span>
        </div>

        <div v-if="character.guild_name" class="char-guild">
          <span class="guild-icon">⚜</span>{{ character.guild_name }}
        </div>

        <div v-if="character.location?.name" class="char-location">
          <span class="loc-icon">◈</span>{{ character.location.name }}
        </div>
      </div>

      <div class="card-footer">
        <span class="server-name">{{ config.server }}</span>
        <span class="last-update" v-if="lastFetched">{{ timeAgo }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DDO_SERVERS, useOverlayConfig, useDDOCharacter } from '~/composables/useDDO'

const { config, loadConfig } = useOverlayConfig()
const { character, loading, error, lastFetched, fetchCharacter } = useDDOCharacter()

const POLL_INTERVAL = 45_000 // 45 seconds

let pollTimer: ReturnType<typeof setInterval> | null = null

const formattedClasses = computed(() => {
  if (!character.value?.classes?.length) return ''
  return character.value.classes
    .map(c => `${c.name} ${c.level}`)
    .join(' / ')
})

const timeAgo = computed(() => {
  if (!lastFetched.value) return ''
  const secs = Math.floor((Date.now() - lastFetched.value.getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  return `${Math.floor(secs / 60)}m ago`
})

onMounted(() => {
  const route = useRoute()
  const nameFromQuery = route.query.character as string
  const serverFromQuery = route.query.server as string

  if (nameFromQuery && serverFromQuery) {
    // Use query params directly — don't need localStorage in OBS
    config.value.characterName = nameFromQuery
    config.value.server = serverFromQuery
    fetchCharacter(serverFromQuery, nameFromQuery)
    pollTimer = setInterval(() => {
      fetchCharacter(serverFromQuery, nameFromQuery)
    }, POLL_INTERVAL)
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style>
*,
*::before,
*::after {
  box-sizing: content-box;
  margin: 0;
  padding: 0;
}

html,
body {
  background: transparent !important;
  overflow: hidden;
  width: 420px;
  height: 160px;
}

.overlay-root {
  width: 420px;
  height: 160px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  background: transparent;
}

/* ── Outer frame ─────────────────────────────────────── */
.overlay-card {
  position: relative;
  width: 420px;
  background: linear-gradient(180deg, #1a1208 0%, #0e0b06 60%);
  border: 2px solid #8a6a28;
  overflow: visible;
}

/* outermost thin gold line */
.overlay-card::before {
  content: '';
  position: absolute;
  inset: -5px;
  border: 1px solid rgba(201, 168, 76, 0.35);
  pointer-events: none;
  z-index: 2;
}

/* inner inset line */
.overlay-card::after {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(201, 168, 76, 0.2);
  pointer-events: none;
  z-index: 2;
}

/* ── Corner diamonds ─────────────────────────────────── */
.corner {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #c9a84c;
  transform: rotate(45deg);
  z-index: 10;
}

.corner-tl {
  top: -5px;
  left: -5px;
}

.corner-tr {
  top: -5px;
  right: -5px;
}

.corner-bl {
  bottom: -5px;
  left: -5px;
}

.corner-br {
  bottom: -5px;
  right: -5px;
}

/* ── Header bar ──────────────────────────────────────── */
.card-header {
  position: relative;
  background: linear-gradient(180deg, #3a2a0e 0%, #2a1e08 50%, #1e1508 100%);
  border-bottom: 1px solid #8a6a28;
  padding: 0.35rem 0.85rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* horizontal rule lines inside header */
.card-header::before {
  content: '';
  position: absolute;
  bottom: 3px;
  left: 8px;
  right: 8px;
  height: 1px;
  background: rgba(201, 168, 76, 0.15);
  pointer-events: none;
}

.char-name {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: #e8c97a;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.8);
  line-height: 1.2;
}

.online-pip {
  font-size: 0.55rem;
  color: #7ac97a;
  text-shadow: 0 0 6px rgba(122, 201, 122, 0.8);
  animation: pulse 2.5s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

/* ── Body ────────────────────────────────────────────── */
.card-body {
  padding: 0.5rem 0.85rem 0.6rem;
}

.char-meta {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-bottom: 0.3rem;
  flex-wrap: wrap;
}

.char-level {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.65rem;
  font-weight: 600;
  color: #c9a84c;
  letter-spacing: 0.1em;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.3);
  padding: 0.05rem 0.35rem;
  border-radius: 1px;
  flex-shrink: 0;
}

.char-classes {
  font-family: "Cormorant Unicase", serif;
  font-style: italic;
  font-size: 0.85rem;
  color: #d4c49a;
  line-height: 1.3;
}

.char-guild {
  font-family: "Cormorant Unicase", serif;
  font-size: 0.78rem;
  color: rgba(201, 168, 76, 0.75);
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-style: italic;
}

.guild-icon {
  font-size: 0.6rem;
  flex-shrink: 0;
}

.char-location {
  font-family: "Cormorant Unicase", serif;
  font-size: 0.78rem;
  color: #a09070;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 380px;
}

.loc-icon {
  flex-shrink: 0;
  font-size: 0.65rem;
  color: rgba(201, 168, 76, 0.4);
}

/* ── Footer bar ──────────────────────────────────────── */
.card-footer {
  background: linear-gradient(180deg, #1a1208 0%, #0e0b06 100%);
  border-top: 1px solid rgba(201, 168, 76, 0.25);
  padding: 0.25rem 0.85rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-name {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.58rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: rgba(201, 168, 76, 0.5);
}

.last-update {
  font-family: "Cormorant Unicase", serif;
  font-size: 0.62rem;
  color: rgba(201, 168, 76, 0.3);
  font-style: italic;
}

/* ── Loading ─────────────────────────────────────────── */
.loading-card {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
}

.rune-spin {
  font-size: 1.5rem;
  color: rgba(201, 168, 76, 0.5);
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* ── Error / offline ─────────────────────────────────── */
.error-card,
.offline-card {
  padding: 0.75rem 0.85rem;
}

.error-text {
  font-family: "Cormorant Unicase", serif;
  font-style: italic;
  font-size: 0.8rem;
  color: rgba(201, 168, 76, 0.45);
}

.offline-card .char-name {
  color: rgba(201, 168, 76, 0.45);
  margin-bottom: 0.2rem;
}

.offline-tag {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.65rem;
  color: rgba(200, 120, 120, 0.7);
  letter-spacing: 0.05em;
}
</style>