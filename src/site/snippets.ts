// Code samples shown on the site. They are highlighted at build time.

export const quickStart = `<script lang="ts">
	import { createTreeVirtualizer } from 'svelte-virtualized-tree';

	const tree = createTreeVirtualizer({
		data: [
			{ id: 1, name: 'src', children: [{ id: 2, name: 'app.ts' }] },
			{ id: 3, name: 'README.md' }
		],
		accessorKey: 'name'
	});
</script>

{#each tree.visibleItems as node (node.id)}
	<button
		style:padding-left="{tree.getLevel(node.id) * 16}px"
		onclick={() => tree.toggleNode(node.id)}
	>
		{tree.getLabel(node)}
	</button>
{/each}`;

export const virtualList = `<script lang="ts">
	import { untrack } from 'svelte';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { createTreeVirtualizer, type VirtualTreeItem } from 'svelte-virtualized-tree';

	type Item = { name: string };
	const data: VirtualTreeItem<Item>[] = [
		{ id: 1, name: 'src', children: [{ id: 2, name: 'app.ts' }] },
		{ id: 3, name: 'README.md' }
	];

	const tree = createTreeVirtualizer<Item>({ data, accessorKey: 'name' });

	let scrollEl = $state<HTMLDivElement | null>(null);
	const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: tree.visibleItems.length,
		estimateSize: () => 28,
		getScrollElement: () => scrollEl
	});

	// Keep the list's row count in step with the tree.
	$effect(() => {
		const count = tree.visibleItems.length;
		untrack(() => $virtualizer.setOptions({ count }));
	});
</script>

<div bind:this={scrollEl} style="height: 400px; overflow: auto;">
	<div style="position: relative; height: {$virtualizer.getTotalSize()}px;">
		{#each $virtualizer.getVirtualItems() as row (row.key)}
			{@const node = tree.visibleItems[row.index]}
			<button
				style="position: absolute; top: 0; height: {row.size}px;
					transform: translateY({row.start}px);
					padding-left: {tree.getLevel(node.id) * 16}px;"
				onclick={() => tree.toggleNode(node.id)}
			>
				{tree.getLabel(node)}
			</button>
		{/each}
	</div>
</div>`;

export const dataShapes = `import type { VirtualTreeItem } from 'svelte-virtualized-tree';

type Item = { name: string };

// Nested: each node lists its children.
const nested: VirtualTreeItem<Item>[] = [
	{ id: 1, name: 'src', children: [{ id: 2, name: 'app.ts' }] }
];

// Flat: every node at the top level, linked by parentId.
const flat: VirtualTreeItem<Item>[] = [
	{ id: 1, name: 'src' },
	{ id: 2, name: 'app.ts', parentId: 1 }
];

// Start a node expanded.
const open: VirtualTreeItem<Item>[] = [
	{ id: 1, name: 'src', isExpanded: true, children: [{ id: 2, name: 'app.ts' }] }
];`;

export const controlling = `const tree = createTreeVirtualizer<Item>({
	data,
	accessorKey: 'name',
	onChange: (tree) => console.log(tree.selectedId, tree.expandedIds.size)
});

tree.expandTo(42); // open every ancestor of node 42
tree.select(42); // and select it

tree.expandAll();
tree.collapseAll();

tree.setOptions({ data: nextData }); // swap the data, keep what's still there`;

export const api: { member: string; description: string }[] = [
	{ member: 'visibleItems', description: 'The nodes currently shown, in display order.' },
	{ member: 'selectedId', description: "The selected node's id, or null." },
	{ member: 'expandedIds', description: 'A read-only reactive set of expanded ids.' },
	{
		member: 'toggleNode(id)',
		description: 'Select a node and expand or collapse it, as a row click would.'
	},
	{ member: 'toggle(id)', description: 'Expand or collapse a node without selecting it.' },
	{
		member: 'expand(id) / collapse(id)',
		description: 'Expand a node, or collapse it and its expanded descendants.'
	},
	{ member: 'expandAll() / collapseAll()', description: 'Expand or collapse every node.' },
	{ member: 'expandTo(id)', description: "Expand a node's ancestors so it becomes visible." },
	{ member: 'select(id)', description: 'Select a node, or pass null to clear the selection.' },
	{ member: 'isExpanded(id) / isSelected(id)', description: 'State helpers.' },
	{ member: 'hasChildren(id) / getChildren(id)', description: "A node's children." },
	{ member: 'getParent(id)', description: "The parent's id, or null for roots." },
	{ member: 'getLevel(id)', description: 'Depth of a node, starting at 0 for roots.' },
	{ member: 'getLabel(node)', description: "The node's accessorKey field as a string." },
	{ member: 'getNode(id)', description: 'Look up a node by id.' },
	{
		member: 'setOptions({ data })',
		description: 'Replace the data; expanded and selected ids that remain stay.'
	}
];
