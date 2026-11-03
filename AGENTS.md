# AGENTS.md — Game Night Live

Read this first. It tells you what this project is, how each game plays and is run, how the code is laid out, and how to change or test it safely.

## 1. What this is

**Game Night Live** is a party-game-show app for **4–20 people** in one room, in the style of the quiz/geography/trivia reels on Instagram (jakelyonsgeo, bradyyourtutor, solunaaaa16 were the reference; the owner could not share formats, so these are general quiz-show formats). The goal is **fun for a group of young adults**, not pure trivia.

- One **host** logs in with a shared password (§2.6) and drives a big screen (laptop on a projector/TV). It shows a hub with four games. Players never log in: like Jackbox/Kahoot they just go to the site and enter the game code the host's screen shows.
- Three games are **host-run** (the host taps names on the big screen).
- **Globe Trotters is live multiplayer**: players join on their own phones (like Kahoot/GeoGuessr).
- Sound is **synthesized in the browser** (Web Audio). There are no audio files.

The owner (a product owner, not a full-time developer) uploads this folder to GitHub as-is. **Never put it inside any of the other repos on the machine** (`CC1`, `CC2`, `CO2`, `PaymentApi`); it is a standalone project.

## 2. The four games

| # | Game | Type | Source of content |
|---|------|------|-------------------|
| 1 | **The Big Board** (Jeopardy-style) | host-run | `banks/jeopardy.js` — four full boards from the owner's CSV |
| 2 | **Globe Trotters** (GeoGuessr/Kahoot-style) | **live, phones join** | `banks/globetrotters_bank.csv` (owner's), optional `banks/globetrotters_images.csv` |
| 3 | **Spot the Fake** (two truths and a lie) | host-run | `banks/spotthefake.js` — written by Claude, fact-checked |
| 4 | **Crowd Control** (Would You Rather + Most Likely To) | host-run | `banks/crowdcontrol.js` — written by Claude |

Games 3 and 4 replaced earlier pure-trivia games (Last One Standing, Higher or Lower) at the owner's request. Don't bring them back unless asked. The old clue-based geography game was also replaced by the live Globe Trotters.

### 2.1 The Big Board
- Menu shows the four boards (tagged NEW / PLAYED via `localStorage` key `gn.jp.played`).
- Each board: 5 categories × 5 clues ($200–$1000), one hidden **Daily Double** (never on the $200 row), and a **Final** round.
- Turn: the player in control picks a tile → clue shows → host taps who buzzed → **✓ Correct** (+value, that player gets control) or **✗ Wrong** (−value, locked out of this clue). **Nobody — show answer** reveals without scoring. Optional 15s timer button plays "think" music.
- Daily Double: only the player in control, wager 5…max(score, 1000).
- Final: secret wagers entered by host → clue + 30s timer → reveal → host cycles each player's mark (unmarked → ✓ → ✗) → apply → podium.
- Scores can go negative. Chips in the footer show `$`.

### 2.2 Globe Trotters (live)
Flow: **lobby → (guess → reveal) × N → end**.
1. Host opens the game. The server creates a room and shows the **4-digit code** and the join address (LAN IP).
2. Players open that address on their phone (`/` serves `play.html`), type code + name. 4–20 players (`max` setting).
3. Host picks rounds (dropdown: 5, 8, 10, 15, 20), seconds (dropdown: 20, 30, 45, 60, 90), category, hide-name toggle, then **Start**. The server accepts wider values than the dropdowns offer (rounds 3–30, seconds 15–180, max players 4–20) and clamps anything outside that range.
4. Each round the place (name + category, and a photo if available) goes to every phone. Players tap a map to drop/move a pin and press **Lock in**. The round ends when the timer ends **or every connected player has locked**. A placed-but-unlocked pin still counts at timeout.
5. Reveal: host screen shows a Leaflet map with the answer (⭐ + radius circle), all pins, dashed lines, a ranked list, the blurb and photo credit. Phones show their own distance, points and rank. The host clicks **Next Round ▸** to send the next place.
6. After the last round: podium on the host screen, final rank on phones. **Play Again** returns to the lobby with the same players and zeroed scores.

**Scoring (owner-specified, do not change without asking):**
```
score = round(5000 * exp(-max(0, dist_km - radius_km) / 1500))
```
`dist_km` is great-circle (haversine, R = 6371). `radius_km` comes from the CSV so big places (Sahara) are forgiving. **Speed does not affect score** (the formula is distance only). A speed bonus was offered but not requested.

The answer's coordinates are **never sent to clients before the reveal**. Keep it that way.

### 2.3 Spot the Fake
3 statements per round (2 true, 1 fake), shuffled. 25s timer. Players hold up 1/2/3 fingers. Host reveals, the fake is highlighted, the `why` text explains the truth, host taps everyone who spotted it (+100 each; **Everyone** / **Nobody** shortcuts). 10 rounds per game (`perGame`).

### 2.4 Crowd Control
14 rounds per game, mixed:
- **Would You Rather**: host taps players who chose A (rest = B). Majority scores 100. If `flip: true` it's an **UNDERDOG** round: the **minority** scores 200. Ties score nothing.
- **Most Likely To…**: everyone points on 3; host taps the player with the most fingers pointed at them, who is crowned (+100).

### 2.5 Teams (all four games)
Optional. The host picks **No teams** or **2–6 teams** (Red, Blue, Green, Gold, Purple, Orange).
- **Team score = the sum of its members' scores** in every game. (Uneven team sizes therefore favour the bigger team; an average-per-member option has not been built.)
- **Host-run games (1, 3, 4):** choose "Split everyone into N teams" on the setup screen (`roster.teams`, saved in `localStorage`). On the hub a **Teams panel** shows each team's members: tap a player to move them to the next team, or press **Shuffle teams**. Assignment is random round-robin over a shuffle, so team sizes differ by at most 1. Players keep their team across games until the roster is edited or shuffled.
- **Globe Trotters (live):** a **Teams** dropdown in the lobby (it starts from the setup-screen choice). The server (`assignTeams`) splits players; people who join late go to the smallest team. The host can move/shuffle **only in the lobby** (locked once the game starts). Phones show a team badge in the waiting room, a coloured top bar, their team's rank/points after each round, and team rank at the end. The host reveal screen lists team rows (total + this round) above the player rows.
- Scoreboard: a coloured team row sits above the player chips. Podium: **Team standings** first, then **Top players** (top 5 individuals).
- Teams are the same four-game feature everywhere; scoring rules of each game are unchanged.

### 2.6 Host login
- The host signs in at **`/login`** (or `/host`, which redirects there) with ONE shared password. Set it with the **`HOST_PASSWORD` environment variable**. If it is not set the server generates a random one on every start and prints it in the console (fine for a laptop; on a deployed server set it explicitly, otherwise it changes on each deploy).
- Login sets an `HttpOnly; SameSite=Lax` cookie (`gn_host`, 12 h; `Secure` automatically behind an https proxy via `x-forwarded-proto`). Sessions are in memory, so a server restart logs the host out. After 8 wrong tries from one address the server answers 429 for 10 minutes.
- What needs login: the host app (`/host`), the question banks `/banks/*.js` (they contain the answers), and `POST /api/host/new`. Everything else a host does also needs the per-game `x-token`.
- The site root **`/`** is the player page: enter the 4-digit code + a name. It has a small "Host login" link.
- There are no player accounts, usernames or database. Don't add them unless asked.

## 3. How to run it

Requires **Node.js** (any recent version; v25 was used). **No `npm install`: there are zero dependencies.**

```bash
node server.js            # or double-click start.bat (opens the browser too)
```
- Host screen: **http://localhost:3000/host** (start.bat opens it). You log in with `HOST_PASSWORD` (or the random password printed in the console). Example: `HOST_PASSWORD=mysecret node server.js`.
- Players: the address shown in the Globe Trotters lobby (on a laptop that is the LAN address, e.g. `http://192.168.x.x:3000`; on a deployment it is the site's own address, e.g. `https://trivia.caydenfarris.net`), then the code.
- Change port with `PORT=3055 node server.js`.
- Opening `index.html` by double-click (file://) still runs games 1, 3, 4 (host-run) with no login, because no server is involved. **Globe Trotters needs the server** and shows a "Start the game server" panel if it can't reach it.
- Internet needed for: Leaflet (cdnjs), OpenStreetMap tiles, Wikimedia photos. Everything else works offline.
- **Internet play** is supported: run `server.js` on any Node host (it reads `PORT` and `HOST_PASSWORD`) behind https. The host opens `https://<site>/host`, logs in, and players open `https://<site>/` and enter the code. The owner's deployment is **trivia.caydenfarris.net** (set `HOST_PASSWORD` in the host's environment settings; make sure the proxy supports Server-Sent Events, i.e. does not buffer `/api/events`).

### Running each game (host checklist)
1. Start the server, open `localhost:3000/host` and log in, set the number of players (4–20) and optional names, press **Let's Play**. (This roster only feeds games 1, 3, 4. Globe Trotters players come from phones.)
2. Pick a card on the hub. **Menu** (top bar) returns to the hub (confirms first). **Players** edits the roster. **🔊** mutes.
3. Game-specific steps are in §2.

## 4. Repository layout

```
GameNight/
  AGENTS.md              ← this file
  README.md              ← short human-facing summary
  start.bat              ← Windows launcher (checks Node, opens browser, runs server)
  server.js              ← Node server: host login, static files, Globe Trotters room/API + teams (zero deps)
  login.html             ← host password page (/login)
  index.html             ← HOST app: hub, setup, all four games' host UIs, CSS, sound engine
  play.html              ← PLAYER page at `/`: enter code + name → (team badge) → map → result
  banks/
    jeopardy.js          ← window.BANKS.jeopardy  = { boards: [...] }
    spotthefake.js       ← window.BANKS.spotthefake
    crowdcontrol.js      ← window.BANKS.crowdcontrol
    globetrotters_bank.csv   ← places: id,name,country,continent,category,lat,lon,radius_km,difficulty,reveal_blurb,image_search_query,image_file,visited
    fetch_images.py      ← owner's script → writes globetrotters_images.csv (not run yet)
    globetrotters_images.csv ← OPTIONAL, generated; server auto-loads if present
    images/              ← OPTIONAL local photos referenced by the CSV `image_file` column
```
Each bank `.js` file begins with a comment that documents its own format. Read it before editing.

## 5. Architecture

### 5.1 Host app (`index.html`, one file, vanilla JS, no build)
Globals and conventions:
- `S.screen` — current screen name (`setup`, `hub`, `jp-menu`, `jp-board`, `jp-clue`, `jp-final`, `gt`, `sf`, `cc`, `results`). `inGame()` = screen matches `/^(jp|gt|sf|cc)/` or `results`.
- `G` — state of the running game (`G.g` is `jp|gt|sf|cc`). `players` — the roster `{id,name,color,score,out,streak}`. `G.lp` (if set) overrides the scoreboard list; Globe Trotters sets it from the server.
- **Event delegation:** every clickable has `data-act="name"`; one `document` click listener calls `ACT[name](el)`. Selects/checkboxes use `data-chg` and the `CHG` map. Add a new button = add `data-act` in the HTML string and a function in `ACT`.
- Rendering is string templates → `$('#view').innerHTML`. Call `renderBoard()` after any score change (the bottom chip scoreboard).
- Always `esc()` bank text before inserting into HTML.
- **Modules:** `JP`, `GT`, `SF`, `CC` (one object per game, each with start/round/draw). `finish(title)` shows the podium + confetti + win fanfare for any game (`replay` action restarts the game; for Globe Trotters it calls `GT.again()`).
- `T` = shared countdown timer (`T.start(sec,{onEnd,tickFrom})`, `T.html(sec)` renders the bar with ids `#tfill`/`#tnum`). `T.stop()` before leaving a screen.
- `Snd` = Web Audio engine. Loops: `lobby`, `groove`, `think`, `hurry` (`Snd.loop(name)`, `Snd.stop()`). Effects via `Snd.play(name)`: `correct wrong buzz tick tickHi timeup reveal dd out pick win`. Audio only starts after the first click (browser rule); `Snd.init()` runs in the click listener.
- Persistence (`localStorage`, always try/catch): `gn.roster` (player count + names), `gn.jp.played` (which boards were finished).
- Colors: player i gets `hsl(i*137.508 mod 360, 78%, 58%)` (golden angle) — the server uses the same formula so host and phones agree.

### 5.2 Server (`server.js`)
One in-memory **room** at a time. Starting Globe Trotters on the host (`POST /api/host/new`) discards any previous room.

Routes:
| Route | Who | Purpose |
|---|---|---|
| `GET /`, `/play`, `/play.html` | anyone | the player page (join with code) |
| `GET /login` | anyone | host password page |
| `GET /host` (also `/index.html`) | host session cookie, else 302 → `/login` | the host app |
| `GET /banks/<name>.js` | **host session cookie** (else 401) | host-run banks, they contain answers. `/banks/*.csv` is never served |
| `GET /img/<file>` | anyone | Globe Trotters photos |
| `POST /api/login` `{password}` / `POST /api/logout` / `GET /api/whoami` | anyone | host session (see §2.6) |
| `POST /api/host/new` | **host session cookie** (401 otherwise) | creates room → `{token, code, urls}`. `urls` = the address the host used (e.g. `https://trivia.caydenfarris.net`), or the LAN addresses when opened via localhost |
| `POST /api/host/{settings,start,reveal,next,again}` | host (`x-token` header) | control the game. `settings` accepts `teams` (0 or 2–6) |
| `POST /api/host/teams` `{shuffle:true}` or `{move:{pid,team}}` | host (`x-token`), lobby only | rearrange teams |
| `POST /api/join` `{code,name}` | player | → `{pid, token, name}`; duplicate names get a number suffix |
| `POST /api/guess` `{pid,token,lat,lon,lock}` | player | updates pin; `lock:true` locks it and may end the round early. Longitude is wrapped into [-180,180) |
| `GET /api/events?role=host&token=…` / `?role=player&pid=…&token=…` | SSE | pushes a full state snapshot (`view(role,pid)`) on every change |

State machine: `lobby → guess → reveal → guess … → end`, with `again` returning `end/reveal → lobby`. Every phase change calls `broadcast()`. Unlocked-pin updates do **not** broadcast (only locks do).

Snapshot shape (key fields): `now, phase, code, settings, players[{id,name,color,score,locked,connected,team}], teams (null or [{id,name,color,members,score,last}]), idx, total, deadline, prompt{category,name|null,image|null}`; in `reveal` also `answer{name,country,lat,lon,radius,blurb,credit}` and `results[]`; for players `me{…,guess,last,rank,of}`; for host `urls, categories, count`. Clients compute countdowns from `deadline` and the `now` offset (`off = st.now - Date.now()`), so device clock skew doesn't matter.

Banks are re-read on every `start`, so editing the CSV needs no restart. The server drops rows without valid `lat`/`lon`.

### 5.3 Phone app (`play.html`)
Sections `s-join`, `s-wait`, `s-play`, `s-end`. One Leaflet map instance reused each round (`layer` cleared). Stores `{pid,token,name}` in `localStorage` (`gt.me`) to reconnect after a refresh; a `closed` event clears it.

## 6. Editing content

- **Jeopardy:** the source CSV is `game,category,points,clue,answer`, with `Final` as the points value and a `Final Jeopardy: <topic>` category for each game's final. A one-off converter was used to produce `banks/jeopardy.js`; to regenerate from a new CSV, parse it the same way (respect quoted commas) and write `{boards:[{name,dailyDoubles,categories:[{name,clues:[{v,q,a}]}],final:{category,q,a}}]}`.
- **Spot the Fake / Crowd Control:** edit the arrays in the bank files; formats are in each file's header.
- **Globe Trotters:** edit `banks/globetrotters_bank.csv`. `radius_km` is the "close enough" zone (0 penalty inside it). Optional photos: `cd banks && python fetch_images.py` (set a real contact email in its User-Agent first; needs `pip install requests` and internet), then review the output because the top Wikipedia hit isn't always the right picture. Override one with a file in `banks/images/` and its filename in `image_file`.
- **Accuracy rule (owner requirement):** content you write (Spot the Fake, Crowd Control, blurbs) must be factually right. Prefer stable facts; avoid anything that changes yearly. Do **not** silently change the owner's clues; flag doubts instead. Known unverified owner clues (Game 3 Reality TV: *The Traitors: New Blood*, Survivor 51 "blood ring", Rob Rausch winning Traitors S4) were reported to the owner for checking.

## 7. Testing

There is no test suite. The checks used so far:
1. **Server logic** — scripted Node client (use `PORT=3055 node server.js`): `POST /api/host/new`, join 3 players over `/api/join`, open SSE streams, `settings`/`start`, guesses incl. lon wrap, `reveal`, verify `results[].pts` equals the formula computed independently, confirm the player view has no `answer` during `guess`, confirm `/api/host/start` without a token → 403 and `/banks/globetrotters_bank.csv` → 404, play to `end`, then `again`.
2. **Host UI** — serve over HTTP (the browser tool can't script `file://` pages), then drive it with `document.querySelector('[data-act=…]').click()`; `confirm`/`alert` can be stubbed. For games 1/3/4 loop through rounds clicking the `data-act` buttons and assert `S.screen==='results'`.
3. **Phone UI** — open `/play` in a second tab (mobile viewport), join with the lobby code, tap the map, press `#lock`.
Remember to stop test servers (`Get-NetTCPConnection -LocalPort <port>` → `Stop-Process`) and reset browser viewport emulation.

## 8. Gotchas and decisions

- Single `index.html` on purpose (owner uploads folder files to GitHub by hand). Keep it dependency-free; only Leaflet comes from a CDN.
- `file://` works for host-run games but not for Globe Trotters (needs `/api`).
- Audio/mute: browsers block sound until a click; the first hub click enables it.
- `qhead` header rows wrap on narrow screens (host window can be small).
- Globe Trotters players list comes from the server. The host's 4–20 roster is separate and only used by games 1, 3, 4.
- Early round end waits only for **connected** players; if someone's phone drops, others locking ends the round.
- Don't add speed-based scoring, player accounts, or a database unless asked. The only login is the single shared **host** password (§2.6); players join with a code and name.
- Git: this is a GitHub repo (`caydenfarris4/trivia`). Work on the designated feature branch; open a pull request only when the owner asks.

## 9. Open items / ideas (not started)
- Team scoring option "average per member" (sum penalises smaller teams).
- Host resume after refresh / re-login (a refresh still creates a new room).
- Run `fetch_images.py`, review photos, add `globetrotters_images.csv`.
- Optional speed bonus (Kahoot-style) in `endRound` scoring.
- QR code for the join address in the Globe Trotters lobby.
- Reconnect/resume for the **host** after a page refresh (currently a refresh creates a new room).
- Let phones also join Spot the Fake / Crowd Control (currently host-run).
