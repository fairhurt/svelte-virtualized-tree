<script lang="ts">
	import { VirtualizedTree } from '$lib';
	import type { TreeItem } from '$lib/types';
	import { createVirtualizedTree } from '$lib';
	import { Separator } from '$site/components/ui/separator/index.js';

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

	const virtualizedTree = createVirtualizedTree<CustomTreeItem>({
		data: treeData,
		accessorKey: 'displayName'
	});
</script>

<h4 class=" scroll-m-20 text-xl font-semibold tracking-tight">
	Basic Tree with {totalNodes} total elements.
</h4>
<Separator class="mb-1" />
<div class="h-[600px] overflow-scroll">
	<VirtualizedTree {virtualizedTree} />
</div>
