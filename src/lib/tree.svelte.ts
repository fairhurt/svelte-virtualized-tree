import { untrack } from 'svelte';

export type TreeItemId = string | number;

/**
 * A node in the tree. `TData` holds your own fields (for example `displayName`).
 *
 * Data can be passed either nested (each node lists its `children`) or flat
 * (every node at the top level, linked by `parentId`).
 */
export type VirtualTreeItem<TData = object> = TData & {
	id: TreeItemId;
	/** The parent's id, for flat data. Nested data can leave it out. */
	parentId?: TreeItemId | null;
	children?: VirtualTreeItem<TData>[];
	/** Expand this node when the tree is created or its data is replaced. */
	isExpanded?: boolean;
};

export interface TreeVirtualizerOptions<TData> {
	data: VirtualTreeItem<TData>[];
	/** The field `getLabel` reads. Without it, `getLabel` returns the node's id. */
	accessorKey?: keyof TData;
	/** Called after the selection or expanded state changes. */
	onChange?: (instance: TreeVirtualizer<TData>) => void;
}

interface TreeIndex<TData> {
	nodes: Map<TreeItemId, VirtualTreeItem<TData>>;
	roots: VirtualTreeItem<TData>[];
	children: Map<TreeItemId, VirtualTreeItem<TData>[]>;
	levels: Map<TreeItemId, number>;
	parents: Map<TreeItemId, TreeItemId>;
}

const NO_CHILDREN: never[] = [];

// The index is rebuilt from scratch whenever `data` changes, so its maps don't need to be reactive.
/* eslint-disable svelte/prefer-svelte-reactivity */
function buildIndex<TData>(data: VirtualTreeItem<TData>[]): TreeIndex<TData> {
	const nodes = new Map<TreeItemId, VirtualTreeItem<TData>>();
	const visit = (node: VirtualTreeItem<TData>) => {
		if (nodes.has(node.id)) {
			console.warn(`[svelte-virtualized-tree] Duplicate node id '${String(node.id)}'.`);
		}
		nodes.set(node.id, node);
		node.children?.forEach(visit);
	};
	data.forEach(visit);

	// Flat data: top-level nodes that point at a known parent are that parent's children.
	const roots: VirtualTreeItem<TData>[] = [];
	const flatChildren = new Map<TreeItemId, VirtualTreeItem<TData>[]>();
	for (const node of data) {
		const parentId = node.parentId;
		if (parentId === null || parentId === undefined || !nodes.has(parentId)) {
			roots.push(node);
		} else {
			const siblings = flatChildren.get(parentId);
			if (siblings) siblings.push(node);
			else flatChildren.set(parentId, [node]);
		}
	}

	// Resolve each reachable node's children and depth in one walk from the roots.
	const children = new Map<TreeItemId, VirtualTreeItem<TData>[]>();
	const levels = new Map<TreeItemId, number>();
	const parents = new Map<TreeItemId, TreeItemId>();
	const stack: [VirtualTreeItem<TData>, number][] = roots.map((root) => [root, 0]);
	while (stack.length) {
		const [node, level] = stack.pop()!;
		if (levels.has(node.id)) continue; // a cycle or duplicate id
		levels.set(node.id, level);
		const kids = node.children ?? flatChildren.get(node.id) ?? NO_CHILDREN;
		children.set(node.id, kids);
		for (const child of kids) {
			parents.set(child.id, node.id);
			stack.push([child, level + 1]);
		}
	}

	return { nodes, roots, children, levels, parents };
}
/* eslint-enable svelte/prefer-svelte-reactivity */

export class TreeVirtualizer<TData> {
	#options: TreeVirtualizerOptions<TData>;
	#index: TreeIndex<TData> = $derived.by(() => buildIndex(this.#options.data));
	#selectedId: TreeItemId | null = $state(null);
	// A plain set plus one change counter. A reactive set would track every id it is asked
	// about, which gets slow when a derived walks a hundred thousand nodes.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#expanded = new Set<TreeItemId>();
	#expandedVersion = $state(0);

