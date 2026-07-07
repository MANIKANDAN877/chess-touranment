import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import { copyFileSync } from 'node:fs';

let DB_PATH = process.env.CHESS_DB_PATH || 'data/chess.db';

if (process.env.NETLIFY === 'true') {
	const tempDbPath = '/tmp/chess.db';
	if (!existsSync(tempDbPath) && existsSync('data/chess.db')) {
		try {
			copyFileSync('data/chess.db', tempDbPath);
		} catch (e) {
			console.error('Failed to copy database to /tmp:', e);
		}
	}
	DB_PATH = tempDbPath;
}

const dir = dirname(DB_PATH);
if (dir && dir !== '.' && !existsSync(dir)) {
	mkdirSync(dir, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS players (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	email TEXT,
	rating INTEGER DEFAULT 1200,
	created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tournaments (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	description TEXT,
	status TEXT NOT NULL DEFAULT 'pending', -- pending | ongoing | completed
	current_round INTEGER NOT NULL DEFAULT 0,
	first_place_id INTEGER,
	second_place_id INTEGER,
	third_place_id INTEGER,
	created_at TEXT DEFAULT (datetime('now')),
	FOREIGN KEY (first_place_id) REFERENCES players(id) ON DELETE SET NULL,
	FOREIGN KEY (second_place_id) REFERENCES players(id) ON DELETE SET NULL,
	FOREIGN KEY (third_place_id) REFERENCES players(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tournament_players (
	tournament_id INTEGER NOT NULL,
	player_id INTEGER NOT NULL,
	status TEXT NOT NULL DEFAULT 'active', -- active | eliminated | bye
	eliminated_round INTEGER,
	PRIMARY KEY (tournament_id, player_id),
	FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
	FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	tournament_id INTEGER NOT NULL,
	round INTEGER NOT NULL,
	player1_id INTEGER,
	player2_id INTEGER, -- NULL means player1 got a bye
	winner_id INTEGER,
	is_bye INTEGER NOT NULL DEFAULT 0,
	is_third_place_match INTEGER NOT NULL DEFAULT 0,
	created_at TEXT DEFAULT (datetime('now')),
	FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
	FOREIGN KEY (player1_id) REFERENCES players(id) ON DELETE SET NULL,
	FOREIGN KEY (player2_id) REFERENCES players(id) ON DELETE SET NULL,
	FOREIGN KEY (winner_id) REFERENCES players(id) ON DELETE SET NULL
);
`);

/** Run a query and return all rows as plain objects. */
export function all(sql, params = []) {
	return db.prepare(sql).all(...params);
}

/** Run a query and return the first row (or undefined). */
export function get(sql, params = []) {
	return db.prepare(sql).get(...params);
}

/** Run an insert/update/delete statement. Returns info { lastInsertRowid, changes }. */
export function run(sql, params = []) {
	return db.prepare(sql).run(...params);
}
