import { describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { createTreeVirtualizer, type VirtualTreeItem } from './index.js';

type Item = VirtualTreeItem<{ name: string }>;

const node = (id: number, children?: Item[], extra: Partial<Item> = {}): Item => ({
	id,
	name: `Node ${id}`,
	children,
	...extra
});

// 1
// ├─ 2
// │  └─ 4
// │     └─ 5
// └─ 3
// 6
function nested(): Item[] {
	return [node(1, [node(2, [node(4, [node(5)])]), node(3)]), node(6)];
}

const ids = (items: Item[]) => items.map((item) => item.id);

describe('TreeVirtualizer', () => {
	it('shows only root nodes at first', () => {
		const tree = createTreeVirtualizer({ data: nested(), accessorKey: 'name' });
		expect(ids(tree.visibleItems)).toEqual([1, 6]);
		expect(tree.selectedId).toBeNull();
	});

	it('expands nodes below the first level', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		tree.toggleNode(1);
		tree.toggleNode(2);
		tree.toggleNode(4);
		expect(ids(tree.visibleItems)).toEqual([1, 2, 4, 5, 3, 6]);
		expect(tree.selectedId).toBe(4);
		expect(tree.isSelected(4)).toBe(true);
	});

	it('collapses a node and its expanded descendants', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		tree.toggleNode(1);
		tree.toggleNode(2);
		tree.toggleNode(1);
		expect(ids(tree.visibleItems)).toEqual([1, 6]);
		expect([...tree.expandedIds]).toEqual([]);
		tree.toggleNode(1);
		expect(ids(tree.visibleItems)).toEqual([1, 2, 3, 6]);
	});

	it('does not mark leaf nodes as expanded', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		tree.toggleNode(6);
		expect(tree.isExpanded(6)).toBe(false);
		expect(tree.selectedId).toBe(6);
	});

	it('toggle changes expansion without selecting', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		tree.toggle(1);
		expect(tree.isExpanded(1)).toBe(true);
		expect(tree.selectedId).toBeNull();
		tree.toggle(1);
		expect(tree.isExpanded(1)).toBe(false);
	});

	it('computes levels', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		expect([1, 2, 4, 5, 3, 6].map((id) => tree.getLevel(id))).toEqual([0, 1, 2, 3, 1, 0]);
	});

	it('reveals a nested node with expandTo', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		tree.expandTo(5);
		expect(ids(tree.visibleItems)).toEqual([1, 2, 4, 5, 3, 6]);
		expect(tree.getParent(5)).toBe(4);
		expect(tree.getParent(1)).toBeNull();
	});

	it('supports flat data linked by parentId', () => {
		const flat = [
			node(1, undefined, { parentId: null }),
			node(2, undefined, { parentId: 1 }),
			node(3, undefined, { parentId: 2 }),
			node(4)
		];
		const tree = createTreeVirtualizer({ data: flat });
		expect(ids(tree.visibleItems)).toEqual([1, 4]);
		tree.expand(1);
		tree.expand(2);
		expect(ids(tree.visibleItems)).toEqual([1, 2, 3, 4]);
		expect(tree.getLevel(3)).toBe(2);
		expect(tree.hasChildren(3)).toBe(false);
	});

	it('expands and collapses everything', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		tree.expandAll();
		expect(ids(tree.visibleItems)).toEqual([1, 2, 4, 5, 3, 6]);
		tree.collapseAll();
		expect(ids(tree.visibleItems)).toEqual([1, 6]);
	});

	it('honours isExpanded on the data', () => {
		const data = [node(1, [node(2)], { isExpanded: true })];
		const tree = createTreeVirtualizer({ data });
		expect(ids(tree.visibleItems)).toEqual([1, 2]);
	});

	it('reads labels through accessorKey', () => {
		const withKey = createTreeVirtualizer({ data: nested(), accessorKey: 'name' });
		expect(withKey.getLabel(withKey.visibleItems[0])).toBe('Node 1');
		const withoutKey = createTreeVirtualizer({ data: nested() });
		expect(withoutKey.getLabel(withoutKey.visibleItems[0])).toBe('1');
	});

	it('updates the rows when data is replaced', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		tree.toggleNode(1);
		tree.setOptions({ data: [node(1, [node(7)]), node(8)] });
		expect(ids(tree.visibleItems)).toEqual([1, 7, 8]);
		tree.toggleNode(7);
		tree.setOptions({ data: [node(8)] });
		expect(tree.selectedId).toBeNull();
		expect([...tree.expandedIds]).toEqual([]);
	});

	it('calls onChange after each change', () => {
		const onChange = vi.fn();
		const tree = createTreeVirtualizer({ data: nested(), onChange });
		tree.toggleNode(1);
		tree.toggleNode(1);
		tree.select(6);
		tree.select(6); // no change, no call
		expect(onChange).toHaveBeenCalledTimes(3);
	});

	it('is reactive inside effects', () => {
		const tree = createTreeVirtualizer({ data: nested() });
		const seen: number[] = [];
		const cleanup = $effect.root(() => {
			$effect(() => {
				seen.push(tree.visibleItems.length);
			});
		});
		flushSync();
		tree.toggleNode(1);
		flushSync();
		cleanup();
		expect(seen).toEqual([2, 4]);
	});
});
