<template>
  <div class="overlay-root">
    <div v-if="loading && !character" class="overlay-loading">
      <span class="rune-spin">᛭</span>
    </div>

    <div v-else-if="!config.characterName" class="overlay-empty" />

    <div v-else-if="character && !character.is_online" class="overlay-panel">
      <span class="char-name muted">{{ character.name }}</span>
      <span class="sep">◆</span>
      <span class="offline-tag">Offline</span>
    </div>

    <div v-else-if="character" class="overlay-panel">
      <div class="char-name">{{ character.name }}</div>
      <div class="divider" />
      <div class="char-detail">
        <span v-if="character.total_level" class="char-level">Lvl {{ character.total_level }}</span>
        <span v-if="formattedClasses" class="char-classes">{{ formattedClasses }}</span>
        <span v-if="character.guild_name" class="sep">◆</span>
        <span v-if="character.guild_name" class="char-guild">{{ character.guild_name }}</span>
      </div>
      <div v-if="character.location?.name" class="char-location-row">
        <span class="loc-icon">◈</span>
        <span class="char-location">{{ character.location.name }}</span>
      </div>
      <div class="divider" />
      <div class="char-stats-row">
        <span v-if="stats.hp" class="stat-item"><span class="stat-label">HP</span> {{ stats.hp
          }}</span>
        <span v-if="stats.sp" class="stat-item"><span class="stat-label">SP</span> {{ stats.sp
          }}</span>
        <span v-if="stats.ac" class="stat-item"><span class="stat-label">AC</span> {{ stats.ac
          }}</span>
        <span v-if="stats.rp" class="stat-item"><span class="stat-label">RP</span> {{ stats.rp
          }}</span>
      </div>
      <div class="char-stats-row">
        <span v-if="stats.str" class="stat-item"><span class="stat-label">STR</span> {{ stats.str
          }}</span>
        <span v-if="stats.dex" class="stat-item"><span class="stat-label">DEX</span> {{ stats.dex
          }}</span>
        <span v-if="stats.con" class="stat-item"><span class="stat-label">CON</span> {{ stats.con
          }}</span>
        <span v-if="stats.int" class="stat-item"><span class="stat-label">INT</span> {{ stats.int
          }}</span>
        <span v-if="stats.wis" class="stat-item"><span class="stat-label">WIS</span> {{ stats.wis
          }}</span>
        <span v-if="stats.cha" class="stat-item"><span class="stat-label">CHA</span> {{ stats.cha
          }}</span>
      </div>
      <div class="divider" />
      <div class="char-footer">
        <span class="server-name">{{ config.server }}</span>
        <span class="online-pip" title="Online">●</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOverlayConfig, useDDOCharacter, useOverlayStats } from '~/composables/useDDO'

const { config, loadConfig } = useOverlayConfig()
const { character, loading, lastFetched, fetchCharacter } = useDDOCharacter()
const { stats, loadStats } = useOverlayStats()

const POLL_INTERVAL = 45_000

let pollTimer: ReturnType<typeof setInterval> | null = null

const formattedClasses = computed(() => {
  if (!character.value?.classes?.length) return ''
  return character.value.classes.map(c => `${c.name} ${c.level}`).join(' / ')
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

  // read stats from query params
  const parseParam = (val: unknown) => {
    const n = Number(val)
    return isNaN(n) || val === '' ? null : n
  }

  stats.value = {
    hp: parseParam(route.query.hp),
    sp: parseParam(route.query.sp),
    ac: parseParam(route.query.ac),
    rp: parseParam(route.query.rp),
    str: parseParam(route.query.str),
    dex: parseParam(route.query.dex),
    con: parseParam(route.query.con),
    int: parseParam(route.query.int),
    wis: parseParam(route.query.wis),
    cha: parseParam(route.query.cha),
  }

  if (nameFromQuery && serverFromQuery) {
    config.value.characterName = nameFromQuery
    config.value.server = serverFromQuery
    fetchCharacter(serverFromQuery, nameFromQuery)
    pollTimer = setInterval(() => {
      fetchCharacter(serverFromQuery, nameFromQuery)
    }, POLL_INTERVAL)
  } else {
    loadConfig()
    loadStats()
    if (config.value.characterName) {
      fetchCharacter(config.value.server, config.value.characterName)
      pollTimer = setInterval(() => {
        fetchCharacter(config.value.server, config.value.characterName)
      }, POLL_INTERVAL)
    }
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
  width: 300px;
  height: 210px;
}

.overlay-root {
  width: 300px;
  height: 210px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: transparent;
}

/* ── Empty / loading ─────────────────────────────────── */
.overlay-empty,
.overlay-loading {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 210px;
}

.rune-spin {
  font-size: 1rem;
  color: rgba(201, 168, 76, 0.6);
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

/* ── Main panel ──────────────────────────────────────── */
.overlay-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  width: 100%;
  padding: 0 0.5rem;
}

/* ── Name ────────────────────────────────────────────── */
.char-name {
  font-family: 'Cinzel Decorative', serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.95);
  line-height: 1.3;
  white-space: nowrap;
}

.char-name.muted {
  color: #a08840;
}

/* ── Thin gold divider line ──────────────────────────── */
.divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg,
      transparent 0%,
      rgba(201, 168, 76, 0.7) 20%,
      rgba(201, 168, 76, 0.7) 80%,
      transparent 100%);
  margin: 0.2rem 0;
}

/* ── Detail row ──────────────────────────────────────── */
.char-detail {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
}

.char-level {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: #d4a84c;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.char-classes {
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-size: 1rem;
  color: #e2d4a8;
  flex-shrink: 0;
}

.sep {
  font-size: 0.4rem;
  color: rgba(201, 168, 76, 0.6);
  flex-shrink: 0;
  line-height: 1;
}

.char-guild {
  font-family: 'Cormorant Unicase', serif;
  font-style: italic;
  font-size: 0.95rem;
  color: #c8a84c;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

/* ── Location row ────────────────────────────────────── */
.char-location-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.15rem;
  overflow: hidden;
}

.loc-icon {
  font-size: 0.65rem;
  color: rgba(201, 168, 76, 0.6);
  flex-shrink: 0;
}

.char-location {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.95rem;
  color: #b0a070;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* ── Stats rows ──────────────────────────────────────── */
.char-stats-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
  margin-top: 0.15rem;
}

.stat-item {
  font-family: 'Cormorant Unicase', serif;
  font-size: 0.8rem;
  color: #e2d4a8;
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.stat-label {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.58rem;
  color: #c9a84c;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ── Footer row ──────────────────────────────────────── */
.char-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.15rem;
}

.server-name {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.75rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #ecebea;
}

.online-pip {
  font-size: 0.5rem;
  color: #7ac97a;
  text-shadow: 0 0 5px rgba(122, 201, 122, 0.8);
  animation: pulse 2.5s ease-in-out infinite;
}

.offline-tag {
  font-family: 'Cinzel Decorative', serif;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: #c07070;
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
</style>