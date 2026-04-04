# ddo-overlay

OBS browser source overlay for DDO characters, powered by the DDO Audit API.

## Pages

| URL | Purpose |
| ----- | --------- |
| `/config` | Set your character name & server, preview the card, get the OBS URL |
| `/overlay` | The actual OBS browser source (transparent background) |

## Setup

```bash
npm install
npm run dev
```

Then open `http://localhost:3000/config` in your browser.

## Changing Characters

1. Open `/config` in your browser
2. Pick the server from the dropdown (Shadowdale, Cormyr, Thrane, Moonsea)
3. Type the character name
4. Click **Save & Preview** — it will fetch live data and show you the card
5. OBS browser source auto-refreshes from `localStorage` on next scene load

No redeployment needed. The overlay page reads from `localStorage` on mount.

## OBS Browser Source Settings

- **URL**: `https://your-netlify-url.netlify.app/overlay`
- **Width**: 400
- **Height**: 220
- ✅ Shutdown source when not visible
- ✅ Refresh browser when scene becomes active
- **Custom CSS**: *(leave blank — transparency is handled in the page)*

## What data shows

DDO Audit provides (when available):

- Character name
- Total level
- Classes & levels (e.g. `Fighter 10 / Rogue 4`)
- Guild name
- Current location / dungeon
- Online status

DDO Audit does **not** expose HP, SP, inventory, or combat stats — those aren't in the public API.

## Poll interval

The overlay polls DDO Audit every **45 seconds**. You can adjust `POLL_INTERVAL` in `app/pages/overlay.vue`.

## Deploy

Push to GitHub, connect to Netlify. Build command and publish dir are in `netlify.toml`.
