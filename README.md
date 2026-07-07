# ♞ Chess Tournament Management System

A full-stack web app for managing chess players and tournaments, built with **SvelteKit** and **SQLite**.

Players can be created and edited; tournaments can be created and populated with
players; a **single-elimination bracket engine** randomly pairs players each round,
randomly decides the winner of every match, and automatically produces final
**1st / 2nd / 3rd place** rankings — including a genuine 3rd-place playoff match
between the two semifinal losers.

## Tech Stack

- **SvelteKit** (Svelte 5, runes) — full-stack framework, used for both the UI and
  the server-side data layer (form actions = the "API").
- **SQLite**, via Node's built-in `node:sqlite` module (no native build step, no
  external DB server required — the whole app is self-contained).
- **adapter-node** — produces a standalone Node server for deployment/demoing.

> This substitutes SQLite for the requested stack's database, matching the "SQLite"
> option in the assignment while keeping the Svelte/SvelteKit framework. It avoids
> requiring a running PostgreSQL server for a reviewer to try the app, and avoids
> native-module compilation (`better-sqlite3`) which isn't always available in
> restricted environments. Swapping to Postgres later would only mean changing
> `src/lib/server/db.js`, since all the query logic already sits behind small
> `all()/get()/run()` helpers.

## Features

### Player Management (CRUD)
- Create, list, edit, and delete players (name, email, rating).
- `src/routes/players/+page.svelte` + `+page.server.js`

### Tournament Management (CRUD)
- Create, list, and delete tournaments.
- Register / unregister players to a tournament while it's still `pending`.
- `src/routes/tournaments/+page.svelte` and `src/routes/tournaments/[id]/+page.svelte`

### Match System (random pairing + random results)
Implemented as a single-elimination bracket in `src/lib/server/tournament.js`:

1. **Start Tournament** — locks in the registered player list, moves status to `ongoing`.
2. **Play Next Round** (click as many times as needed):
   - Randomly shuffles the currently-active players and pairs them up.
   - If there's an odd number of players, the last one gets a random **bye** (auto-advances).
   - Each match's winner is picked **randomly** and the result is recorded immediately.
   - Losers are marked `eliminated` (with the round they lost in).
   - When only 2 players remain, that round is played as the **Final**: winner = 1st
     place, loser = 2nd place.
   - The two players eliminated in the round right before the Final automatically
     play a **3rd place match** (also randomly decided) so the podium always has a
     real winner for bronze whenever there were enough players for a semifinal.
3. Full match history is stored in the `matches` table and shown round-by-round.

### Rankings
Once a tournament is `completed`, the detail page shows a podium with **1st, 2nd,
and 3rd place**, pulled from `tournaments.first_place_id / second_place_id / third_place_id`.

## Data Model

```
players            (id, name, email, rating)
tournaments         (id, name, description, status, current_round,
                     first_place_id, second_place_id, third_place_id)
tournament_players  (tournament_id, player_id, status, eliminated_round)
matches             (id, tournament_id, round, player1_id, player2_id,
                     winner_id, is_bye, is_third_place_match)
```

## Getting Started

Requires **Node.js 22.5+** (for the built-in `node:sqlite` module).

```bash
npm install
npm run dev -- --open
```

The app runs at `http://localhost:5173` by default. A SQLite file is created
automatically at `data/chess.db` on first run — nothing else to configure.

### Production build

```bash
npm run build
ORIGIN=http://localhost:3000 node build/index.js
```

(`ORIGIN` tells SvelteKit's CSRF protection what origin to trust in production —
set it to whatever URL you're actually serving the app from.)

## Suggested demo flow

1. Go to **Players**, add 4–8 players.
2. Go to **Tournaments**, create a tournament, open it, add several of the players
   you just created.
3. Click **Start Tournament**.
4. Click **Play Next Round** repeatedly — watch players get randomly paired and
   eliminated round by round.
5. When only 2 players remain, the next click plays the Final (and 3rd place match)
   and reveals the podium.

## Project structure

```
src/
  lib/server/
    db.js           – SQLite connection + schema + tiny query helpers
    players.js       – player CRUD
    tournament.js    – tournament CRUD + bracket/ranking engine
  routes/
    +page.svelte              – dashboard
    players/                  – player CRUD UI
    tournaments/              – tournament list/create UI
    tournaments/[id]/         – tournament detail: roster, rounds, rankings
  app.css            – shared design system (design tokens, buttons, tables, podium)
```
