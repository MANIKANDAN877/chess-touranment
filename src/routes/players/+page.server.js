import { fail } from '@sveltejs/kit';
import { listPlayers, createPlayer, updatePlayer, deletePlayer, getPlayer } from '$lib/server/players.js';

export function load() {
	return { players: listPlayers() };
}

export const actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		try {
			createPlayer({
				name: form.get('name'),
				email: form.get('email'),
				rating: form.get('rating')
			});
		} catch (err) {
			return fail(400, { error: err.message, mode: 'create' });
		}
	},

	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		try {
			if (!getPlayer(id)) throw new Error('Player not found');
			updatePlayer(id, {
				name: form.get('name'),
				email: form.get('email'),
				rating: form.get('rating')
			});
		} catch (err) {
			return fail(400, { error: err.message, mode: 'edit', id });
		}
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		try {
			deletePlayer(id);
		} catch (err) {
			return fail(400, { error: err.message });
		}
	}
};
