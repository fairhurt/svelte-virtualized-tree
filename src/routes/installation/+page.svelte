<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button } from '#site/components/ui/button/index.js';
	import InstallCommand from '#site/components/install-command.svelte';
</script>

<svelte:head>
	<title>Install · Svelte Virtualized Tree</title>
</svelte:head>

<article class="mx-auto max-w-3xl py-12">
	<h1 class="text-4xl font-bold tracking-tight">Installation</h1>
	<p class="mt-4 text-lg leading-relaxed text-muted-foreground">
		Add the package with your package manager. It needs Svelte 5 and has no other dependencies.
	</p>

	<InstallCommand tabs class="mt-8" />

	<h2 class="mt-12 text-2xl font-semibold tracking-tight">Pair it with a virtual list</h2>
	<p class="mt-3 leading-relaxed text-muted-foreground">
		The tree works out which nodes are visible. To render only the rows on screen, hand that list to
		a virtual list such as
		<a
			href="https://tanstack.com/virtual"
			target="_blank"
			rel="noreferrer noopener"
			class="text-foreground underline decoration-primary/60 underline-offset-4 hover:decoration-primary"
			>TanStack Virtual</a
		>. Small trees don't need one.
	</p>

	<Button href={resolve('/usage')} class="mt-8">
		Next: usage
		<ArrowRight class="ml-2 h-4 w-4" />
	</Button>
</article>
