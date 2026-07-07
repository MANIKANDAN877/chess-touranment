<script>
	let { data } = $props();

	function statusBadge(status) {
		return { pending: 'badge-pending', ongoing: 'badge-ongoing', completed: 'badge-completed' }[
			status
		];
	}
</script>

<section class="card">
	<h1>Chess Tournament Manager</h1>
	<p style="color: var(--muted); max-width: 60ch;">
		Manage players, run tournaments with randomized pairings, and crown your champions. Built with
		SvelteKit and SQLite.
	</p>

	<div class="grid-form mt-2">
		<div class="card" style="text-align:center;">
			<div style="font-size:2rem; font-weight:700; font-family:'Fraunces',serif;">
				{data.playerCount}
			</div>
			<div style="color:var(--muted);">Registered Players</div>
		</div>
		<div class="card" style="text-align:center;">
			<div style="font-size:2rem; font-weight:700; font-family:'Fraunces',serif;">
				{data.tournamentCount}
			</div>
			<div style="color:var(--muted);">Tournaments</div>
		</div>
		<div class="card" style="text-align:center;">
			<div style="font-size:2rem; font-weight:700; font-family:'Fraunces',serif;">
				{data.ongoing}
			</div>
			<div style="color:var(--muted);">Ongoing Now</div>
		</div>
	</div>

	<div class="flex-row mt-2">
		<a href="/players" class="btn btn-primary">Manage Players</a>
		<a href="/tournaments" class="btn btn-outline">View Tournaments</a>
	</div>
</section>

<section class="mt-2">
	<div class="spread">
		<h2>Recent Tournaments</h2>
		<a href="/tournaments" class="btn btn-outline btn-sm">See all</a>
	</div>
	{#if data.recentTournaments.length === 0}
		<div class="card empty">No tournaments yet. Create one to get started.</div>
	{:else}
		<div class="card" style="padding:0;">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Status</th>
						<th>Round</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentTournaments as t}
						<tr>
							<td>{t.name}</td>
							<td><span class="badge {statusBadge(t.status)}">{t.status}</span></td>
							<td>{t.current_round}</td>
							<td><a href="/tournaments/{t.id}" class="btn btn-outline btn-sm">Open</a></td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
