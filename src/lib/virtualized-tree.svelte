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
	import type { TreeItem } from './types';
	import { VirtualizedTreeInstance } from '.';

	// Sample tree data
	export let virtualizedTree: VirtualizedTreeInstance<any>;
	let expandedNodes = new Set<number | string>();
	let visibleNodes: TreeItem<any>[] = [];
	function getVisibleNodes<T>(virtualizedTreeData: TreeItem<T>[]) {
		let nodesThatShouldBeVisible = virtualizedTreeData.filter((node: TreeItem<T>) => {
			if (node.parentId === null) {
				return true;
			}
			return expandedNodes.has(node.parentId);
		});
		visibleNodes = nodesThatShouldBeVisible;
	}

	$: {
		getVisibleNodes(virtualizedTree.data);
	}
	// Toggle node expansion
	function toggleNode(node: TreeItem<any>, index: number) {
		if (expandedNodes.has(node.id)) {
			expandedNodes.delete(node.id);
			if (node.children && node.children.length > 0) {
				const removeChildren = (children: TreeItem<any>[]) => {
					children.forEach((child) => {
						const index = visibleNodes.findIndex((node) => node.id === child.id);
						if (index !== -1) {
							expandedNodes.delete(child.id);
							let visibleNodesCopy = [...visibleNodes];
							visibleNodesCopy.splice(index, 1);
							visibleNodes = visibleNodesCopy;
							if (child.children && child.children.length > 0) {
								removeChildren(child.children);
							}
						}
					});
				};

				removeChildren(node.children);
			}
		} else {
			expandedNodes.add(node.id);
			if (node.children && node.children.length > 0) {
				visibleNodes = [
					...visibleNodes.slice(0, index + 1),
					...node.children,
					...visibleNodes.slice(index + 1)
				];
			} else {
				visibleNodes = [...visibleNodes];
			}
		}
	}

	let virtualListEl: HTMLDivElement;

	$: virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: 0,
		getScrollElement: () => virtualListEl,
		estimateSize: () => 35,
		overscan: 5
	});

	$: {
		// Prevents re-creating the virtualizer if the size changes.
		$virtualizer.setOptions({
			count: visibleNodes.length
		});
	}

	const getParentIds = (newExpanded: Set<number>, node: TreeItem<any>) => {
		// If no nodes are selected return empty
		if (node === undefined) return [];
		//Only the root node is null, so just return the root nodes id
		if (node.parent === null) return newExpanded.add(node.id);
		//Otherwise push the current nodes id
		newExpanded.add(node.id);
		//Find the parent of the node
		let parentNode = virtualizedTree.data.find((value) => value.id === node.parent);
		//Add the parent node to the list of expanded nodes
		if (parentNode !== undefined) getParentIds(newExpanded, parentNode);
	};
</script>

<div style="height:100%; overflow:auto;" bind:this={virtualListEl}>
	<div style="position: relative; height: {$virtualizer.getTotalSize()}px; width: 100%;">
		{#each $virtualizer.getVirtualItems() as row (row.index)}
			{@const hasChildren = !!visibleNodes[row.index].children?.length}
			{@const id = visibleNodes[row.index].id}
			{@const icon = visibleNodes[row.index].icon}
			{@const isExpanded = expandedNodes.has(id)}
			<!-- {@const isSelected = } -->
			{@const content = visibleNodes[row.index][virtualizedTree.accessorKey]}
			<div
				class:list-item-even={row.index % 2 === 0}
				class:list-item-odd={row.index % 2 === 1}
				style="position: absolute; top: 0; left: 0; width: 100%; height: {row.size}px; transform: translateY({row.start}px); padding-left: {visibleNodes[
					row.index
				].level * 20}px;"
			>
				<button
					style="display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; border-radius: 0.375rem; padding: 0.25rem; background-color: {virtualizedTree.getSelectedId() ===
					id
						? 'var(--color-secondary)'
						: 'transparent'};"
					on:click={() => {
						virtualizedTree.setSelectedId(id);
						toggleNode(visibleNodes[row.index], row.index);
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
					{#if virtualizedTree.getSelectedId() === id}
						<svelte:component this={icons['check']} class="h-4 w-4 stroke-green-500" />
					{/if}
				</button>
			</div>
		{/each}
	</div>
</div>
