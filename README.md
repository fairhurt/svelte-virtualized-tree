# Svelte Virtualized Tree (UNDER ACTIVE DEVELOPMENT)

Headless tree state for displaying large datasets in a tree structure with Svelte 5. Pair it with a
virtual list such as [`@tanstack/svelte-virtual`](https://tanstack.com/virtual) to render only the
rows in view.

## Installation

```bash
npm install svelte-virtualized-tree
```

Requires Svelte 5.

## Usage

```svelte
<script lang="ts">
	import { untrack } from 'svelte';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { createTreeVirtualizer, type VirtualTreeItem } from 'svelte-virtualized-tree';

	type Item = { name: string };

	const data: VirtualTreeItem<Item>[] = [
		{ id: 1, name: 'Fruit', children: [{ id: 2, name: 'Apple' }] },
		{ id: 3, name: 'Vegetables' }
	];

	const tree = createTreeVirtualizer<Item>({ data, accessorKey: 'name' });

	let scrollEl = $state<HTMLDivElement | null>(null);
	const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: tree.visibleItems.length,
		estimateSize: () => 32,
		getScrollElement: () => scrollEl
	});

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
				style="position: absolute; top: 0; transform: translateY({row.start}px); padding-left: {tree.getLevel(
					node.id
				) * 16}px;"
				onclick={() => tree.toggleNode(node.id)}
			>
				{tree.hasChildren(node.id) ? (tree.isExpanded(node.id) ? '▾' : '▸') : ''}
				{tree.getLabel(node)}
			</button>
		{/each}
	</div>
</div>
```

Data can be nested (each node lists its `children`) or flat (every node at the top level, with a
`parentId`). Set `isExpanded: true` on a node to start it expanded. Levels are worked out for you.

### API

`createTreeVirtualizer(options)` returns a `TreeVirtualizer`. Its state is reactive, so read it
directly in markup, `$derived` or `$effect`.

**Options:** `data` (required), `accessorKey` (the field `getLabel` reads) and `onChange` (called
after the selection or expanded state changes).

| Member                                | Description                                                    |
| ------------------------------------- | -------------------------------------------------------------- |
| `visibleItems`                        | The nodes currently shown, in display order.                   |
| `selectedId`                          | The selected node's id, or `null`.                             |
| `expandedIds`                         | A read-only reactive set of expanded ids.                      |
| `toggleNode(id)`                      | Select a node and expand or collapse it, as a row click would. |
| `toggle(id)`                          | Expand or collapse a node without selecting it.                |
| `expand(id)` / `collapse(id)`         | Expand a node, or collapse it and its expanded descendants.    |
| `expandAll()` / `collapseAll()`       | Expand or collapse every node.                                 |
| `select(id)`                          | Select a node, or pass `null` to clear the selection.          |
| `isExpanded(id)` / `isSelected(id)`   | State helpers.                                                 |
| `hasChildren(id)` / `getChildren(id)` | A node's children.                                             |
| `getLevel(id)`                        | Depth of a node, starting at 0 for roots.                      |
| `getLabel(node)`                      | The node's `accessorKey` field as a string.                    |
| `expandTo(id)`                        | Expand a node's ancestors so it becomes visible.               |
| `getParent(id)`                       | The parent's id, or `null` for roots.                          |
| `getNode(id)`                         | Look up a node by id.                                          |
| `setOptions({ data })`                | Replace the data; expanded and selected ids that remain stay.  |

### Upgrading from 1.x

- Svelte 5 is required. `createTreeVirtualizer` returns the tree itself rather than a store, so use
  `tree.visibleItems` instead of `$tree.visibleItems`.
- `createTreeVirtualizer` takes one type parameter, the item data type.
- Nodes no longer need `level`; use `tree.getLevel(node.id)`. `parentId` is only needed for flat
  data. The unused `icon` and `isLeaf` fields were removed from `VirtualTreeItem`.
- `getScrollElement`, `observeElementRect`, `indexAttribute`, `enabled` and `debug` were unused and
  have been removed. The virtual list (e.g. TanStack Virtual) owns the scroll element.
- `toggleNode(id, index)` is now `toggleNode(id)`.
- `getSelectedId()` and `setSelectedId()` are now the `selectedId` getter and `select()`, and an
  empty selection is `null` rather than `''`.
- `expandedNodes` is now `expandedIds` and is read-only, so changes always go through methods that
  call `onChange`.
- `getVirtualTreeItems()` was removed; use `visibleItems`.
- `accessorKey` is optional; render labels with `tree.getLabel(node)`.

[View the website for examples](https://svelte-virtualized-tree.vercel.app)

## License

MIT
