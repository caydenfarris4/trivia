# Game Night Live

Four party games for 4–20 people, played on one big screen.

## Run it
1. Install [Node.js](https://nodejs.org) (any recent version, no `npm install` needed).
2. Double-click **start.bat** (or run `node server.js`). Your browser opens the host screen at http://localhost:3000.
3. Leave the black window open while you play.

## The games
| Game | How it plays |
|---|---|
| **The Big Board** | Host-run Jeopardy. Four boards from `banks/jeopardy.js`. |
| **Globe Trotters** | **Live, like Kahoot/GeoGuessr.** Players open the address shown on the host screen on their phones, enter the 4-digit code and a name. The host clicks *Start* / *Next Round*, the place goes out to every phone at once, and everyone drops a pin before the timer runs out. Score = `round(5000 * exp(-max(0, dist_km - radius_km) / 1500))`. The round ends early when everyone has locked in. |
| **Spot the Fake** | Two truths and a lie. Host taps who spotted it. |
| **Crowd Control** | Would-you-rather and Most Likely To. |

Phones must be on the **same Wi-Fi** as the host computer (guest networks sometimes block this). For play over the internet, run `server.js` on any Node host (Render, Fly, a VPS) and share its address.

## Globe Trotters banks
- `banks/globetrotters_bank.csv` — the places (answers never leave the server until the reveal).
- Photos: run `cd banks` then `python fetch_images.py` (edit the email in the User-Agent first). It writes `banks/globetrotters_images.csv`, which the server picks up automatically. Check the photos, and to override one, put your own file in `banks/images/` and write its filename in the `image_file` column.
- With no photos, players see the place name and category instead. In the lobby, *Hide the name* makes a place photo-only.

## Other banks
`banks/jeopardy.js`, `banks/spotthefake.js`, `banks/crowdcontrol.js` — formats are documented at the top of each file.
