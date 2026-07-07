<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let selectedPlayerId = $state('');

	function statusBadge(status) {
		return { pending: 'badge-pending', ongoing: 'badge-ongoing', completed: 'badge-completed' }[
			status
		];
	}

	function playerStatusLabel(p) {
		if (p.status === 'eliminated') return `Eliminated (round ${p.eliminated_round})`;
		return 'Active';
	}

	const roundsGrouped = $derived.by(() => {
		const groups = new Map();
		for (const m of data.matches) {
			if (!groups.has(m.round)) groups.set(m.round, []);
			groups.get(m.round).push(m);
		}
		return [...groups.entries()].sort((a, b) => a[0] - b[0]);
	});
</script>

<a href="/tournaments" class="btn btn-outline btn-sm">← All Tournaments</a>

<section class="spread mt-1">
	<div>
		<h1>{data.tournament.name}</h1>
		{#if data.tournament.description}<p style="color:var(--muted);">{data.tournament.description}</p>{/if}
	</div>
	<span class="badge {statusBadge(data.tournament.status)}">{data.tournament.status}</span>
</section>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

{#if data.tournament.status === 'completed'}
	<section class="card mt-2">
		<h2 style="text-align:center;">🏆 Final Rankings</h2>
		<div class="podium">
			<div class="place second">
				<div class="rank">2nd Place</div>
				<div class="medal">🥈</div>
				<div class="name">{data.rankings.second?.name ?? '—'}</div>
			</div>
			<div class="place first">
				<div class="rank">1st Place</div>
				<div class="medal">🥇</div>
				<div class="name">{data.rankings.first?.name ?? '—'}</div>
			</div>
			<div class="place third">
				<div class="rank">3rd Place</div>
				<div class="medal">🥉</div>
				<div class="name">{data.rankings.third?.name ?? '—'}</div>
			</div>
		</div>
	</section>
{/if}

{#if data.tournament.status === 'pending'}
	<section class="card mt-2">
		<h2 style="font-size:1.05rem;">Registered Players ({data.registered.length})</h2>
		{#if data.registered.length === 0}
			<p class="empty">No players registered yet.</p>
		{:else}
			<table>
				<tbody>
					{#each data.registered as p}
						<tr>
							<td>{p.name}</td>
							<td style="color:var(--muted);">{p.email ?? ''}</td>
							<td>
								<form method="POST" action="?/removePlayer" use:enhance>
									<input type="hidden" name="playerId" value={p.id} />
									<button class="btn btn-danger btn-sm" type="submit">Remove</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}

		<div class="flex-row mt-1">
			<form method="POST" action="?/addPlayer" use:enhance class="flex-row" style="flex:1;">
				<select name="playerId" bind:value={selectedPlayerId} required style="flex:1;">
					<option value="" disabled selected>Select a player to add…</option>
					{#each data.availablePlayers as p}
						<option value={p.id}>{p.name} ({p.rating})</option>
					{/each}
				</select>
				<button class="btn btn-outline" type="submit" disabled={data.availablePlayers.length === 0}
					>Add Player</button
				>
			</form>
		</div>
		{#if data.availablePlayers.length === 0 && data.registered.length === 0}
			<p style="color:var(--muted); font-size:0.85rem;">
				No players exist yet. <a href="/players">Create some players</a> first.
			</p>
		{/if}

		<div class="mt-1">
			<form method="POST" action="?/start" use:enhance>
				<button class="btn btn-primary" type="submit" disabled={data.registered.length < 2}>
					Start Tournament
				</button>
			</form>
			{#if data.registered.length < 2}
				<p style="color:var(--muted); font-size:0.85rem;">Need at least 2 players to start.</p>
			{/if}
		</div>
	</section>
{/if}

{#if data.tournament.status === 'ongoing'}
	<section class="card mt-2">
		<div class="spread">
			<div>
				<h2 style="font-size:1.05rem;">Round {data.tournament.current_round}</h2>
				<p style="color:var(--muted); font-size:0.88rem;">
					{data.registered.filter((p) => p.status === 'active').length} players still active.
				</p>
			</div>
			<form method="POST" action="?/playRound" use:enhance>
				<button class="btn btn-primary" type="submit">🎲 Play Next Round</button>
			</form>
		</div>

		<h3 class="mt-1" style="font-size:0.95rem;">Standings</h3>
		<table>
			<thead>
				<tr>
					<th>Player</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each data.registered as p}
					<tr>
						<td>{p.name}</td>
						<td style={p.status === 'active' ? 'color: var(--success); font-weight:600;' : 'color: var(--muted);'}>
							{playerStatusLabel(p)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

{#if roundsGrouped.length > 0}
	<section class="mt-2">
		<h2>Match History</h2>
		{#each roundsGrouped as [round, matches]}
			<h3 style="font-size:0.95rem; margin-top:1.2rem;">Round {round}</h3>
			<div class="card" style="padding:0;">
				<table>
					<thead>
						<tr>
							<th>Match</th>
							<th>Result</th>
						</tr>
					</thead>
					<tbody>
						{#each matches as m}
							<tr>
								<td>
									{#if m.is_third_place_match}<span class="badge">3rd place</span>{/if}
									{#if m.is_bye}
										{m.player1_name} <span style="color:var(--muted);">(bye)</span>
									{:else}
										{m.player1_name} vs {m.player2_name}
									{/if}
								</td>
								<td>
									{#if m.is_bye && m.is_third_place_match}
										<strong>{m.winner_name}</strong> takes 3rd by default
									{:else if m.is_bye}
										Advances automatically
									{:else}
										<strong>{m.winner_name}</strong> wins
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	</section>
{/if}
