export interface DDOCharacter {
  name: string
  gender?: string
  race?: string
  server_name: string
  guild_name?: string
  home_server_name?: string
  location_id?: number
  area_name?: string
  area_region?: string
  classes?: Array<{
    name: string
    level: number
  }>
  total_level?: number
  last_update?: string
  is_online?: boolean
  is_anonymous?: boolean
  is_in_party?: boolean
}

export interface OverlayConfig {
  characterName: string
  server: string
}

export const DDO_SERVERS = [
  'Shadowdale',
  'Cormyr',
  'Thrane',
  'Moonsea',
] as const

export type DDOServer = typeof DDO_SERVERS[number]

const CONFIG_KEY = 'ddo-overlay-config'

export function useOverlayConfig() {
  const config = useState<OverlayConfig>('overlay-config', () => ({
    characterName: '',
    server: 'Shadowdale',
  }))

  function loadConfig() {
    if (!import.meta.client) return
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as OverlayConfig
        config.value = parsed
      } catch {
        // ignore malformed storage
      }
    }
  }

  function saveConfig(newConfig: OverlayConfig) {
    if (!import.meta.client) return
    config.value = newConfig
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig))
  }

  return { config, loadConfig, saveConfig }
}

export function useDDOCharacter() {
  const character = useState<DDOCharacter | null>('ddo-character', () => null)
  const loading = useState<boolean>('ddo-loading', () => false)
  const error = useState<string | null>('ddo-error', () => null)
  const lastFetched = useState<Date | null>('ddo-last-fetched', () => null)

  async function fetchCharacter(server: string, name: string) {
    if (!name || !server) return

    loading.value = true
    error.value = null

    try {
      const serverLower = server.toLowerCase()
      const nameLower = name.toLowerCase()
      const res = await fetch(
        `https://api.ddoaudit.com/v1/characters/${serverLower}/${nameLower}`
      )

      if (!res.ok) {
        if (res.status === 404) {
          error.value = `Character "${name}" not found on ${server}.`
        } else {
          error.value = `API error: ${res.status}`
        }
        character.value = null
        return
      }

      const data = await res.json()
      const charData: DDOCharacter = data?.data ?? data

      character.value = {
        ...charData,
        is_online: charData.is_online ?? true,
      }

      // fetch area name if we have a location_id
      if (charData.location_id) {
        try {
          const areaRes = await fetch(
            `https://api.ddoaudit.com/v1/areas/${charData.location_id}`
          )
          if (areaRes.ok) {
            const areaData = await areaRes.json()
            const area = areaData?.data ?? areaData
            if (character.value) {
              character.value = {
                ...character.value,
                area_name: area?.name ?? String(charData.location_id),
                area_region: area?.region ?? '',
              }
            }
          }
        } catch {
          // area fetch failed, leave area_name undefined
        }
      }

      lastFetched.value = new Date()
    } catch (e) {
      error.value = 'Could not reach DDO Audit API.'
      character.value = null
    } finally {
      loading.value = false
    }
  }

  return { character, loading, error, lastFetched, fetchCharacter }
}

export interface DDOStats {
  hp: number | null
  sp: number | null
  ac: number | null
  rp: number | null
  str: number | null
  dex: number | null
  con: number | null
  int: number | null
  wis: number | null
  cha: number | null
}

const STATS_KEY = 'ddo-overlay-stats'

export function useOverlayStats() {
  const stats = useState<DDOStats>('overlay-stats', () => ({
    hp: null, sp: null, ac: null, rp: null,
    str: null, dex: null, con: null, int: null, wis: null, cha: null,
  }))

  function loadStats() {
    if (!import.meta.client) return
    const stored = localStorage.getItem(STATS_KEY)
    if (stored) {
      try {
        stats.value = JSON.parse(stored) as DDOStats
      } catch {
        // ignore
      }
    }
  }

  function saveStats(newStats: DDOStats) {
    if (!import.meta.client) return
    stats.value = newStats
    localStorage.setItem(STATS_KEY, JSON.stringify(newStats))
  }

  return { stats, loadStats, saveStats }
}