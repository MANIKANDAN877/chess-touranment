<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let editing = $state(null); // player object being edited, or null for "create"

	function startEdit(p) {
		editing = { ...p };
	}
	function cancelEdit() {
		editing = null;
	}
</script>

<section class="spread">
	<h1>Players</h1>
</section>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

<div class="card mt-1">
	<h2 style="font-size:1.05rem;">{editing ? `Edit ${editing.name}` : 'Add a Player'}</h2>
	<form
		method="POST"
		action={editing ? '?/update' : '?/create'}
		use:enhance={() => {
			return async ({ update }) => {
				await update();
				editing = null;
			};
		}}
	>
		{#if editing}
			<input type="hidden" name="id" value={editing.id} />
		{/if}
		<div class="grid-form">
			<div>
				<label for="name">Name *</label>
				<input id="name" name="name" required value={editing?.name ?? ''} placeholder="Magnus Carlsen" />
			</div>
			<div>
				<label for="email">Email</label>
				<input id="email" name="email" type="email" value={editing?.email ?? ''} placeholder="optional" />
			</div>
			<div>
				<label for="rating">Rating</label>
				<input id="rating" name="rating" type="number" value={editing?.rating ?? 1200} />
			</div>
		</div>
		<div class="flex-row mt-1">
			<button class="btn btn-primary" type="submit">{editing ? 'Save Changes' : 'Add Player'}</button>
			{#if editing}
				<button class="btn btn-outline" type="button" onclick={cancelEdit}>Cancel</button>
			{/if}
		</div>
	</form>
</div>

<section class="mt-2">
	<h2>All Players ({data.players.length})</h2>
	{#if data.players.length === 0}
		<div class="card empty">No players yet. Add your first player above.</div>
	{:else}
		<div class="card" style="padding:0;">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Email</th>
						<th>Rating</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each data.players as p}
						<tr>
							<td>{p.name}</td>
							<td>{p.email ?? '—'}</td>
							<td>{p.rating}</td>
							<td>
								<div class="flex-row">
									<button class="btn btn-outline btn-sm" onclick={() => startEdit(p)}>Edit</button>
									<form
										method="POST"
										action="?/delete"
										use:enhance
										onsubmit={(e) => {
											if (!confirm(`Delete ${p.name}?`)) e.preventDefault();
										}}
									>
										<input type="hidden" name="id" value={p.id} />
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
