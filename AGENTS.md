# AGENTS.md — Game Night Live

Read this first. It tells you what this project is, how each game plays and is run, how the code is laid out, and how to change or test it safely.

## 1. What this is

**Game Night Live** is a party-game-show app for **4–20 people** in one room, in the style of the quiz/geography/trivia reels on Instagram (jakelyonsgeo, bradyyourtutor, solunaaaa16 were the reference; the owner could not share formats, so these are general quiz-show formats). The goal is **fun for a group of young adults**, not pure trivia.

- One **host** logs in with their host account (§2.6) and drives a big screen (laptop on a projector/TV). **The host picks the game first** (setup screen), and the random 4-digit code that opens is **for that one game**: players who enter it land in that game's lobby and their phone is told which game it is. There is no "choose a game" menu after players join; to play a different game the host makes a new game night (new code). Players never log in: like Jackbox/Kahoot they just go to the site, enter the code, and type their own name.
- Two games are **live on the phones** (Globe Trotters and Spot the Fake: the server runs the rounds, timing and scoring) and two are **host-run** (The Big Board and Crowd Control: the host taps names on the big screen; phones just wait and show which game it is).
- **Globe Trotters is live multiplayer**: players join on their own phones (like Kahoot/GeoGuessr).
- Sound is **synthesized in the browser** (Web Audio). There are no audio files.

