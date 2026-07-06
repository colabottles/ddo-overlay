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
      <div class="card-top">
        <div class="char-name">{{ character.name }}{{ config.lastName ? ' ' + config.lastName : ''
          }}</div>
        <div class="char-identity" v-if="character.race || character.gender">
          <span v-if="character.race" class="char-race">{{ character.race }}</span>
          <span v-if="character.race && character.gender" class="sep">◆</span>
          <span v-if="character.gender" class="char-gender">{{ character.gender }}</span>
        </div>
      </div>
      <div class="divider" />
      <div class="char-detail">
        <span v-if="character.total_level" class="char-level">Lvl {{ character.total_level }}</span>
        <span v-if="formattedClasses" class="char-classes">{{ formattedClasses }}</span>
        <span v-if="config.archetype" class="char-archetype">({{ config.archetype }})</span>
      </div>
      <div v-if="character.guild_name" class="char-guild-row">
        <span class="char-guild">{{ character.guild_name }}</span>
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
        <div class="online-pip" title="Online">●</div>
        <span v-if="character.area_name" class="char-location">
          ◈ {{ character.area_name }}<span v-if="character.area_region"> · {{ character.area_region
            }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useOverlayConfig, useDDOCharacter, useOverlayStats } from '~/composables/useDDO'

const { config, loadConfig } = useOverlayConfig()
const { character, loading, fetchCharacter } = useDDOCharacter()
const { stats, loadStats } = useOverlayStats()

const POLL_INTERVAL = 45_000

let pollTimer: ReturnType<typeof setInterval> | null = null

const formattedClasses = computed(() => {
  if (!character.value?.classes?.length) return ''
  return character.value.classes.map(c => `${c.name} ${c.level}`).join(' / ')
})

onMounted(() => {
  const route = useRoute()
  const nameFromQuery = route.query.character as string
  const serverFromQuery = route.query.server as string

  const parseParam = (val: unknown) => {
    const n = Number(val)
    return isNaN(n) || val === '' ? null : n
  }

  const lastNameFromQuery = route.query.lastname as string
  if (lastNameFromQuery) {
    config.value.lastName = lastNameFromQuery
  }

  const archetypeFromQuery = route.query.archetype as string
  if (archetypeFromQuery) {
    config.value.archetype = archetypeFromQuery
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
  width: 400px;
  height: 280px;
}

.overlay-root {
  width: 400px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: transparent;
}

/* Empty / loading */
.overlay-empty,
.overlay-loading {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 280px;
}

.rune-spin {
  font-size: 1rem;
  color: #FFD97A;
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

/* Main panel */
.overlay-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  width: 100%;
  padding: 0.5rem 0.6rem;
}

/* Name */
.char-name {
  font-family: 'Faculty Glyphic', serif;
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.04em;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.98);
  line-height: 1.3;
  white-space: nowrap;
}

.char-name.muted {
  color: #FFD97A;
}

/* Divider */
.divider {
  width: 75%;
  height: 1px;
  background: rgba(255, 217, 122, 0.6);
  margin: 0.2rem 0;
}

/* Top row */
.card-top {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: nowrap;
}

.char-identity {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.char-race,
.char-gender {
  font-family: 'Bona Nova SC', serif;
  font-size: 0.72rem;
  color: #F0E6C8;
  font-style: italic;
}

.char-archetype {
  font-family: 'Bona Nova SC', serif;
  font-style: italic;
  font-size: 0.78rem;
  color: #F0E6C8;
  flex-shrink: 0;
}

/* Detail row */
.char-detail {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.char-level {
  font-family: 'Faculty Glyphic', serif;
  font-size: 0.78rem;
  font-weight: 600;
  color: #FFD97A;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}

.char-classes {
  font-family: 'Bona Nova SC', serif;
  font-style: italic;
  font-size: 0.88rem;
  color: #F0E6C8;
  flex-shrink: 0;
}

.sep {
  font-size: 0.38rem;
  color: #FFD97A;
  flex-shrink: 0;
  line-height: 1;
}

/* Guild */
.char-guild {
  font-family: 'Bona Nova SC', serif;
  font-style: italic;
  font-size: 0.85rem;
  color: #FFD97A;
}

.char-guild-row {
  display: flex;
  align-items: center;
  margin-top: 0.1rem;
}

/* Location */
.char-location {
  font-family: 'Bona Nova SC', serif;
  font-size: 0.7rem;
  color: #E8DDB8;
  white-space: nowrap;
  flex: 1;
  text-align: center;
}

/* Stats rows */
.char-stats-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: nowrap;
  white-space: nowrap;
  margin-top: 0.12rem;
}

.stat-item {
  font-family: 'Bona Nova SC', serif;
  font-size: 0.75rem;
  color: #F0E6C8;
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.stat-label {
  font-family: 'Faculty Glyphic', serif;
  font-size: 0.52rem;
  color: #FFD97A;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* Footer row */
.char-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.12rem;
  gap: 0.4rem;
}

.server-name {
  font-family: 'Faculty Glyphic', serif;
  font-size: 0.68rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #ffffff;
}

.online-pip {
  font-size: 0.5rem;
  color: #90EE90;
  animation: pulse 2.5s ease-in-out infinite;
  flex-shrink: 0;
}

.offline-tag {
  font-family: 'Faculty Glyphic', serif;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  color: #FF9999;
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
</style>