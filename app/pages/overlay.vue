<template>
  <div class="overlay-root">
    <!-- Loading state -->
    <div v-if="loading && !character" class="overlay-card loading-card">
      <div class="rune-spin">+</div>
    </div>

    <!-- Error / not configured -->
    <div v-else-if="!config.characterName" class="overlay-card error-card">
      <span class="error-text">No character configured — visit /config</span>
    </div>

    <!-- Character offline -->
    <div v-else-if="character && !character.is_online" class="overlay-card offline-card">
      <div class="char-name">{{ character.name }}</div>
      <div class="offline-tag">○ Offline</div>
    </div>

    <!-- Main character card -->
    <div v-else-if="character" class="overlay-card char-card">
      <!-- Top bar: name + online pip -->
      <div class="card-top">
        <div class="char-name">{{ character.name }}</div>
        <div class="online-pip" title="Online">●</div>
      </div>

      <!-- Level / Classes -->
      <div class="char-meta">
        <span v-if="character.total_level" class="char-level">
          Lvl {{ character.total_level }}
        </span>
        <span v-if="formattedClasses" class="char-classes">
          {{ formattedClasses }}
        </span>
      </div>

      <!-- Guild -->
      <div v-if="character.guild_name" class="char-guild">
        <span class="guild-icon">⚜</span>{{ character.guild_name }}
      </div>

      <!-- Location -->
      <div v-if="character.location?.name" class="char-location">
        <span class="loc-icon">◈</span>{{ character.location.name }}
      </div>

      <!-- Divider + server -->
      <div class="card-footer">
        <span class="server-name">{{ config.server }}</span>
        <span class="last-update" v-if="lastFetched">
          {{ timeAgo }}
        </span>
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
/* OBS overlay — transparent bg, no scrollbars */
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
  height: 220px;
  font-size: 1rem;
}

.overlay-root {
  width: 400px;
  height: 220px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 0;
  background: transparent;
}

/* ── Base card ── */
.overlay-card {
  position: relative;
  width: 340px;
  background:
    linear-gradient(135deg, rgba(26, 18, 8, 0.97) 0%, rgba(42, 30, 16, 0.95) 100%);
  border: 1px solid rgba(201, 168, 76, 0.55);
  border-radius: 4px;
  padding: 0.75rem 1rem;
  overflow: hidden;
  backdrop-filter: blur(2px);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.7),
    inset 0 1px 0 rgba(201, 168, 76, 0.15);
}

/* inner border flourish */
.overlay-card::before {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(201, 168, 76, 0.12);
  border-radius: 2px;
  pointer-events: none;
}

/* top-left decorative corner */
.overlay-card::after {
  content: '✦';
  position: absolute;
  top: 5px;
  right: 8px;
  font-size: 0.55rem;
  color: rgba(201, 168, 76, 0.3);
  pointer-events: none;
}

/* ── Loading ── */
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

/* ── Error ─── */
.error-card {
  padding: 0.6rem 1rem;
}

.error-text {
  font-family: 'IM Fell English', Georgia, serif;
  font-style: italic;
  font-size: 0.8rem;
  color: rgba(201, 168, 76, 0.5);
}

/* ── Offline ── */
.offline-card .char-name {
  font-family: 'Cinzel', serif;
  font-size: 1.1rem;
  color: rgba(201, 168, 76, 0.5);
  margin-bottom: 0.2rem;
}

.offline-tag {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  color: rgba(200, 120, 120, 0.7);
  letter-spacing: 0.05em;
}

/* ── Main card ── */
.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.char-name {
  font-family: 'Cinzel', serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #e8c97a;
  letter-spacing: 0.03em;
  text-shadow: 0 1px 6px rgba(201, 168, 76, 0.3);
  line-height: 1.2;
}

.online-pip {
  font-size: 0.6rem;
  color: #7ac97a;
  text-shadow: 0 0 6px rgba(122, 201, 122, 0.6);
  animation: pulse 2.5s ease-in-out infinite;
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

.char-meta {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  margin-bottom: 0.3rem;
  flex-wrap: wrap;
}

.char-level {
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  font-weight: 600;
  color: #c9a84c;
  letter-spacing: 0.08em;
  background: rgba(201, 168, 76, 0.1);
  border: 1px solid rgba(201, 168, 76, 0.25);
  border-radius: 2px;
  padding: 0.05rem 0.4rem;
}

.char-classes {
  font-family: 'IM Fell English', Georgia, serif;
  font-style: italic;
  font-size: 0.85rem;
  color: #d4c49a;
}

.char-guild {
  font-family: 'IM Fell English', Georgia, serif;
  font-size: 0.8rem;
  color: rgba(201, 168, 76, 0.7);
  margin-bottom: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.guild-icon {
  font-size: 0.65rem;
}

.char-location {
  font-family: 'IM Fell English', Georgia, serif;
  font-size: 0.82rem;
  color: #b0a07a;
  margin-bottom: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;

  /* truncate long dungeon names */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.loc-icon {
  flex-shrink: 0;
  font-size: 0.7rem;
  color: rgba(201, 168, 76, 0.5);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(201, 168, 76, 0.15);
  padding-top: 0.35rem;
  margin-top: 0.1rem;
}

.server-name {
  font-family: 'Cinzel', serif;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(201, 168, 76, 0.45);
}

.last-update {
  font-family: 'IM Fell English', Georgia, serif;
  font-size: 0.65rem;
  color: rgba(201, 168, 76, 0.3);
  font-style: italic;
}
</style>