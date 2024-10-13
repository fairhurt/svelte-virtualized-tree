<script lang="ts">
	import type { TreeItem } from '$lib/types';
	import { createVirtualizedTree } from '$lib';
	import { Separator } from '$site/components/ui/separator/index.js';
	import Plus from 'lucide-svelte/icons/plus';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import Check from 'lucide-svelte/icons/check';
	import Minus from 'lucide-svelte/icons/minus';
	import { createVirtualizer } from '@tanstack/svelte-virtual';

	const icons = {
		plus: Plus,
		'chevron-right': ChevronRight,
		'chevron-down': ChevronDown,
		check: Check,
		minus: Minus
	};
	type CustomTreeItem = {
		displayName: string;
	};
	let totalNodes = 0;
	function generateTreeData(
		level: number,
		parentId: number | null,
		count: number
	): TreeItem<CustomTreeItem>[] {
		const items: TreeItem<CustomTreeItem>[] = [];

		for (let i = 0; i < count; i++) {
			const id = Math.floor(Math.random() * 10000);
			const item: TreeItem<CustomTreeItem> = {
				id,
				displayName: `Node ${id}`,
				icon: 'plus',
				level,
				parentId,
				children: level < 4 ? generateTreeData(level + 1, id, Math.floor(Math.random() * 3)) : []
			};
			totalNodes++;
			items.push(item);
		}
		return items;
	}

	const treeData: TreeItem<CustomTreeItem>[] = generateTreeData(0, null, 3000);

	$: virtualizedTree = createVirtualizedTree<CustomTreeItem>({
		data: treeData,
		accessorKey: 'displayName'
	});

	let virtualListEl: HTMLDivElement;
	$: visibleNodes = $virtualizedTree.getVisibleNodes();
	$: console.log('visibleNodes updated', visibleNodes);
	$: console.log('selectedid: ', $virtualizedTree.selectedId);
	$: virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: 0,
		getScrollElement: () => virtualListEl,
		estimateSize: () => 35,
		overscan: 5
	});
	$: {
		// Prevents re-creating the virtualizer if the size changes.
		$virtualizer.setOptions({
			count: $virtualizedTree.visibleNodes.length
		});
	}
</script>

<h4 class=" scroll-m-20 text-xl font-semibold tracking-tight">
	Basic Tree with {totalNodes} total elements.
</h4>
<Separator class="mb-1" />
<div class="h-[600px] overflow-scroll">
	<div style="height:100%; overflow:auto;" bind:this={virtualListEl}>
		<div style="position: relative; height: {$virtualizer.getTotalSize()}px; width: 100%;">
			{#each $virtualizer.getVirtualItems() as row (row.index)}
				{@const node = visibleNodes[row.index]}
				{@const hasChildren = !!node.children?.length}
				{@const id = node.id}
				{@const icon = node.icon}
				{@const isExpanded = $virtualizedTree.expandedNodes.has(id)}
				{@const content = node[$virtualizedTree.accessorKey]}
				{@const selectedId = $virtualizedTree.getSelectedId()}

				<div
					class:list-item-even={row.index % 2 === 0}
					class:list-item-odd={row.index % 2 === 1}
					style="position: absolute; top: 0; left: 0; width: 100%; height: {row.size}px; transform: translateY({row.start}px); padding-left: {$virtualizedTree
						.visibleNodes[row.index].level * 20}px;"
				>
					<button
						style="display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; padding: 0.25rem; background-color: {$virtualizedTree.getSelectedId() ===
						id
							? 'rgb(203 213 225);'
							: ''};"
						on:click={() => {
							$virtualizedTree.setSelectedId(id);
							$virtualizedTree.toggleNode(id, row.index);
						}}
						aria-expanded={isExpanded}
					>
						<!-- Add icon. -->
						{#if icon === 'plus' && hasChildren && isExpanded}
							<svelte:component this={icons['chevron-down']} class="h-4 w-4" />
						{:else if icon === 'plus' && hasChildren && !isExpanded}
							<svelte:component this={icons['plus']} class="h-4 w-4 " />
						{/if}
						<span class="select-none">{content}</span>
						<!-- Selected icon. -->
						{#if selectedId === id}
							<svelte:component this={icons['check']} class="h-4 w-4 " style="stroke:#22c55e" />
						{/if}
					</button>
				</div>
			{/each}
		</div>
	</div>
</div>
