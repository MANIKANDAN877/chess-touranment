<script>
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Chess Tournament Manager</title>
</svelte:head>

<nav class="topnav">
	<div class="container">
		<a href="/" class="brand">♞ Chess Tournament Manager</a>
		<div class="links">
			<a href="/" class:active={$page.url.pathname === '/'}>Home</a>
			<a href="/players" class:active={$page.url.pathname.startsWith('/players')}>Players</a>
			<a href="/tournaments" class:active={$page.url.pathname.startsWith('/tournaments')}
				>Tournaments</a
			>
		</div>
	</div>
</nav>

<main class="container mt-2">
	{@render children()}
</main>
