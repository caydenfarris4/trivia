# AGENTS.md — Game Night Live

Read this first. It tells you what this project is, how each game plays and is run, how the code is laid out, and how to change or test it safely.

## 1. What this is

**Game Night Live** is a party-game-show app for **4–20 people** in one room, in the style of the quiz/geography/trivia reels on Instagram (jakelyonsgeo, bradyyourtutor, solunaaaa16 were the reference; the owner could not share formats, so these are general quiz-show formats). The goal is **fun for a group of young adults**, not pure trivia.

- One **host** logs in with their host account (§2.6) and drives a big screen (laptop on a projector/TV). It shows a hub with four games. Players never log in: like Jackbox/Kahoot they just go to the site and enter the game code the host's screen shows.
- Three games are **host-run** (the host taps names on the big screen).
- **Globe Trotters is live multiplayer**: players join on their own phones (like Kahoot/GeoGuessr).
- Sound is **synthesized in the browser** (Web Audio). There are no audio files.

It runs on **Cloudflare Workers** (the owner's existing paid Cloudflare plan), live at **https://trivia.caydenfarris.net**. The owner (a product owner, not a full-time developer) edits files on GitHub; every push to `main` is built and deployed by Cloudflare (Workers Builds). **Never put it inside any of the other repos on the machine** (`CC1`, `CC2`, `CO2`, `PaymentApi`); it is a standalone project.

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

### 2.6 Host account (login)
- The host has a real **username + password account**. The site root `/` is the normal **player** screen (enter code + name); the host goes to **`/login`** (or `/host`, which redirects there if not logged in).
- **First account only.** While no account exists, `/login` shows "Create host account" (username, password, confirm). Whoever creates the first account becomes the host, and sign-up then **closes for good** (`POST /api/signup` returns 403). Create it right after deploying. Optional hardening: set the **`SETUP_CODE`** secret and the first sign-up also needs that code, so a stranger who finds the site first can't claim it (`npx wrangler secret put SETUP_CODE`, or Cloudflare dashboard → the `trivia` Worker → Settings → Variables and Secrets).
- Usernames: 3-20 letters/numbers/`.`/`-`/`_`, case-insensitive. Passwords: 8-200 characters, stored only as **scrypt hashes** (random 16-byte salt) in the `Auth` Durable Object's storage (Cloudflare keeps it durably; it survives deploys and restarts).
- **Forgot the password?** Set the **`RESET_HOST`** secret to any value that has never been used before (e.g. today's date). The next request wipes the host account and all logins once, and sign-up reopens: create a new account. The same value never wipes twice, so you can leave the secret in place (change it to reset again).
- Login sets an `HttpOnly; SameSite=Lax` cookie (`gn_host`, 12 h; `Secure` automatically on https). Sessions are stored in the `Auth` Durable Object, so a deploy does not log the host out. After 8 wrong tries (logins or setup-code guesses) from one address (`cf-connecting-ip`) the Worker answers 429 for 10 minutes; the counters are stored, so a restart does not reset them. Wrong username and wrong password give the same error.
- What needs login: the host app (`/host`), the question banks `/banks/*.js` (they contain the answers) and `POST /api/host/new`. Everything else a host does also needs the per-game `x-token`.
- Players never have accounts: they join with the game code and a name. Only one host account exists (no multi-host/invite system yet).

## 3. How to run it

### Live site (Cloudflare)
- Everything deploys from `main` through Cloudflare **Workers Builds** (build runs `npx wrangler deploy`). The Worker is named **`trivia`** and `wrangler.jsonc` attaches the custom domain **trivia.caydenfarris.net**.
- First time on a fresh deployment: open `https://trivia.caydenfarris.net/login` and create the host account (§2.6). Optionally set the `SETUP_CODE` secret first.
- Players open `https://trivia.caydenfarris.net/`, enter the 4-digit code, and play. The host opens `/host`.
- No servers or disks to manage: game rooms and the host account live in **Durable Objects**. Needs a Workers **paid** plan: scrypt password hashing takes roughly 100 ms of CPU, more than the free plan's 10 ms per-request limit.

### On a laptop (practice / same Wi-Fi)
Requires **Node.js** (v20+). The first run downloads Wrangler (Cloudflare's local runtime) with `npm install`.

```bash
npm install        # once
npm run dev        # or double-click start.bat (also prints your Wi-Fi addresses and opens the browser)
```
- Host screen: **http://localhost:3000/host**. The first time, create the host account on that page (§2.6); it is kept in `.wrangler/state` (git-ignored). **For phones, open the host page using your computer's Wi-Fi address** (start.bat prints it, e.g. `http://192.168.1.20:3000/host`): the lobby shows whatever address the host page was opened with, and phones can't reach "localhost".
- Opening `public/index.html` by double-click (file://) still runs games 1, 3, 4 (host-run) with no login, because no server is involved. **Globe Trotters needs the Worker** and shows a "Start the game server" panel if it can't reach it.
- Internet needed for: Leaflet (cdnjs), OpenStreetMap tiles, Wikimedia photos. Everything else works offline.
- To test locally with secrets: `npx wrangler dev --var SETUP_CODE:abc` (or a git-ignored `.dev.vars` file).

### Running each game (host checklist)
1. Open the host page (`https://trivia.caydenfarris.net/host`, or `localhost:3000/host` locally) and log in, set the number of players (4–20) and optional names, press **Let's Play**. (This roster only feeds games 1, 3, 4. Globe Trotters players come from phones.)
2. Pick a card on the hub. **Menu** (top bar) returns to the hub (confirms first). **Players** edits the roster. **🔊** mutes.
3. Game-specific steps are in §2.

## 4. Repository layout

```
GameNight/
  AGENTS.md              ← this file
  README.md              ← short human-facing summary
  wrangler.jsonc         ← Cloudflare config: Worker name, custom domain, assets, Durable Objects, migrations
  package.json           ← only dependency: wrangler (dev tooling). `npm run dev` / `npm run deploy`
  start.bat              ← Windows launcher for local play
  src/worker.js          ← THE SERVER: routing + `Auth` Durable Object (host account) + `Game` Durable Object (a live game)
  public/                ← static files served through the Worker (see run_worker_first below)
    index.html           ← HOST app: hub, setup, all four games' host UIs, CSS, sound engine
    play.html            ← PLAYER page at `/`: enter code + name → (team badge) → map → result
    login.html           ← host login + first-time "create host account" page (/login)
    img/                 ← OPTIONAL local photos referenced by the CSV `image_file` column (served at /img/<file>)
    banks/
      jeopardy.js        ← window.BANKS.jeopardy  = { boards: [...] }
      spotthefake.js     ← window.BANKS.spotthefake
      crowdcontrol.js    ← window.BANKS.crowdcontrol
      globetrotters_bank.csv   ← places: id,name,country,continent,category,lat,lon,radius_km,difficulty,reveal_blurb,image_search_query,image_file,visited
      globetrotters_images.csv ← photo URLs (header-only until `fetch_images.py` is run); bundled into the Worker
      fetch_images.py    ← owner's script → writes globetrotters_images.csv (not run yet)
    .assetsignore        ← keeps the CSVs and the script out of the uploaded static files
```
Each bank `.js` file begins with a comment that documents its own format. Read it before editing.
**Secrecy:** `wrangler.jsonc` sets `assets.run_worker_first`, so *every* request hits the Worker first and only the routes listed in §5.2 are served. The bank `.js` files (answers!) need the host login; the two `.csv` files are bundled into the Worker as text and are never served at all. Do not add a catch-all asset route.

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

### 5.2 Server (`src/worker.js`, a Cloudflare Worker + two Durable Objects)
- **Worker** (default export): routes pages and `/api/*`, reads the `gn_host` cookie, forwards game traffic to the right `Game` object by the 4-digit game code, and security-headers the pages.
- **`Auth` Durable Object** (single instance, named `auth`): the host account, login sessions, login/sign-up rate limits, and the *active game code*. Methods are called over RPC (`whoami`, `signup`, `login`, `logout`, `user`, `reserveRoom`). All reads/writes are serialized by the object, so two simultaneous first sign-ups cannot both win.
- **`Game` Durable Object** (one per game code, named by the code): the whole live game: players, rounds, scores, teams, settings. State is saved to its storage after every change, so a deploy or restart does not lose the game; open Server-Sent-Event streams reconnect on their own (`EventSource` retries) and get the full snapshot. The round timer is a Durable Object **alarm** (`alarm()` ends the round if nobody did). A closed connection is only noticed on the next write, so the object sends a small keep-alive every 4 s; dropped players show as disconnected and the early round end only waits for connected players.
- Only one game is active at a time: `POST /api/host/new` asks `Auth.reserveRoom` for a new code and closes the previous game (its phones get a `closed` event).
- Every game request carries the code: `?code=1234` on the query string (or `code` in the join body). EventSource cannot set headers, so the host token for streams is `?token=`; POSTs use the `x-token` header.

Routes:
| Route | Who | Purpose |
|---|---|---|
| `GET /`, `/play`, `/play.html` | anyone | the player page (join with code) |
| `GET /login` | anyone | host login / create-account page |
| `GET /host` (also `/index.html`) | host session cookie, else 302 → `/login` | the host app |
| `GET /banks/<name>.js` | **host session cookie** (else 401) | host-run banks, they contain answers. The CSVs are never served |
| `GET /img/<file>` | anyone | Globe Trotters photos |
| `POST /api/signup` `{username,password,setupCode?}` | anyone, **only while no account exists** | creates the host account and logs in |
| `POST /api/login` `{username,password}` / `POST /api/logout` | anyone | host session (see §2.6) |
| `GET /api/whoami` | anyone | `{host,user,canSignup,needsSetupCode}` |
| `POST /api/host/new` | **host session cookie** (401 otherwise) | creates a game → `{token, code}` |
| `POST /api/host/{settings,start,reveal,next,again}?code=` | host (`x-token` header) | control the game. `settings` accepts `teams` (0 or 2–6) |
| `POST /api/host/teams?code=` `{shuffle:true}` or `{move:{pid,team}}` | host (`x-token`), lobby only | rearrange teams |
| `POST /api/join` `{code,name}` | player | → `{pid, token, name, code}`; duplicate names get a number suffix |
| `POST /api/guess?code=` `{pid,token,lat,lon,lock}` | player | updates pin; `lock:true` locks it and may end the round early. Longitude is wrapped into [-180,180) |
| `GET /api/events?code=&role=host&token=…` / `?code=&role=player&pid=…&token=…` | SSE | pushes a full state snapshot (`view(role,pid)`) on every change |

State machine: `lobby → guess → reveal → guess … → end`, with `again` returning `end/reveal → lobby`. Every phase change calls `broadcast()`. Unlocked-pin updates do **not** broadcast (only locks do).

Snapshot shape (key fields): `now, phase, code, settings, players[{id,name,color,score,locked,connected,team}], teams (null or [{id,name,color,members,score,last}]), idx, total, deadline, prompt{category,name|null,image|null}`; in `reveal` also `answer{name,country,lat,lon,radius,blurb,credit}` and `results[]`; for players `me{…,guess,last,rank,of}`; for host `categories, count`. Clients compute countdowns from `deadline` and the `now` offset (`off = st.now - Date.now()`), so device clock skew doesn't matter. The join address shown in the lobby is the host page's own `location.origin`.

The Globe Trotters bank is parsed once when the Worker starts, so **editing the CSV needs a deploy** (a push to `main`). The Worker drops rows without valid `lat`/`lon`.

### 5.3 Phone app (`play.html`)
Sections `s-join`, `s-wait`, `s-play`, `s-end`. One Leaflet map instance reused each round (`layer` cleared). Stores `{pid,token,name,code}` in `localStorage` (`gt.me`) to reconnect after a refresh; a `closed` event clears it.

## 6. Editing content

- **Jeopardy:** the source CSV is `game,category,points,clue,answer`, with `Final` as the points value and a `Final Jeopardy: <topic>` category for each game's final. A one-off converter was used to produce `public/banks/jeopardy.js`; to regenerate from a new CSV, parse it the same way (respect quoted commas) and write `{boards:[{name,dailyDoubles,categories:[{name,clues:[{v,q,a}]}],final:{category,q,a}}]}`.
- **Spot the Fake / Crowd Control:** edit the arrays in the bank files; formats are in each file's header.
- **Globe Trotters:** edit `public/banks/globetrotters_bank.csv`. `radius_km` is the "close enough" zone (0 penalty inside it). Optional photos: `cd public/banks && python fetch_images.py` (set a real contact email in its User-Agent first; needs `pip install requests` and internet), then review the output because the top Wikipedia hit isn't always the right picture. Override one with a file in `public/img/` and its filename in `image_file`.
- **Accuracy rule (owner requirement):** content you write (Spot the Fake, Crowd Control, blurbs) must be factually right. Prefer stable facts; avoid anything that changes yearly. Do **not** silently change the owner's clues; flag doubts instead. Known unverified owner clues (Game 3 Reality TV: *The Traitors: New Blood*, Survivor 51 "blood ring", Rob Rausch winning Traitors S4) were reported to the owner for checking.

## 7. Testing

There is no test suite in the repo. The checks used so far all run against `npx wrangler dev --local --port 3055 --persist-to <temp dir>` (fresh temp dir each time = fresh database), plus Playwright for the browser parts:
1. **Server logic** (Node script): `/api/host/new` after logging in, join players, open SSE streams, settings/start, guesses incl. lon wrap, reveal, check `results[].pts` against the formula computed independently, player view has no `answer` during `guess`, host action without a token → 403, `/banks/globetrotters_bank.csv` → 404.
2. **Durable Object behaviour**: a round ends by itself via the alarm (use the 15 s minimum), a closed connection marks a player disconnected (within a few seconds) and the early end then ignores them, and the game survives restarting `wrangler dev` with the same `--persist-to` dir.
3. **Accounts**: first-account-only (incl. two simultaneous sign-ups), persistence across restarts, `RESET_HOST`, `SETUP_CODE`, rate limits surviving restarts, no plaintext password in the stored files, the Secure cookie flag over `--local-protocol https`.
4. **Host UI** (Playwright): log in, then drive games 1/3/4 by calling `document.querySelector('[data-act=…]').click()`; assert scoring against an independent model and that `S.screen==='results'`.
5. **Phone UI** (Playwright, mobile viewport): join with the lobby code, tap the map, press `#lock`. In a sandbox that blocks the Leaflet CDN, stub `window.L` (route `cdnjs.cloudflare.com/**/leaflet.js`) and fire `map.fire('click',{latlng})`; that checks the app logic but **not** real map rendering.
6. `npx wrangler deploy --dry-run` builds the exact bundle Cloudflare will deploy (catches config/import errors).
Tips: `wrangler dev` rewrites the request's host name to the route in `wrangler.jsonc`, so never derive URLs from `request.url` host; local requests have no `cf-connecting-ip` (all share the rate-limit key `unknown`). Stop test servers by their process group, not with `pkill -f` patterns that also match your own shell.

## 8. Gotchas and decisions

- Single `index.html` on purpose (the owner edits files on GitHub's web UI). Keep it dependency-free and build-free; only Leaflet comes from a CDN.
- `file://` works for host-run games but not for Globe Trotters (needs `/api`).
- Audio/mute: browsers block sound until a click; the first hub click enables it.
- `qhead` header rows wrap on narrow screens (host window can be small).
- Globe Trotters players list comes from the server. The host's 4–20 roster is separate and only used by games 1, 3, 4.
- Early round end waits only for **connected** players; if someone's phone drops, others locking ends the round. Because a dropped connection is only noticed on the next write, the Game object sends a keep-alive every 4 s.
- Don't add speed-based scoring, player accounts, or an external database unless asked. The only account is the single **host** account (§2.6, stored in the Auth Durable Object); players join with a code and name.
- Never serve the answers: `/banks/*.js` is behind the host login and the CSVs are bundled, not served. Keep `run_worker_first` on.
- Changing a Durable Object class name or deleting one needs a new `migrations` entry in `wrangler.jsonc`; adding fields to the saved state is fine (old games just lack them).
- The old Node `server.js` was removed when moving to Workers (it's in git history, commit `776d431`, if ever needed).
- Git: this is a GitHub repo (`caydenfarris4/trivia`). Work on the designated feature branch; open a pull request only when the owner asks. **Merging to `main` deploys to the live site** (Workers Builds), so confirm before merging.

## 9. Open items / ideas (not started)
- Team scoring option "average per member" (sum penalises smaller teams).
- Host resume after a page refresh or re-login (a refresh still creates a new room; the old game's code stops working).
- Move the Auth/Game data to a nicer admin view, rate-limit joins, scheduled cleanup of old game objects (finished games are replaced, not deleted, until the next game starts).
- Change-password screen, and more than one host account (invite).
- Run `fetch_images.py`, review photos, add `globetrotters_images.csv`.
- Optional speed bonus (Kahoot-style) in `endRound` scoring.
- QR code for the join address in the Globe Trotters lobby.
- Let phones also join Spot the Fake / Crowd Control (currently host-run).
