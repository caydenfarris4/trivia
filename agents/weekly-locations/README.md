# Weekly location agent tree (Globe Trotters)

Once a week a scheduled Claude Code task runs this tree and ends with **one pull request that adds up to 5 new places** (each with a photo, coordinates, radius, difficulty and a fun fact) to Globe Trotters. A human (the owner) reads the PR and merges it. Nothing goes live without that.

```
Orchestrator (the scheduled session; you are reading its runbook)
 ├─ Scout agent   scout.md   finds cool places and their best photo and coordinates, with sources
 └─ QA agent      qa.md      independent: re-checks the coordinates, LOOKS at each photo, checks license and fit; PASS/FAIL per place
```

The orchestrator never picks places itself. It sets the brief, runs the two agents, replaces places that fail, then adds the passing ones and opens the PR.

## Rules that never bend

- **One PR, never merged by an agent.** Do not merge, do not push to `main`, do not touch anything except `public/banks/globetrotters_bank.csv`, `public/banks/globetrotters_images.csv` and `agents/weekly-locations/history.md`.
- **The place must be what the photo shows, and the coordinates must be right.** These are the two things that make a place playable. A wrong pin makes every player lose points unfairly.
- **Photos must be properly licensed:** Wikimedia Commons files under CC0, public domain, CC BY or CC BY-SA, with a clean author name. Never NonCommercial, NoDerivatives or GFDL. The game shows each credit with links.
- **Family-clean:** nothing about alcohol, coffee/tea, tobacco, gambling (no casinos, wine regions, breweries, "pub crawl" places). Nothing grim (battlefields, disaster or atrocity sites). Religious sites are fine when shown respectfully.
- **Photo-only game:** the place's name is never shown while guessing, so the photo must let a smart player work out where it is without a caption: no signs or text that give the name away.

## Runbook (follow in order)

1. **Sync.** `git fetch origin main && git checkout -B weekly-locations/<YYYY-MM-DD> origin/main`.
2. **Read context.** `AGENTS.md` (the Globe Trotters section), `agents/weekly-locations/history.md`, and the spread of today's places: `node scripts/validate_location.js --stats`. Skim `public/banks/globetrotters_bank.csv` so you know what is already in the game.
3. **Pick the brief** by ISO week number mod 4, and also tilt toward the under-represented continents/categories shown by `--stats`:

   | week mod 4 | theme |
   |---|---|
   | 0 | **Natural wonders**: waterfalls, canyons, caves, glaciers, volcanoes, lakes, deserts, forests |
   | 1 | **Vacation spots**: beaches, islands, coasts, lagoons, resort-famous bays, scenic drives |
   | 2 | **Cool cities and culture**: skylines, old towns, markets, bridges, castles, temples, famous streets |
   | 3 | **Hidden gems and "just cool spots"**: surprising, photogenic places most people have not heard of (these are `hard`) |

   Aim for a spread: at most 2 places per continent in one batch, and a mix of `easy`, `medium` and `hard`.
4. **Scout.** Spawn one agent (`general-purpose`) whose prompt is the full text of `agents/weekly-locations/scout.md` plus your brief and the output path `<scratchpad>/locations.json`. Ask for **7 places** (so 5 can survive QA). Wait for it.
5. **Mechanical check.** `node scripts/validate_location.js <scratchpad>/locations.json --online`. Send every ERROR back to the scout until none remain. The `--online` run downloads each photo and compares the coordinates and the license with Wikipedia and Commons; its "evidence" lines go to QA and into the PR.
6. **QA.** Spawn a **different, fresh** agent (`general-purpose`) with the full text of `agents/weekly-locations/qa.md`, the candidate path, and the output path `<scratchpad>/qa_report.json`. Do not tell it the scout's conclusions.
7. **Loop.** Places QA marks `FAIL` go back to the scout for a fix or a replacement; re-run steps 5 and 6 for those. At most **2 revision rounds**.
8. **Add.** `node scripts/add_locations.js <scratchpad>/locations.json --approved <scratchpad>/qa_report.json --max 5` (it adds only places QA passed, up to 5, and refuses anything that fails the checks). Then `node scripts/validate_location.js --stats` and `npx wrangler deploy --dry-run --outdir <scratchpad>/dry`.
9. **Log it.** Append a row to `agents/weekly-locations/history.md`: date, week, theme, the places added, and any rejected with the reason.
10. **Commit and open the PR.** Commit only the three files, push, open a pull request to `main` titled `Weekly places: <comma-separated names>`. The body must have: the theme, a table of the added places (name, country, coordinates, radius, difficulty, license, link to the Commons file page), QA's summary, QA's remaining advisories, the places that were rejected and why, and the sources. End with the Claude Code attribution lines. Do not merge it.
11. **If fewer than 3 places pass after 2 rounds:** add nothing. Open a **draft** PR that only adds a history row marked `NEEDS HUMAN`, with QA's findings.

## Candidate format (what the scout writes)

```json
{ "locations": [ {
  "name": "Preikestolen (Pulpit Rock)",   "country": "Norway",   "continent": "Europe",
  "category": "Natural Wonder",           "lat": 58.9863,  "lon": 6.19,
  "radius_km": 3,  "difficulty": "medium",
  "reveal_blurb": "A flat-topped cliff plateau rising about 600 m above Lysefjord.",
  "image": { "wiki_title": "Preikestolen", "image_url": "https://thumb.wikimedia.org/wikipedia/commons/thumb/x/xy/File.jpg/1920px-File.jpg",
             "license": "CC BY 2.0", "author": "Photographer Name", "commons_page": "https://commons.wikimedia.org/wiki/File:File.jpg" },
  "sources": { "coordinates": ["url1", "url2"], "photo": ["url"], "blurb": ["url"] }
} ] }
```

- `continent`: Europe, Asia, Africa, North America, South America, Oceania, Antarctica. `category`: Landmark, City & Culture, Beach & Coast, Natural Wonder, Mountain & Range.
- `radius_km` is the "close enough" zone (no distance penalty inside it): about 1-5 for a single building or monument, 15-60 for a park, bay or coast, 100+ for a big region or island group.
- `difficulty`: `easy` = world famous, `medium` = well known to travellers, `hard` = a place few people can name.
- `reveal_blurb`: one short, true, fun sentence (20-160 characters) shown after the guess.

## Files

| File | What it is |
|---|---|
| `scout.md`, `qa.md` | The two agents' full instructions |
| `history.md` | One row per weekly run, so places and themes do not repeat |
| `../../scripts/validate_location.js` | Static + `--online` checks (photo size and license, coordinates vs Wikipedia and the photo's GPS tag, duplicates, banned words) |
| `../../scripts/add_locations.js` | Appends approved places to both data files (keeps the CRLF line endings) |
