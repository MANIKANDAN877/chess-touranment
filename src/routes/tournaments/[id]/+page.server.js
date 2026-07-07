import { error, fail } from '@sveltejs/kit';
import { listPlayers } from '$lib/server/players.js';
import {
	getTournament,
	getRegisteredPlayers,
	addPlayerToTournament,
	removePlayerFromTournament,
	startTournament,
	playNextRound,
	getMatches,
	getRankings
} from '$lib/server/tournament.js';

export function load({ params }) {
	const id = Number(params.id);
	const tournament = getTournament(id);
	if (!tournament) throw error(404, 'Tournament not found');

	const registered = getRegisteredPlayers(id);
	const registeredIds = new Set(registered.map((p) => p.id));
	const availablePlayers = listPlayers().filter((p) => !registeredIds.has(p.id));

	return {
		tournament,
		registered,
		availablePlayers,
		matches: getMatches(id),
		rankings: getRankings(id)
	};
}

export const actions = {
	addPlayer: async ({ request, params }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const playerId = Number(form.get('playerId'));
		try {
			addPlayerToTournament(id, playerId);
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	removePlayer: async ({ request, params }) => {
		const id = Number(params.id);
		const form = await request.formData();
		const playerId = Number(form.get('playerId'));
		try {
			removePlayerFromTournament(id, playerId);
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	start: async ({ params }) => {
		const id = Number(params.id);
		try {
			startTournament(id);
		} catch (err) {
			return fail(400, { error: err.message });
		}
	},

	playRound: async ({ params }) => {
		const id = Number(params.id);
		try {
			playNextRound(id);
		} catch (err) {
			return fail(400, { error: err.message });
		}
	}
};
