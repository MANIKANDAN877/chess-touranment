<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let showForm = $state(false);

	function statusBadge(status) {
		return { pending: 'badge-pending', ongoing: 'badge-ongoing', completed: 'badge-completed' }[
			status
		];
	}
</script>

<section class="spread">
	<h1>Tournaments</h1>
	<button class="btn btn-primary" onclick={() => (showForm = !showForm)}>
		{showForm ? 'Cancel' : '+ New Tournament'}
	</button>
</section>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

{#if showForm}
	<div class="card mt-1">
		<h2 style="font-size:1.05rem;">Create Tournament</h2>
		<form method="POST" action="?/create" use:enhance>
			<div class="grid-form">
				<div>
					<label for="name">Name *</label>
					<input id="name" name="name" required placeholder="Summer Blitz Open" />
				</div>
				<div style="grid-column: span 2;">
					<label for="description">Description</label>
					<input id="description" name="description" placeholder="optional" />
				</div>
			</div>
			<div class="mt-1">
				<button class="btn btn-primary" type="submit">Create Tournament</button>
			</div>
		</form>
	</div>
{/if}

<section class="mt-2">
	{#if data.tournaments.length === 0}
		<div class="card empty">No tournaments yet. Create one above.</div>
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
					{#each data.tournaments as t}
						<tr>
							<td>
								<a href="/tournaments/{t.id}">{t.name}</a>
								{#if t.description}<div style="color:var(--muted); font-size:0.82rem;">{t.description}</div>{/if}
							</td>
							<td><span class="badge {statusBadge(t.status)}">{t.status}</span></td>
							<td>{t.current_round}</td>
							<td>
								<div class="flex-row">
									<a href="/tournaments/{t.id}" class="btn btn-outline btn-sm">Open</a>
									<form
										method="POST"
										action="?/delete"
										use:enhance
										onsubmit={(e) => {
											if (!confirm(`Delete tournament "${t.name}"? This cannot be undone.`)) e.preventDefault();
										}}
									>
										<input type="hidden" name="id" value={t.id} />
										<button class="btn btn-danger btn-sm" type="submit">Delete</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
