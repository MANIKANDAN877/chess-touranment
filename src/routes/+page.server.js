import { listPlayers } from '$lib/server/players.js';
import { listTournaments } from '$lib/server/tournament.js';

export function load() {
	const players = listPlayers();
	const tournaments = listTournaments();
	return {
		playerCount: players.length,
		tournamentCount: tournaments.length,
		ongoing: tournaments.filter((t) => t.status === 'ongoing').length,
		recentTournaments: tournaments.slice(0, 5)
	};
}
