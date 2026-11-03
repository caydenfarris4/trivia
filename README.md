# Game Night Live

Four party games for 4–20 people, played on one big screen. Runs on **Cloudflare Workers** at https://trivia.caydenfarris.net.

## Play it (the live site)
1. **Host:** go to `https://trivia.caydenfarris.net/host` (it sends you to the login). The very first time, the login page asks you to **create your host account** (username + password). That account becomes the host and sign-up then closes. After that you just log in.
2. **Pick the game and open the lobby:** on the host page choose which game you're playing, how many players can join and (optionally) how many teams, then press *Open the lobby*. You get a random 4-digit code **for that game**. There are no names to type.
3. **Players:** go to `https://trivia.caydenfarris.net/`, type the code and their own name. Their phone shows which game it is, and their name pops up on your big screen. Press *Start* when everyone's in. (To play a different game, make a new game night: *⟲ New game night* in the lobby.)
4. Forgot the host password? In Cloudflare: the `trivia` Worker → Settings → Variables and Secrets → add a secret named `RESET_HOST` with any new value. The next visit to the site wipes the host account, and you can create a new one.

## Deploying / changing it
- Every push to `main` is built and deployed by Cloudflare automatically (Workers Builds runs `npx wrangler deploy`).
- Needs a Cloudflare Workers **paid** plan (password hashing uses more CPU time than the free plan allows).
- Optional secret `SETUP_CODE`: if set, creating the first host account also requires this code, so nobody else can grab the host account before you do.
- Practice on your own computer: install [Node.js](https://nodejs.org), then double-click **start.bat** (or run `npm install` then `npm run dev`). Open the host page using your computer's Wi-Fi address (start.bat prints it) so phones on the same Wi-Fi can join.

## The games
| Game | How it plays |
|---|---|
| **The Big Board** | Host-run Jeopardy. The host picks one of the four boards (from `public/banks/jeopardy.js`) on the setup screen when choosing the game; it can be changed in the lobby. |
| **Globe Trotters** | **Live, like Kahoot/GeoGuessr.** Players join on their phones with the code and a name. The host clicks *Start* / *Next Round*, the place goes out to every phone at once, and everyone drops a pin before the timer runs out. Score = `round(5000 * exp(-max(0, dist_km - radius_km) / 1500))`. The round ends early when everyone has locked in. |
| **Spot the Fake** | Two truths and a lie. Host taps who spotted it. |
| **Crowd Control** | Would-you-rather and Most Likely To. |

## Host account and teams
- Only the host has an account. The site's front page is the normal player screen; the host uses **Host login**.
- **Teams (all four games):** pick 2–6 teams on the setup screen. Players are split randomly as they join, the host can move people or shuffle in the lobby, and a team's score is the sum of its members.

## Globe Trotters banks
- `public/banks/globetrotters_bank.csv` — the places (answers never leave the server until the reveal). Edit it, push to `main`, and it goes live after the automatic deploy.
- **Photos are required.** Globe Trotters is photo-only: players only ever see a picture of the place (never its name), so a place without a photo is not used, and with no photos at all the game can't start. To add them: install Python, run `pip install requests`, (the contact email Wikimedia asks for is already set in `public/banks/fetch_images.py`), then in a terminal run `cd public/banks` and `python fetch_images.py` (needs internet). It writes `public/banks/globetrotters_images.csv`. **Check the pictures** (the top Wikipedia hit isn't always the right one; delete bad rows), commit the file, and it goes live after the automatic deploy. To use your own picture for a place, put the file in `public/img/` and write its filename in the `image_file` column of the places file.
- The lobby tells the host how many places have photos (for example "📷 80 of 100 places have photos"). Only those places are used.

## Other banks
`public/banks/jeopardy.js`, `public/banks/spotthefake.js`, `public/banks/crowdcontrol.js` — formats are documented at the top of each file.

More detail for developers and AI assistants is in [AGENTS.md](AGENTS.md).
