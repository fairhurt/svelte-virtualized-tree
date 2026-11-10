<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Braces from '@lucide/svelte/icons/braces';
	import Feather from '@lucide/svelte/icons/feather';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import Puzzle from '@lucide/svelte/icons/puzzle';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Zap from '@lucide/svelte/icons/zap';
	import { Button } from '#site/components/ui/button/index.js';
	import CodeBlock from '#site/components/code-block.svelte';
	import InstallCommand from '#site/components/install-command.svelte';
	import TreeDemo from '#site/components/tree-demo.svelte';

	let { data } = $props();

	const features = [
		{
			icon: Puzzle,
			title: 'Headless',
			body: 'It tracks what is expanded, selected and visible. The markup, styling and virtual list are yours.'
		},
		{
			icon: Zap,
			title: 'Built on runes',
			body: 'State is plain Svelte 5 reactivity. Read tree.visibleItems in markup or $derived, with no stores.'
		},
		{
			icon: GitBranch,
			title: 'Nested or flat data',
			body: 'Pass children arrays or a flat list linked by parentId. Levels are worked out for you.'
		},
		{
			icon: Feather,
			title: 'About 2 kB',
			body: 'One small class, gzipped. Svelte is the only dependency.'
		},
		{
			icon: ShieldCheck,
			title: 'Typed end to end',
			body: 'Your own node fields flow through every method, so labels and lookups stay type-safe.'
		},
		{
			icon: Braces,
			title: 'A complete API',
			body: 'expandTo, expandAll, toggle, select and onChange cover deep links, toolbars and keyboard support.'
		}
	];
</script>

<!-- Hero -->
<section
	class="grid grid-cols-[minmax(0,1fr)] items-center gap-10 py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:py-20"
>
	<div class="animate-rise min-w-0">
		<p
			class="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-orange-300"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
			2.0 is here, rebuilt for Svelte 5
		</p>
		<h1 class="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl">
			A million nodes.
			<span class="text-gradient block">A few dozen rows in the DOM.</span>
		</h1>
		<p class="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
			Headless tree state for Svelte 5. It works out which nodes are visible; you render them with
			any virtual list. The tree on this page is real, so go ahead and switch it to 1M.
		</p>

		<InstallCommand class="mt-7 max-w-md" />

		<div class="mt-5 flex flex-wrap gap-3">
			<Button href={resolve('/usage')} size="lg" class="shadow-lg shadow-primary/25">
				Get started
				<ArrowRight class="ml-2 h-4 w-4" />
			</Button>
			<Button href={resolve('/examples/basic')} size="lg" variant="outline">Open playground</Button>
		</div>
	</div>

	<div class="animate-rise min-w-0" style="animation-delay: 120ms;">
		<TreeDemo />
		<p class="mt-3 text-center text-xs text-muted-foreground">
			Click a folder, or focus the tree and use the arrow keys.
		</p>
	</div>
</section>

<!-- Features -->
<section class="py-12">
	<h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">Small, and out of your way</h2>
	<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each features as feature (feature.title)}
			<div
				class="rounded-xl border bg-card/60 p-5 backdrop-blur transition-colors hover:border-primary/40"
			>
				<feature.icon class="h-5 w-5 text-primary" />
				<h3 class="mt-3 font-semibold">{feature.title}</h3>
				<p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Code -->
<section
	class="grid grid-cols-[minmax(0,1fr)] items-start gap-8 py-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]"
>
	<div>
		<h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">A tree in twenty lines</h2>
		<p class="mt-4 leading-relaxed text-muted-foreground">
			Create the tree, loop over <code class="font-mono text-sm text-foreground">visibleItems</code
			>, and call <code class="font-mono text-sm text-foreground">toggleNode</code> on click. Add a virtual
			list when the data gets big.
		</p>
		<Button href={resolve('/usage')} variant="link" class="mt-2 px-0">
			Read the usage guide
			<ArrowRight class="ml-1.5 h-4 w-4" />
		</Button>
	</div>
	<CodeBlock {...data.quickStart} title="Tree.svelte" />
</section>
