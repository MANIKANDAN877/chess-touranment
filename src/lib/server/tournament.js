import { db, all, get, run } from './db.js';

/** Fisher-Yates shuffle (does not mutate the input array). */
function shuffle(arr) {
	const a = [...arr];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

export function getTournament(id) {
	return get('SELECT * FROM tournaments WHERE id = ?', [id]);
}

export function listTournaments() {
	return all('SELECT * FROM tournaments ORDER BY created_at DESC');
}

export function getRegisteredPlayers(tournamentId) {
	return all(
		`SELECT p.*, tp.status, tp.eliminated_round
		 FROM tournament_players tp
		 JOIN players p ON p.id = tp.player_id
		 WHERE tp.tournament_id = ?
		 ORDER BY p.name`,
		[tournamentId]
	);
}

function getActivePlayers(tournamentId) {
	return all(
		`SELECT p.* FROM tournament_players tp
		 JOIN players p ON p.id = tp.player_id
		 WHERE tp.tournament_id = ? AND tp.status = 'active'`,
		[tournamentId]
	);
}

export function addPlayerToTournament(tournamentId, playerId) {
	const t = getTournament(tournamentId);
	if (!t) throw new Error('Tournament not found');
	if (t.status !== 'pending') throw new Error('Cannot add players once a tournament has started');
	run(
		`INSERT OR IGNORE INTO tournament_players (tournament_id, player_id, status)
		 VALUES (?, ?, 'active')`,
		[tournamentId, playerId]
	);
}

export function removePlayerFromTournament(tournamentId, playerId) {
	const t = getTournament(tournamentId);
	if (!t) throw new Error('Tournament not found');
	if (t.status !== 'pending') throw new Error('Cannot remove players once a tournament has started');
	run('DELETE FROM tournament_players WHERE tournament_id = ? AND player_id = ?', [
		tournamentId,
		playerId
	]);
}

export function startTournament(tournamentId) {
	const t = getTournament(tournamentId);
	if (!t) throw new Error('Tournament not found');
	if (t.status !== 'pending') throw new Error('Tournament already started');
	const players = getActivePlayers(tournamentId);
	if (players.length < 2) throw new Error('Need at least 2 players to start a tournament');
	run(`UPDATE tournaments SET status = 'ongoing', current_round = 0 WHERE id = ?`, [tournamentId]);
}

export function getMatches(tournamentId) {
	return all(
		`SELECT m.*, p1.name as player1_name, p2.name as player2_name, w.name as winner_name
		 FROM matches m
		 LEFT JOIN players p1 ON p1.id = m.player1_id
		 LEFT JOIN players p2 ON p2.id = m.player2_id
		 LEFT JOIN players w ON w.id = m.winner_id
		 WHERE m.tournament_id = ?
		 ORDER BY m.round ASC, m.id ASC`,
		[tournamentId]
	);
}

/**
 * Advances the tournament by one step:
 *  - If more than 2 players remain active, plays a full round of random pairings
 *    (with a bye if the count is odd) and randomly decides each match's winner.
 *  - If exactly 2 players remain, plays the Final (+ a 3rd place match if there
 *    are eligible semifinal-loser candidates) and marks the tournament completed.
 */
export function playNextRound(tournamentId) {
	const t = getTournament(tournamentId);
	if (!t) throw new Error('Tournament not found');
	if (t.status === 'completed') throw new Error('Tournament already completed');
	if (t.status !== 'ongoing') throw new Error('Tournament has not started yet');

	const active = getActivePlayers(tournamentId);

	if (active.length < 2) {
		throw new Error('Not enough active players to continue');
	}

	const nextRound = t.current_round + 1;

	if (active.length === 2) {
		// --- FINAL ---
		const [a, b] = shuffle(active);
		const winner = Math.random() < 0.5 ? a : b;
		const loser = winner.id === a.id ? b : a;

		run(
			`INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, is_bye)
			 VALUES (?, ?, ?, ?, ?, 0)`,
			[tournamentId, nextRound, a.id, b.id, winner.id]
		);
		run(
			`UPDATE tournament_players SET status = 'eliminated', eliminated_round = ?
			 WHERE tournament_id = ? AND player_id = ?`,
			[nextRound, tournamentId, loser.id]
		);

		// 3rd place: players eliminated in the round immediately before the final.
		const candidates = all(
			`SELECT p.* FROM tournament_players tp
			 JOIN players p ON p.id = tp.player_id
			 WHERE tp.tournament_id = ? AND tp.status = 'eliminated' AND tp.eliminated_round = ?`,
			[tournamentId, t.current_round]
		);

		let thirdPlaceId = null;
		if (candidates.length === 2) {
			const [c1, c2] = shuffle(candidates);
			const thirdWinner = Math.random() < 0.5 ? c1 : c2;
			run(
				`INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, is_bye, is_third_place_match)
				 VALUES (?, ?, ?, ?, ?, 0, 1)`,
				[tournamentId, nextRound, c1.id, c2.id, thirdWinner.id]
			);
			thirdPlaceId = thirdWinner.id;
		} else if (candidates.length === 1) {
			thirdPlaceId = candidates[0].id;
			run(
				`INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, is_bye, is_third_place_match)
				 VALUES (?, ?, ?, NULL, ?, 1, 1)`,
				[tournamentId, nextRound, candidates[0].id, candidates[0].id]
			);
		}

		run(
			`UPDATE tournaments
			 SET status = 'completed', current_round = ?, first_place_id = ?, second_place_id = ?, third_place_id = ?
			 WHERE id = ?`,
			[nextRound, winner.id, loser.id, thirdPlaceId, tournamentId]
		);

		return { finished: true };
	}

	// --- REGULAR ROUND ---
	const shuffled = shuffle(active);
	const pairs = [];
	for (let i = 0; i < shuffled.length; i += 2) {
		if (i + 1 < shuffled.length) {
			pairs.push([shuffled[i], shuffled[i + 1]]);
		} else {
			pairs.push([shuffled[i], null]); // bye
		}
	}

	for (const [p1, p2] of pairs) {
		if (!p2) {
			// Bye: automatic advance, no elimination.
			run(
				`INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, is_bye)
				 VALUES (?, ?, ?, NULL, ?, 1)`,
				[tournamentId, nextRound, p1.id, p1.id]
			);
			continue;
		}
		const winner = Math.random() < 0.5 ? p1 : p2;
		const loser = winner.id === p1.id ? p2 : p1;
		run(
			`INSERT INTO matches (tournament_id, round, player1_id, player2_id, winner_id, is_bye)
			 VALUES (?, ?, ?, ?, ?, 0)`,
			[tournamentId, nextRound, p1.id, p2.id, winner.id]
		);
		run(
			`UPDATE tournament_players SET status = 'eliminated', eliminated_round = ?
			 WHERE tournament_id = ? AND player_id = ?`,
			[nextRound, tournamentId, loser.id]
		);
	}

	run(`UPDATE tournaments SET current_round = ? WHERE id = ?`, [nextRound, tournamentId]);

	return { finished: false };
}

export function getRankings(tournamentId) {
	const t = getTournament(tournamentId);
	if (!t) throw new Error('Tournament not found');
	const byId = (id) => (id ? get('SELECT * FROM players WHERE id = ?', [id]) : null);
	return {
		status: t.status,
		first: byId(t.first_place_id),
		second: byId(t.second_place_id),
		third: byId(t.third_place_id)
	};
}
