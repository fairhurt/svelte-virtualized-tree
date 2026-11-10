<script lang="ts">
	import CodeBlock from '#site/components/code-block.svelte';
	import { api } from '#site/snippets.js';

	let { data } = $props();

	const h2 = 'mt-14 scroll-mt-20 text-2xl font-semibold tracking-tight';
	const body = 'mt-3 leading-relaxed text-muted-foreground';
	const inline = 'font-mono text-sm text-foreground';
</script>

<svelte:head>
	<title>Usage · Svelte Virtualized Tree</title>
</svelte:head>

<article class="mx-auto max-w-3xl py-12">
	<h1 class="text-4xl font-bold tracking-tight">Usage</h1>
	<p class="mt-4 text-lg leading-relaxed text-muted-foreground">
		Create a tree from your data, render its visible nodes, and call its methods from your event
		handlers. Its state is reactive, so the page updates on its own.
	</p>

	<h2 class={h2}>Quick start</h2>
	<p class={body}>
		<code class={inline}>visibleItems</code> holds the nodes to show, in order.
		<code class={inline}>toggleNode</code> selects a node and opens or closes it.
	</p>
	<CodeBlock {...data.quickStart} title="Tree.svelte" class="mt-5" />

	<h2 class={h2}>With a virtual list</h2>
	<p class={body}>
		For large trees, give <code class={inline}>visibleItems</code> to a virtual list so only the rows
		on screen are rendered. This example uses TanStack Virtual.
	</p>
	<CodeBlock {...data.virtualList} title="VirtualTree.svelte" class="mt-5" />

	<h2 class={h2}>Data shapes</h2>
	<p class={body}>
		Data can be nested or flat. Each node needs an <code class={inline}>id</code>; everything else
		is your own fields.
	</p>
	<CodeBlock {...data.dataShapes} title="data.ts" class="mt-5" />

	<h2 class={h2}>Controlling the tree</h2>
	<p class={body}>
		Every change goes through a method, and <code class={inline}>onChange</code> runs after each one.
	</p>
	<CodeBlock {...data.controlling} title="tree.ts" class="mt-5" />

	<h2 class={h2}>API</h2>
	<div class="mt-5 overflow-x-auto rounded-xl border bg-black/40">
		<table class="w-full text-left text-sm">
			<thead class="border-b text-xs uppercase tracking-wide text-muted-foreground">
				<tr>
					<th class="px-4 py-2.5 font-medium">Member</th>
					<th class="px-4 py-2.5 font-medium">What it does</th>
				</tr>
			</thead>
			<tbody>
				{#each api as row (row.member)}
					<tr class="border-b border-white/[0.05] last:border-0">
						<td class="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-orange-300">
							{row.member}
						</td>
						<td class="px-4 py-2.5 text-muted-foreground">{row.description}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</article>
