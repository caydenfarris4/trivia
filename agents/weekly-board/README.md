# Weekly board agent tree

Once a week a scheduled Claude Code task runs this tree and ends with **one pull request that adds one new Big Board board**. A human (the owner) reads the PR and merges it. Nothing goes live without that.

```
Orchestrator (the scheduled session, you are reading its runbook)
 ├─ Researcher agent   researcher.md   finds a good mix of categories, writes + sources every clue
 └─ QA agent           qa.md           independent fact-check and quality review; PASS or FAIL
```

The orchestrator never writes clues itself. It picks the brief, runs the two agents, loops once or twice if QA says FAIL, then adds the board and opens the PR.

## Rules that never bend

- **One board, one PR, never merged by an agent.** Do not merge, do not push to `main`, do not touch anything except `public/banks/jeopardy.js` and `agents/weekly-board/history.md`.
- **Clean for a whole family**, including a faithful Latter-day Saint household: nothing about alcohol, coffee, tea, tobacco/vaping, gambling or crude humor; nothing that mocks faith or people; nothing graphic. (`scripts/validate_board.js` blocks the obvious words; the QA agent checks the rest.)
- **Every fact must be true and sourced.** Credible sources only: encyclopedias (Britannica), government/university/museum/official-organization pages, major reference works, the primary source itself. Not forums, content farms, AI-generated listicles, or sites that merely repeat each other. A non-obvious fact needs two independent sources. If a fact cannot be verified, replace the clue.
- **Timeless.** No "currently", "as of", "most recent", records that change, or anything that will be wrong in a year.

## Runbook (follow in order)

1. **Sync.** `git fetch origin main && git checkout -B weekly-board/<YYYY-MM-DD> origin/main` (use today's date).
2. **Read context.** `AGENTS.md` (the Big Board section), `agents/weekly-board/history.md`, and the list of category names already in `public/banks/jeopardy.js`:
   `node -e 'global.window={};require("./public/banks/jeopardy.js");for(const b of window.BANKS.jeopardy.boards)console.log(b.name,"|",b.style||"-","|",b.categories.map(c=>c.name).join(" / "))'`
3. **Pick the brief** from the rotation below (ISO week number mod 4). The audience is always the same: **a mixed family at one table** (two parents, an older brother, a 21-year-old, three high schoolers). Write the brief as a few sentences: style, mood, 5 *candidate* category ideas, 3 topics to avoid because they are already covered.

   | week mod 4 | style | brief |
   |---|---|---|
   | 0 | `trivia` | Knowledge-heavy: history, geography, science, nature, literature, the arts, sports. Hard at $800/$1000. |
   | 1 | `family` | Everyone can play: movies, music, kids' TV, food, games, animals, family sports (the family loves **volleyball and baseball**). |
   | 2 | `trivia` | Pop-culture and "did you know" mix: inventions, brands, language and word origins, famous firsts, odd facts, current-ish culture that will not go stale. |
   | 3 | `family` | Seasonal: the next holiday or season within about 5 weeks (Thanksgiving, Christmas, New Year, Easter, summer, back-to-school...); otherwise a wildcard. Keep it warm and inclusive. |

4. **Researcher.** Spawn one agent (`general-purpose`) whose prompt is the full text of `agents/weekly-board/researcher.md` followed by your brief and the output path `<scratchpad>/candidate.json`. Wait for it to finish.
5. **Mechanical check.** `node scripts/validate_board.js <scratchpad>/candidate.json`. If it reports errors, send them back to the researcher (SendMessage to the same agent, or a new one) until it passes. Warnings go to QA.
6. **QA.** Spawn a **different, fresh** agent (`general-purpose`) with the full text of `agents/weekly-board/qa.md`, the candidate path, and the output path `<scratchpad>/qa_report.json`. Do **not** tell it the researcher's conclusions; it re-verifies independently.
7. **Loop.** QA's verdict is `FAIL` only when a **blocker** is open (see `qa.md`). Give the researcher the blockers (and the advisories too if cheap to fix), let it fix the candidate, re-run steps 5 and 6. At most **2 revision rounds**. Advisories that remain are listed in the PR for the owner and do not block it.
8. **Add the board.** On `PASS`: `node scripts/add_board.js <scratchpad>/candidate.json`. Then check it loads and still deploys: `node scripts/validate_board.js --bank` (the board you added must be `ok`) and `npx wrangler deploy --dry-run --outdir <scratchpad>/dry`.
9. **Log it.** Append one row to `agents/weekly-board/history.md`: date, week number, style, board name, categories.
10. **Commit and open the PR.** Commit only the two files, push the branch, and open a pull request to `main` titled `Weekly board: <board name>`. The body must contain: the brief, the 5 category names plus the Final, QA's summary and verdict, any remaining **advisories** from the QA report, and a compact **sources** list (clue -> URL) taken from the candidate's `sources`. End the body with the Claude Code attribution lines. Do not merge it. Do not ask the owner anything; they will review.
11. **If it still fails after 2 rounds:** do not add the board. Open a **draft** PR that only adds a history row marked `NEEDS HUMAN`, listing the candidate's problems from the QA report, so the owner can see what happened.

## Files

| File | What it is |
|---|---|
| `researcher.md` | The researcher agent's full instructions |
| `qa.md` | The QA agent's full instructions |
| `history.md` | One row per weekly run, so topics do not repeat |
| `../../scripts/validate_board.js` | Structure, value ladder, banned words, duplicate checks |
| `../../scripts/add_board.js` | Safely appends a candidate to `public/banks/jeopardy.js` |

## Board format (what the researcher produces)

```json
{
  "name": "Board Name (max 40 chars)",
  "style": "family" or "trivia",
  "dailyDoubles": 1,
  "categories": [
    { "name": "Category (max 32 chars)", "clues": [ { "v": 200, "q": "Clue text, a statement.", "a": "Short answer" } ] }
  ],
  "final": { "category": "Final category", "q": "Clue text.", "a": "Answer" },
  "sources": { "Category Name|200": ["https://..."], "final": ["https://..."] }
}
```

5 categories, 5 clues each at $200/$400/$600/$800/$1000 (easy to hard), plus the Final. `sources` is for QA and the PR only; `add_board.js` does not write it to the bank.
