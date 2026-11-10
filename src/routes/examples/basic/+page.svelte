<script lang="ts">
	import TreeDemo from '#site/components/tree-demo.svelte';
</script>

<svelte:head>
	<title>Playground · Svelte Virtualized Tree</title>
</svelte:head>

<section class="py-10">
	<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Playground</h1>
	<p class="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
		A generated file tree with up to a million nodes. Watch the counters under it: however big the
		tree gets, only the rows on screen are in the DOM. Click to expand, or focus the tree and use
		the arrow keys, Home, End and Enter.
	</p>

	<TreeDemo
		sizes={[1_000, 10_000, 100_000, 1_000_000]}
		treeClass="h-[calc(100vh-25rem)] min-h-[360px]"
		class="mt-8"
	/>
</section>
