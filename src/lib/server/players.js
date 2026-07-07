import { all, get, run } from './db.js';

export function listPlayers() {
	return all('SELECT * FROM players ORDER BY created_at DESC');
}

export function getPlayer(id) {
	return get('SELECT * FROM players WHERE id = ?', [id]);
}

export function createPlayer({ name, email, rating }) {
	if (!name || !name.trim()) throw new Error('Name is required');
	const info = run('INSERT INTO players (name, email, rating) VALUES (?, ?, ?)', [
		name.trim(),
		email?.trim() || null,
		rating ? Number(rating) : 1200
	]);
	return getPlayer(info.lastInsertRowid);
}

export function updatePlayer(id, { name, email, rating }) {
	if (!name || !name.trim()) throw new Error('Name is required');
	run('UPDATE players SET name = ?, email = ?, rating = ? WHERE id = ?', [
		name.trim(),
		email?.trim() || null,
		rating ? Number(rating) : 1200,
		id
	]);
	return getPlayer(id);
}

export function deletePlayer(id) {
	run('DELETE FROM players WHERE id = ?', [id]);
}
