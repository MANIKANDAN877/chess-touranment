import { fail, redirect } from '@sveltejs/kit';
import { listTournaments } from '$lib/server/tournament.js';
import { run } from '$lib/server/db.js';

export function load() {
	return { tournaments: listTournaments() };
}

export const actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		const description = form.get('description')?.toString().trim() || null;
		if (!name) return fail(400, { error: 'Tournament name is required' });
		const info = run('INSERT INTO tournaments (name, description) VALUES (?, ?)', [
			name,
			description
		]);
		throw redirect(303, `/tournaments/${info.lastInsertRowid}`);
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		run('DELETE FROM tournaments WHERE id = ?', [id]);
	}
};
