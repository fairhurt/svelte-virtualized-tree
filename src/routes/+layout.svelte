<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ListTree from '@lucide/svelte/icons/list-tree';
	import { cn } from '#site/utils.js';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/jetbrains-mono';
	import '../app.css';

	let { data, children } = $props();

	const links = [
		{ href: resolve('/installation'), label: 'Install' },
		{ href: resolve('/usage'), label: 'Usage' },
		{ href: resolve('/examples/basic'), label: 'Playground' }
	];

	const GITHUB = 'https://github.com/fairhurt/svelte-virtualized-tree';
	const NPM = 'https://www.npmjs.com/package/svelte-virtualized-tree';
</script>

<svelte:head>
	<title>Svelte Virtualized Tree</title>
	<meta
		name="description"
		content="Headless, runes-based tree state for Svelte 5. Render a million nodes with a handful of DOM rows."
	/>
</svelte:head>

<div class="backdrop" aria-hidden="true">
	<div class="glow glow-a"></div>
	<div class="glow glow-b"></div>
</div>

<div class="flex min-h-screen flex-col">
	<header class="sticky top-0 z-40 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl">
		<div class="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-6 sm:px-6">
			<a href={resolve('/')} class="flex items-center gap-2 font-semibold tracking-tight">
				<span
					class="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-amber-400 via-primary to-pink-500 text-white shadow-lg shadow-primary/30"
				>
					<ListTree class="h-4 w-4" />
				</span>
				<span class="hidden sm:inline">svelte-virtualized-tree</span>
				<span
					class="hidden rounded-full border px-2 py-0.5 font-mono text-[11px] font-normal text-muted-foreground md:inline"
				>
					v{data.version}
				</span>
			</a>

			<nav class="ml-auto flex items-center gap-0.5 text-sm sm:gap-1">
				{#each links as link (link.href)}
					<a
						href={link.href}
						aria-current={page.url.pathname === link.href ? 'page' : undefined}
						class={cn(
							'rounded-md px-2.5 py-1.5 transition-colors hover:text-foreground sm:px-3',
							page.url.pathname === link.href
								? 'bg-white/[0.07] text-foreground'
								: 'text-muted-foreground'
						)}
					>
						{link.label}
					</a>
				{/each}
				<a
					href={GITHUB}
					target="_blank"
					rel="noreferrer noopener"
					class="ml-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.07] hover:text-foreground"
					aria-label="GitHub repository"
				>
					<svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
						<path
							d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.09-.12-.3-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.42-2.7 5.4-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"
						/>
					</svg>
				</a>
			</nav>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
		{@render children()}
	</main>

	<footer class="border-t border-white/[0.06]">
		<div
			class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6"
		>
			<span>MIT licensed. Built with Svelte 5.</span>
			<span class="flex gap-4">
				<a href={GITHUB} target="_blank" rel="noreferrer noopener" class="hover:text-foreground"
					>GitHub</a
				>
				<a href={NPM} target="_blank" rel="noreferrer noopener" class="hover:text-foreground">npm</a
				>
			</span>
		</div>
	</footer>
</div>