It runs on **Cloudflare Workers** (the owner's existing paid Cloudflare plan), live at **https://trivia.caydenfarris.net**. The owner (a product owner, not a full-time developer) edits files on GitHub; every push to `main` is built and deployed by Cloudflare (Workers Builds). **Never put it inside any of the other repos on the machine** (`CC1`, `CC2`, `CO2`, `PaymentApi`); it is a standalone project.

## 2. The four games

| # | Game | Type | Source of content |
|---|------|------|-------------------|
| 1 | **The Big Board** (Jeopardy-style) | host-run | `banks/jeopardy.js` — four full boards from the owner's CSV |
| 2 | **Globe Trotters** (GeoGuessr/Kahoot-style) | **live, phones join** | `banks/globetrotters_bank.csv` (owner's), optional `banks/globetrotters_images.csv` |
| 3 | **Spot the Fake** (two truths and a lie) | **live, phones** (Kahoot-style) | `banks/spotthefake.js` — written by Claude, fact-checked; read by the server, never sent to a browser |
| 4 | **Crowd Control** (Would You Rather + Most Likely To) | host-run | `banks/crowdcontrol.js` — written by Claude |

Games 3 and 4 replaced earlier pure-trivia games (Last One Standing, Higher or Lower) at the owner's request. Don't bring them back unless asked. The old clue-based geography game was also replaced by the live Globe Trotters.

### 2.1 The Big Board
- **The host picks the board when choosing the game**: selecting The Big Board on the setup screen reveals the four boards (name, categories, final topic, tagged NEW / PLAYED via `localStorage` key `gn.jp.played`). Default = the first board not played yet (`chosenBoard()`). The lobby shows the chosen board in a dropdown so it can be changed before Start, and Start opens that board directly (no menu). Play Again replays the same board when one was picked explicitly, otherwise the next unplayed one.
- Each board: 5 categories × 5 clues ($200–$1000), one hidden **Daily Double** (never on the $200 row), and a **Final** round.
- Turn: the player in control picks a tile → clue shows and the **buzzers open on every phone** → the first player to buzz is selected automatically → they shout the answer out loud → host marks **✓ Correct** (+value, that player gets control) or **✗ Wrong** (−value, locked out of this clue; the buzzers re-open for the others). **👁 Show answer first** (for when the host does not know the answer): reveals the answer on the big screen while the buzzed-in player stays selected (buzzers closed, `hold`), and then the host marks ✓ or ✗; since the answer is out, a wrong answer after peeking just ends the clue (no lock-out, no re-open). It also works on a Daily Double. **Nobody — show answer** reveals without scoring and closes the buzzers. Tapping a name by hand (if someone's phone is dead) also works and closes the buzzers. Optional 15s timer button plays "think" music.
- **Buzzers (phones).** The Big Board is still run from the host screen, but every phone gets a big **BUZZ** button; there is no answer submission (players say the answer out loud). The **server is the referee**: the Game Durable Object handles buzzes one at a time in arrival order, so exactly one player is first and nobody can take the clue from them (`POST /api/buzz`). It records who (name, team) and the time since the buzzers opened, and the host screen shows "⚡ Ann · Team Blue buzzed in first (0.43s)". The host controls the buzzers with `POST /api/host/buzz {cmd: on|open|close|off, locked:[playerIds]}` (the host page does this automatically: `on` when a board starts, `open` when a clue is picked, `close` when it is marked/revealed, `off` when leaving the board). **With teams, a wrong answer locks out the whole team** for that clue (the other teams can still buzz); without teams only that player is locked out. Daily Double and the Final round have no buzzing. Reaction time is measured at the server, so phones on slower connections are slightly disadvantaged.
- Daily Double: only the player in control, wager 5…max(score, 1000).
- Final: secret wagers entered by host → clue + 30s timer → reveal → host cycles each player's mark (unmarked → ✓ → ✗) → apply → podium.
- Scores can go negative. Chips in the footer show `$`.

### 2.2 Globe Trotters (live)
Flow: **setup (host picks Globe Trotters) → lobby → (guess → reveal) × N → end**.
1. Host picks Globe Trotters, the player limit and teams on the setup screen and opens the lobby. The server creates a game and shows the **4-digit code** and the join address (the address the host page was opened with).
2. Players open that address on their phone (`/` serves `play.html`), type code + name. Up to the host's player limit (`max` setting, 4–20). Names pop up on the big screen as people join.
3. In the same lobby the host picks rounds (dropdown: 5, 8, 10, 15, 20), seconds (dropdown: 20, 30, 45, 60, 90), category, then presses **Start**. The server accepts wider values than the dropdowns offer (rounds 3–30, seconds 15–180, max players 4–20) and clamps anything outside that range.
4. Each round a **photo of the place** goes to every phone and to the host screen. **Globe Trotters is photo-only: the place's name is never shown while guessing** (the server does not even send it before the reveal), so only places that have a photo are used (if there are fewer photo places than the chosen rounds, the game has fewer rounds). With **no** photos at all the lobby shows a warning and Start is disabled. Players tap a map to drop/move a pin and press **Lock in**. The round ends when the timer ends **or every connected player has locked**. A placed-but-unlocked pin still counts at timeout.
5. Reveal: host screen shows a Leaflet map with the answer (⭐ + radius circle), all pins, dashed lines, a ranked list, the blurb and photo credit. Phones show their own distance, points and rank. The host clicks **Next Round ▸** to send the next place.
6. After the last round: podium on the host screen, final rank on phones. **Play Again** returns to the lobby with the same players and zeroed scores.

**Scoring (owner-specified, do not change without asking).** A round is worth up to **5,000**, half for knowing what the place is and half for the pin:
```
name part = 2500 if the player picked the right name out of the 4 choices, else 0
pin part  = round(2500 * exp(-max(0, dist_km - radius_km) / 1500))
round score = name part + pin part
```
- **The 4 choices:** each round the phones show 4 place names (the right one + 3 others, chosen from the same kind of place first, then the same continent, then anywhere), in a random order. The choices are made when the game starts and saved with it. Players must pick a name **and** drop a pin before the Lock-in button works (at timeout, whatever they have set still counts). The two parts are independent: right name with a far pin still gets the 2,500.
- `dist_km` is great-circle (haversine, R = 6371). `radius_km` comes from the CSV so big places (Sahara) are forgiving. **Speed does not affect score.** A speed bonus was offered but not requested.
- The server sends the choices (they contain the right name by design) but never says which one is right before the reveal.

The answer's coordinates are **never sent to clients before the reveal**. Keep it that way.

### 2.3 Spot the Fake (live, Kahoot-style)
Everyone answers on their phone. Flow: **lobby → (question → reveal) × N → end**, same room/lobby/teams machinery as Globe Trotters.
1. The host picks Spot the Fake on the setup screen; in the lobby they choose the number of questions (5, 8, 10, 15, 20; default 10 = the bank's `perGame`) and seconds per question (15-30; default 25 = the bank's `seconds`), then **Start**.
2. Each question shows 3 statements (2 true, 1 fake, shuffled by the server) on the big screen and on every phone as three big colored buttons. **Tapping a button submits that answer immediately** (it cannot be changed). The server records how long it took from the moment the question started.
3. The question ends when everyone connected has answered, the host presses **Reveal now**, or the timer runs out (a Durable Object alarm).
4. **Scoring (owner-specified, do not change without asking): Kahoot-style, worth up to 1,000 per question.** A right answer scores `round(1000 * (1 - (answer_time / time_limit) / 2))`: 1,000 for an instant answer, falling to 500 at the buzzer. A wrong answer or no answer scores 0. Team score = sum of members.
5. Reveal: the big screen marks the FAKE and the TRUE statements, shows how many players picked each, the `why` text, and every player's ✅/❌, speed and points. Phones show ✅/❌, points, speed, the explanation and their rank.
The server sends the three statements but **never says which one is the lie before the reveal**. Bank: `public/banks/spotthefake.js` (an ES module, `export default { seconds, perGame, rounds }`, imported by `src/worker.js`; it is listed in `public/.assetsignore` and is not served to browsers). Editing it needs a deploy.

### 2.4 Crowd Control
14 rounds per game, mixed:
- **Would You Rather**: host taps players who chose A (rest = B). Majority scores 100. If `flip: true` it's an **UNDERDOG** round: the **minority** scores 200. Ties score nothing.
- **Most Likely To…**: everyone points on 3; host taps the player with the most fingers pointed at them, who is crowned (+100).

### 2.5 Teams (all four games)
Optional. The host picks **No teams** or **2–6 teams** (Red, Blue, Green, Gold, Purple, Orange).
- **Team score = the sum of its members' scores** in every game. (Uneven team sizes therefore favour the bigger team; an average-per-member option has not been built.)
- **Teams come from the lobby** (server-assigned) for every game: the host picks "Split everyone into N teams" on the setup screen, players are put into teams as they join (random round-robin over a shuffle, so sizes differ by at most 1; late joiners go to the smallest team), and in the lobby the host can tap a player to move them to the next team or press **Shuffle teams**. Teams cannot be changed once a Globe Trotters game has started. Host-run games read each player's team from the lobby when the game starts.
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
- Opening `public/index.html` by double-click (file://) no longer works: the lobby and every game need the Worker (players join from their phones).
- Internet needed for: Leaflet (cdnjs), OpenStreetMap tiles, Wikimedia photos. Everything else works offline.
- Local secrets: copy `.env.example` to **`.env`** (git-ignored, never commit it: this repo is public) and fill in `CARTO_KEY=...` (and optionally `SETUP_CODE=...`); `npm run dev` reads it. A `.dev.vars` file works the same way and wins if both exist. Or pass them one-off: `npx wrangler dev --var SETUP_CODE:abc`. **The live site never reads these files**: set the same names as Secrets in the Cloudflare dashboard.

### Running each game (host checklist)
1. Open the host page (`https://trivia.caydenfarris.net/host`, or `localhost:3000/host` locally) and log in. On the setup screen: **pick the game**, set how many players may join (4–20) and the number of teams, press **Open the lobby**. (There are no names to type: players type their own on their phones.)
2. Read the code out / leave the big screen showing it. Names pop up as people join. Press **Start <game>** when everyone is in. **🏠 Lobby** (top bar) goes back to the lobby (confirms first); **⟲ New game night / pick a different game** in the lobby makes a new code. **🔊** mutes. A page refresh keeps the same game night (same code and players); a game in progress on the host-run games restarts, a live Globe Trotters game resumes.
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
    index.html           ← HOST app: setup, lobby, all four games' host UIs, CSS, sound engine
    play.html            ← PLAYER page at `/`: enter code + name → (team badge) → map → result
    login.html           ← host login + first-time "create host account" page (/login)
    img/                 ← OPTIONAL local photos referenced by the CSV `image_file` column (served at /img/<file>)
    banks/
      jeopardy.js        ← window.BANKS.jeopardy  = { boards: [...] }
      spotthefake.js     ← ES module `export default { seconds, perGame, rounds }` read by the Worker (not served to browsers)
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
- `S.screen` — current screen name (`setup`, `lobby`, `jp-board`, `jp-clue`, `jp-final`, `gt`, `sf`, `cc`, `results`). `inGame()` = screen matches `/^(jp|gt|sf|cc)/` or `results`.
- `G` — state of the running game (`G.g` is `jp|gt|sf|cc`). `players` — the roster `{id,name,color,score,out,streak,team}`, rebuilt from the lobby's joined players (`syncPlayers()`) each time a host-run game starts. `G.lp` (if set) overrides the scoreboard list; Globe Trotters sets it from the server.
- **Event delegation:** every clickable has `data-act="name"`; one `document` click listener calls `ACT[name](el)`. Selects/checkboxes use `data-chg` and the `CHG` map. Add a new button = add `data-act` in the HTML string and a function in `ACT`.
- Rendering is string templates → `$('#view').innerHTML`. Call `renderBoard()` after any score change (the bottom chip scoreboard).
- Always `esc()` bank text before inserting into HTML.
- **`ROOM`** = the live game night: created when the host opens the lobby (`POST /api/host/new` + settings), one Server-Sent-Events stream for the whole night (`ROOM.st` = latest snapshot, `ROOM.post(path,body)` for host actions), resumed after a refresh from `gn.room`. `ROOM.changed()` routes each snapshot: into the Globe Trotters screens when the server leaves its lobby, otherwise it refreshes the lobby. **`LOBBY`** draws the lobby (game badge, join box, popping names / team boxes, Globe Trotters settings, Start). 
- **Modules:** `JP`, `GT`, `SF`, `CC` (one object per game, each with start/round/draw). `finish(title)` shows the podium + confetti + win fanfare for any game (`replay` action restarts the game; for Globe Trotters it calls `GT.again()`).
- `T` = shared countdown timer (`T.start(sec,{onEnd,tickFrom})`, `T.html(sec)` renders the bar with ids `#tfill`/`#tnum`). `T.stop()` before leaving a screen.
- `Snd` = Web Audio engine. Loops: `lobby`, `groove`, `think`, `hurry` (`Snd.loop(name)`, `Snd.stop()`). Effects via `Snd.play(name)`: `correct wrong buzz tick tickHi timeup reveal dd out pick win`. Audio only starts after the first click (browser rule); `Snd.init()` runs in the click listener.
- Persistence (`localStorage`, always try/catch): `gn.roster` (last setup choices: player limit, teams, game, Big Board board), `gn.room` (`{code,token}` of the current game night so a refresh reconnects), `gn.jp.played` (which boards were finished).
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
| `GET /banks/<name>.js` | **host session cookie** (else 401) | host-run banks (`jeopardy.js`, `crowdcontrol.js`), they contain answers. The CSVs and `spotthefake.js` are never served |
| `GET /img/<file>` | anyone | Globe Trotters photos |
| `POST /api/signup` `{username,password,setupCode?}` | anyone, **only while no account exists** | creates the host account and logs in |
| `POST /api/login` `{username,password}` / `POST /api/logout` | anyone | host session (see §2.6) |
| `GET /api/whoami` | anyone | `{host,user,canSignup,needsSetupCode}` |
| `POST /api/host/new` | **host session cookie** (401 otherwise) | creates a game → `{token, code}` |
| `POST /api/host/{settings,start,reveal,next,again}?code=` | host (`x-token` header) | control the game. `settings` (lobby only) accepts `game` (`jeopardy`/`globetrotters`/`spotthefake`/`crowdcontrol`: **which game this code is for**, default `globetrotters`), `max` (4–20 players), `teams` (0 or 2–6), and the live-game options (`rounds`, `seconds`, and Globe Trotters' `category`). Choosing a game also resets `rounds`/`seconds` to that game's defaults. `start` only works when `game` is `globetrotters` or `spotthefake` (the other two are run from the host screen, so their room stays in `lobby` while the host plays). `again` resets the room to the lobby from any phase |
| `POST /api/host/teams?code=` `{shuffle:true}` or `{move:{pid,team}}` | host (`x-token`), lobby only | rearrange teams |
| `POST /api/join` `{code,name}` | player | → `{pid, token, name, code}`; duplicate names get a number suffix |
| `POST /api/buzz?code=` `{pid,token}` | player | The Big Board: buzz in. Only the first buzz while the buzzers are open succeeds (`{ok:true,first:true}`); everything else gets `{ok:false}` |
| `POST /api/host/buzz?code=` `{cmd,locked?}` | host (`x-token`) | The Big Board buzzers: `on` / `off` (a board is running or not), `open` (with the player ids that are locked out), `hold` (close, but keep showing who buzzed in), `close` |
| `POST /api/guess?code=` `{pid,token,choice?,lat?,lon?,lock?}` (Globe Trotters) or `{pid,token,answer}` (Spot the Fake: 0-2, locks immediately, time recorded) | player | Globe Trotters: `choice` (0-3) = the name picked, `lat`/`lon` = the pin (each optional, sent as they change); `lock:true` locks the guess and may end the round early. Longitude is wrapped into [-180,180) |
| `GET /api/events?code=&role=host&token=…` / `?code=&role=player&pid=…&token=…` | SSE | pushes a full state snapshot (`view(role,pid)`) on every change |

State machine: `lobby → guess → reveal → guess … → end`, with `again` returning `end/reveal → lobby`. Every phase change calls `broadcast()`. Unlocked-pin updates do **not** broadcast (only locks do).

Snapshot shape (key fields): `now, phase, code, settings, players[{id,name,color,score,locked,connected,team}], teams (null or [{id,name,color,members,score,last}]), idx, total, deadline, prompt{category,name|null,image,options[4 names]|null}, `buzz{on,open,locked[],by{id,name,color,team,ms}|null,seq}` (Big Board only)`; in `reveal` also `answer{name,country,lat,lon,radius,blurb,credit}` and `results[]` (each with `pts`, `pinPts`, `namePts`, `correct`, `picked`); for players `me{…,guess,last,rank,of}`; for host `categories, count`. Clients compute countdowns from `deadline` and the `now` offset (`off = st.now - Date.now()`), so device clock skew doesn't matter. The join address shown in the lobby is the host page's own `location.origin`.

The Globe Trotters bank is parsed once when the Worker starts, so **editing the CSV needs a deploy** (a push to `main`). The Worker drops rows without valid `lat`/`lon`.

### 5.3 Phone app (`play.html`)
Sections `s-join`, `s-wait`, `s-play`, `s-end`. One Leaflet map instance reused each round (`layer` cleared). Stores `{pid,token,name,code}` in `localStorage` (`gt.me`) to reconnect after a refresh; a `closed` event clears it.

## 6. Editing content

- **Jeopardy:** the source CSV is `game,category,points,clue,answer`, with `Final` as the points value and a `Final Jeopardy: <topic>` category for each game's final. A one-off converter was used to produce `public/banks/jeopardy.js`; to regenerate from a new CSV, parse it the same way (respect quoted commas) and write `{boards:[{name,dailyDoubles,categories:[{name,clues:[{v,q,a}]}],final:{category,q,a}}]}`.
- **Spot the Fake:** edit `public/banks/spotthefake.js` (format in its header; it is read by the server, so a change needs a deploy). **Crowd Control:** edit the arrays in `public/banks/crowdcontrol.js`.
- **Globe Trotters:** edit `public/banks/globetrotters_bank.csv`. `radius_km` is the "close enough" zone (0 penalty inside it). **Photos are required** (the game is photo-only): run `cd public/banks && python fetch_images.py` (the owner's contact email is already set in its User-Agent; needs `pip install requests` and internet), **review the output** because the top Wikipedia hit isn't always the right picture (delete or fix bad rows; rows with no `image_url` are skipped), then commit `globetrotters_images.csv` and deploy. Override one photo with your own file in `public/img/` and its filename in the `image_file` column. Current state: the owner ran the script and committed the file; **99 of the 100 places have a photo** (place 72, Sossusvlei Dunes, has none and is skipped). About 18 photos matched a Wikipedia article with a different title than the place (e.g. #20 Stonehenge matched "United Kingdom", #41 Na Pali Coast matched "Kailua, Hawaii", #58 Havasu Falls matched "Arizona", #94 Faroe Islands matched "List of tunnels of the Faroe Islands"); check those images before relying on them.
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
- Audio/mute: browsers block sound until a click; the first click enables it.
- `qhead` header rows wrap on narrow screens (host window can be small).
- The game night's players come from the server (the lobby). Host-run games snapshot them when the game starts; people who join later appear in the lobby and are included the next time a game starts (Play Again). Globe Trotters is played on the phones, so it always uses the live list.
- Early round end waits only for **connected** players; if someone's phone drops, others locking ends the round. Because a dropped connection is only noticed on the next write, the Game object sends a keep-alive every 4 s.
- Don't add speed-based scoring, player accounts, or an external database unless asked. The only account is the single **host** account (§2.6, stored in the Auth Durable Object); players join with a code and name.
- **Map tiles:** the pages ask the Worker which tiles to use (`GET /api/map`, used by `addTiles()` in `public/play.html` and `public/index.html`).
  - If the **`CARTO_KEY` secret** is set, they use **CARTO Voyager** (`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=...`), chosen because it was expected to label places in English instead of each country's own language (this has not been confirmed from the sandbox; check Japan/China/Russia/Egypt on the live site). CARTO raster tiles need a free key (keyless tiles are stamped "API KEY REQUIRED"); the credit "© OpenStreetMap contributors © CARTO" must stay visible.
  - If `CARTO_KEY` is not set (or invalid), they fall back to the standard **OpenStreetMap** tiles, which always show names in the local language.
  - **The key must never be committed: this repo is public.** Set it as a *secret* (Cloudflare dashboard → `trivia` Worker → Settings → Variables and Secrets → Add → type Secret → name `CARTO_KEY`; or `npx wrangler secret put CARTO_KEY`; locally put it in the git-ignored `.env` file). Secrets survive deploys (plain variables set in the dashboard do not). The key is still visible to anyone who opens the site's network tab, as with any browser map key, so watch the CARTO usage quota.
  - **OpenStreetMap's rules (if you use its tiles):** the browser must send a `Referer`, so pages must NOT be served with `Referrer-Policy: same-origin` or `no-referrer` (that once made every tile show "403 Access blocked"; `strict-origin-when-cross-origin` is correct); the "© OpenStreetMap contributors" credit must stay visible; it is meant for light use. A cross-origin request from a page must carry `Referer: https://<site>/`.
- **Phone guess screen layout:** the photo is the whole clue, so it is large (`clamp(120px,28vh,330px)` tall, full width, tap to enlarge) and the 4 name choices, map and Lock button must all fit without overlapping on 320x568 up to 412x915 phones; only the map flexes (`min-height` 105-150px). Check it after layout changes.
- Never serve the answers: `/banks/*.js` is behind the host login and the CSVs are bundled, not served. Keep `run_worker_first` on.
- Changing a Durable Object class name or deleting one needs a new `migrations` entry in `wrangler.jsonc`; adding fields to the saved state is fine (old games just lack them).
- The old Node `server.js` was removed when moving to Workers (it's in git history, commit `776d431`, if ever needed).
- Git: this is a GitHub repo (`caydenfarris4/trivia`). Work on the designated feature branch; open a pull request only when the owner asks. **Merging to `main` deploys to the live site** (Workers Builds), so confirm before merging.

## 9. Open items / ideas (not started)
- Team scoring option "average per member" (sum penalises smaller teams).
- Host resume after a page refresh or re-login (a refresh still creates a new room; the old game's code stops working).
- Move the Auth/Game data to a nicer admin view, rate-limit joins, scheduled cleanup of old game objects (finished games are replaced, not deleted, until the next game starts).
- Change-password screen, and more than one host account (invite).
- Review the Globe Trotters photos (about 18 matched a differently titled Wikipedia article, see §6) and find a photo for #72 Sossusvlei Dunes. Photos can only be fetched on a machine with internet (this sandbox cannot reach Wikipedia).
- Optional speed bonus (Kahoot-style) in `endRound` scoring.
- QR code for the join address in the Globe Trotters lobby.
- Let phones also play Crowd Control (it is still run from the host screen; Spot the Fake is already live).