	/** The nodes currently shown, in display order. Use this as the virtual list's rows. */
	readonly visibleItems: VirtualTreeItem<TData>[] = $derived.by(() => {
		const items: VirtualTreeItem<TData>[] = [];
		void this.#expandedVersion;
		// Iterative depth-first walk, so very deep trees can't overflow the stack.
		const stack = [...this.#index.roots].reverse();
		while (stack.length) {
			const node = stack.pop()!;
			items.push(node);
			if (this.#expanded.has(node.id)) {
				const children = this.getChildren(node.id);
				for (let i = children.length - 1; i >= 0; i--) stack.push(children[i]);
			}
		}
		return items;
	});

	constructor(options: TreeVirtualizerOptions<TData>) {
		this.#options = $state.raw(options);
		this.#expandInitial();
	}

	get options(): TreeVirtualizerOptions<TData> {
		return this.#options;
	}

	/** Id of the selected node, or `null` when nothing is selected. */
	get selectedId(): TreeItemId | null {
		return this.#selectedId;
	}

	/** Ids of the expanded nodes. Use `expand`, `collapse` or `toggle` to change them. */
	get expandedIds(): ReadonlySet<TreeItemId> {
		void this.#expandedVersion;
		return this.#expanded;
	}

	/** Merge in new options. Passing `data` replaces the tree and keeps the expanded and selected ids that still exist. */
	setOptions(options: Partial<TreeVirtualizerOptions<TData>>): void {
		const dataChanged = options.data !== undefined && options.data !== this.#options.data;
		this.#options = { ...this.#options, ...options };
		if (!dataChanged) return;

		const { nodes } = this.#index;
		for (const id of this.#expanded) {
			if (!nodes.has(id)) this.#expanded.delete(id);
		}
		this.#expandInitial();
		if (this.#selectedId !== null && !nodes.has(this.#selectedId)) this.#selectedId = null;
		this.#notify();
	}

	getNode(id: TreeItemId): VirtualTreeItem<TData> | undefined {
		return this.#index.nodes.get(id);
	}

	getChildren(id: TreeItemId): VirtualTreeItem<TData>[] {
		return this.#index.children.get(id) ?? NO_CHILDREN;
	}

	hasChildren(id: TreeItemId): boolean {
		return this.getChildren(id).length > 0;
	}

	/** The id of a node's parent, or `null` for roots and unknown ids. */
	getParent(id: TreeItemId): TreeItemId | null {
		return this.#index.parents.get(id) ?? null;
	}

	/** Depth of a node: 0 for roots, 1 for their children, and so on. */
	getLevel(id: TreeItemId): number {
		return this.#index.levels.get(id) ?? 0;
	}

	/** The node's `accessorKey` field as a string, or its id when no `accessorKey` is set. */
	getLabel(node: VirtualTreeItem<TData>): string {
		const key = this.#options.accessorKey;
		return key === undefined ? String(node.id) : String(node[key] ?? '');
	}

	isExpanded(id: TreeItemId): boolean {
		void this.#expandedVersion;
		return this.#expanded.has(id);
	}

	isSelected(id: TreeItemId): boolean {
		return this.#selectedId === id;
	}

	/** Select a node, or pass `null` to clear the selection. */
	select(id: TreeItemId | null): void {
		if (this.#selectedId === id) return;
		this.#selectedId = id;
		this.#notify(false);
	}

	expand(id: TreeItemId): void {
		if (!this.hasChildren(id) || this.#expanded.has(id)) return;
		this.#expanded.add(id);
		this.#notify();
	}

	/** Collapse a node. Its expanded descendants are collapsed too. */
	collapse(id: TreeItemId): void {
		if (!this.#expanded.has(id)) return;
		this.#collapseFrom([id]);
		this.#notify();
	}

	/** Expand every ancestor of a node, so the node itself becomes visible. */
	expandTo(id: TreeItemId): void {
		let changed = false;
		let parent = this.getParent(id);
		while (parent !== null) {
			if (!this.#expanded.has(parent)) {
				this.#expanded.add(parent);
				changed = true;
			}
			parent = this.getParent(parent);
		}
		if (changed) this.#notify();
	}

	/** Expand a node if it's collapsed, or collapse it if it's expanded. */
	toggle(id: TreeItemId): void {
		if (this.#expanded.has(id)) this.collapse(id);
		else this.expand(id);
	}

	/** Select a node and toggle it, which is what clicking a row usually does. */
	toggleNode(id: TreeItemId): void {
		this.#selectedId = id;
		const isParent = this.hasChildren(id);
		if (this.#expanded.has(id)) this.#collapseFrom([id]);
		else if (isParent) this.#expanded.add(id);
		this.#notify(isParent);
	}

	expandAll(): void {
		for (const [id, children] of this.#index.children) {
			if (children.length > 0) this.#expanded.add(id);
		}
		this.#notify();
	}

	collapseAll(): void {
		this.#expanded.clear();
		this.#notify();
	}

	#collapseFrom(stack: TreeItemId[]): void {
		while (stack.length) {
			const current = stack.pop()!;
			if (!this.#expanded.delete(current)) continue;
			for (const child of this.getChildren(current)) stack.push(child.id);
		}
	}

	#expandInitial(): void {
		for (const node of this.#index.nodes.values()) {
			if (node.isExpanded && this.hasChildren(node.id)) this.#expanded.add(node.id);
		}
	}

	/** Call `onChange`, first telling readers when the expanded set changed. */
	#notify(expandedChanged = true): void {
		if (expandedChanged) this.#expandedVersion = untrack(() => this.#expandedVersion) + 1;
		this.#options.onChange?.(this);
	}
}

export function createTreeVirtualizer<TData>(
	options: TreeVirtualizerOptions<TData>
): TreeVirtualizer<TData> {
	return new TreeVirtualizer(options);
}
