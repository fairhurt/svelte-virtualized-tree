<script context="module" lang="ts">
	import Plus from 'lucide-svelte/icons/plus';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import Check from 'lucide-svelte/icons/check';
	import Minus from 'lucide-svelte/icons/minus';
	export const icons = {
		plus: Plus,
		'chevron-right': ChevronRight,
		'chevron-down': ChevronDown,
		check: Check,
		minus: Minus
	};
</script>

<script lang="ts">
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { VirtualizedTreeInstance } from '.';

	export let virtualizedTree: VirtualizedTreeInstance<any>;

	let virtualListEl: HTMLDivElement;

	$: virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: virtualizedTree.visibleNodes.length,
		getScrollElement: () => virtualListEl,
		estimateSize: () => 35,
		overscan: 5
	});
	// $: {
	// 	// Prevents re-creating the virtualizer if the size changes.
	// 	$virtualizer.setOptions({
	// 		count: virtualizedTree.visibleNodes.length
	// 	});
	// }
</script>

<div style="height:100%; overflow:auto;" bind:this={virtualListEl}>
	<div style="position: relative; height: {$virtualizer.getTotalSize()}px; width: 100%;">
		{#each $virtualizer.getVirtualItems() as row (row.index)}
			{@const hasChildren = !!virtualizedTree.visibleNodes[row.index].children?.length}
			{@const id = virtualizedTree.visibleNodes[row.index].id}
			{@const icon = virtualizedTree.visibleNodes[row.index].icon}
			{@const isExpanded = virtualizedTree.expandedNodes.has(id)}
			<!-- {@const isSelected = } -->
			{@const content = virtualizedTree.visibleNodes[row.index][virtualizedTree.accessorKey]}
			{@const selectedId = virtualizedTree.getSelectedId()}
			<div
				class:list-item-even={row.index % 2 === 0}
				class:list-item-odd={row.index % 2 === 1}
				style="position: absolute; top: 0; left: 0; width: 100%; height: {row.size}px; transform: translateY({row.start}px); padding-left: {virtualizedTree
					.visibleNodes[row.index].level * 20}px;"
			>
				<button
					style="display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; padding: 0.25rem; background-color: {virtualizedTree.getSelectedId() ===
					id
						? 'rgb(203 213 225);'
						: ''};"
					on:click={() => {
						virtualizedTree.setSelectedId(id);
						virtualizedTree.toggleNode(id, row.index);
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
