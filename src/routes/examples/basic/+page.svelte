<script lang="ts">
	import { untrack } from 'svelte';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import Plus from '@lucide/svelte/icons/plus';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Check from '@lucide/svelte/icons/check';
	import { createTreeVirtualizer, type VirtualTreeItem } from '#lib';
	import { Separator } from '#site/components/ui/separator/index.js';

	type CustomTreeItem = {
		displayName: string;
	};

	const ROW_HEIGHT = 35;

	let nextId = 1;

	function generateTreeData(depth: number, count: number): VirtualTreeItem<CustomTreeItem>[] {
		const items: VirtualTreeItem<CustomTreeItem>[] = [];

		for (let i = 0; i < count; i++) {
			// Sequential ids: random ones collide once there are thousands of nodes.
			const id = nextId++;
			items.push({
				id,
				displayName: `Node ${id}`,
				children: depth < 4 ? generateTreeData(depth + 1, Math.floor(Math.random() * 4)) : []
			});
		}
		return items;
	}

	const treeData = generateTreeData(0, 2000);
	const totalNodes = nextId - 1;

	const tree = createTreeVirtualizer<CustomTreeItem>({
		data: treeData,
		accessorKey: 'displayName'
	});

	let scrollEl = $state<HTMLDivElement | null>(null);

	const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: tree.visibleItems.length,
		estimateSize: () => ROW_HEIGHT,
		getScrollElement: () => scrollEl,
		overscan: 5
	});

	// Keep the virtual list's row count in step with the expanded nodes.
	$effect(() => {
		const count = tree.visibleItems.length;
		untrack(() => $virtualizer.setOptions({ count }));
	});
</script>

<h4 class="scroll-m-20 text-xl font-semibold tracking-tight">
	Basic Tree with {totalNodes} total elements.
</h4>
<Separator class="mb-1" />
<div bind:this={scrollEl} class="h-[600px] overflow-auto" data-testid="tree-scroll">
	<div
		role="tree"
		style="position: relative; height: {$virtualizer.getTotalSize()}px; width: 100%;"
	>
		{#each $virtualizer.getVirtualItems() as row (row.key)}
			{@const node = tree.visibleItems[row.index]}
			{#if node}
				{@const hasChildren = tree.hasChildren(node.id)}
				{@const isExpanded = tree.isExpanded(node.id)}
				{@const isSelected = tree.isSelected(node.id)}
				{@const level = tree.getLevel(node.id)}
				<div
					role="treeitem"
					aria-level={level + 1}
					aria-selected={isSelected}
					aria-expanded={hasChildren ? isExpanded : undefined}
					style="position: absolute; top: 0; left: 0; width: 100%; height: {row.size}px; transform: translateY({row.start}px); padding-left: {level *
						20}px;"
				>
					<button
						type="button"
						class="flex items-center gap-1 whitespace-nowrap p-1"
						class:bg-slate-300={isSelected}
						onclick={() => tree.toggleNode(node.id)}
					>
						{#if hasChildren && isExpanded}
							<ChevronDown class="h-4 w-4" />
						{:else if hasChildren}
							<Plus class="h-4 w-4" />
						{:else}
							<span class="h-4 w-4" aria-hidden="true"></span>
						{/if}
						<span class="select-none">{tree.getLabel(node)}</span>
						{#if isSelected}
							<Check class="h-4 w-4" style="stroke:#22c55e" />
						{/if}
					</button>
				</div>
			{/if}
		{/each}
	</div>
</div>
