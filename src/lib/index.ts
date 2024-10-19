import { derived, writable } from 'svelte/store';
import { memo, type PartialKeys } from './utils';
import type { Readable, Writable } from 'svelte/store';

export type SvelteTreeVirtualizer<
	TScrollElement extends Element | Window,
	TItemElement extends Element,
	TData
> = Omit<TreeVirtualizer<TScrollElement, TItemElement, TData>, 'setOptions'> & {
	setOptions: (options: Partial<VirtualizerOptions<TScrollElement, TItemElement, TData>>) => void;
};

function createTreeVirtualizerBase<
	TScrollElement extends Element | Window,
	TItemElement extends Element,
	TData
>(
	initialOptions: VirtualizerOptions<TScrollElement, TItemElement, TData>
): Readable<SvelteTreeVirtualizer<TScrollElement, TItemElement, TData>> {
	const virtualizer = new TreeVirtualizer(initialOptions);
	const originalSetOptions = virtualizer.setOptions;

	// eslint-disable-next-line prefer-const
	let virtualizerWritable: Writable<TreeVirtualizer<TScrollElement, TItemElement, TData>>;

	const setOptions = (
		options: Partial<VirtualizerOptions<TScrollElement, TItemElement, TData>>
	) => {
		const resolvedOptions = {
			...virtualizer.options,
			...options,
			onChange: options.onChange
		};
		originalSetOptions({
			...resolvedOptions,
			onChange: (instance: TreeVirtualizer<TScrollElement, TItemElement, TData>, sync: boolean) => {
				virtualizerWritable.set(instance);
				resolvedOptions.onChange?.(instance, sync);
			}
		});
		virtualizer._willUpdate();
	};

	virtualizerWritable = writable(virtualizer, () => {
		setOptions(initialOptions);
		return virtualizer._didMount();
	});

	return derived(virtualizerWritable, (instance) => Object.assign(instance, { setOptions }));
}

export function createTreeVirtualizer<
	TScrollElement extends Element,
	TItemElement extends Element,
	TData
>(
	options: PartialKeys<
		VirtualizerOptions<TScrollElement, TItemElement, TData>,
		'observeElementRect'
	>
): Readable<SvelteTreeVirtualizer<TScrollElement, TItemElement, TData>> {
	return createTreeVirtualizerBase<TScrollElement, TItemElement, TData>({
		observeElementRect: observeElementRect,
		...options
	});
}

export type TData = unknown | object | any[];

export type VirtualTreeItem<TData> = TData & {
	id: number | string;
	isExpanded?: boolean;
	isLeaf?: boolean;
	parentId: number | string | null;
	children?: VirtualTreeItem<TData>[];
	icon: string;
	level: number;
};
export type VirtualTreeItemAccessorKey<T> = keyof VirtualTreeItem<T>;

export interface Rect {
	width: number;
	height: number;
}

export const observeElementRect = <T extends Element>(
	instance: TreeVirtualizer<T, any, any>,
	cb: (rect: Rect) => void
) => {
	const element = instance.scrollElement;
	if (!element) {
		return;
	}
	const targetWindow = instance.targetWindow;
	if (!targetWindow) {
		return;
	}

	const handler = (rect: Rect) => {
		const { width, height } = rect;
		cb({ width: Math.round(width), height: Math.round(height) });
	};

	handler(element.getBoundingClientRect());

	if (!targetWindow.ResizeObserver) {
		return () => {};
	}

	const observer = new targetWindow.ResizeObserver((entries) => {
		const entry = entries[0];
		if (entry?.borderBoxSize) {
			const box = entry.borderBoxSize[0];
			if (box) {
				handler({ width: box.inlineSize, height: box.blockSize });
				return;
			}
		}
		handler(element.getBoundingClientRect());
	});

	observer.observe(element, { box: 'border-box' });

	return () => {
		observer.unobserve(element);
	};
};

export interface VirtualizerOptions<
	TScrollElement extends Element | Window,
	TItemElement extends Element,
	TData
> {
	// Required from the user
	data: VirtualTreeItem<TData>[];
	accessorKey: VirtualTreeItemAccessorKey<TData>;
	getScrollElement: () => TScrollElement | null;

	// Required from the framework adapter (but can be overridden)
	observeElementRect: (
		instance: TreeVirtualizer<TScrollElement, TItemElement, TData>,
		cb: (rect: Rect) => void
	) => void | (() => void);

	// Optional
	debug?: boolean;
	onChange?: (
		instance: TreeVirtualizer<TScrollElement, TItemElement, TData>,
		sync: boolean
	) => void;
	indexAttribute?: string;
	enabled?: boolean;
}

export class TreeVirtualizer<
	TScrollElement extends Element | Window,
	TItemElement extends Element,
	TData
> {
	selectedId: string | number;
	visibleItems: VirtualTreeItem<TData>[];
	expandedNodes: Set<number | string>;
	options!: Required<VirtualizerOptions<TScrollElement, TItemElement, TData>>;
	scrollElement: TScrollElement | null = null;
	targetWindow: (Window & typeof globalThis) | null = null;
	isScrolling = false;

	constructor(opts: VirtualizerOptions<TScrollElement, TItemElement, TData>) {
		this.selectedId = '';
		this.visibleItems = [];
		this.expandedNodes = new Set();
		this.setOptions(opts);
		this.updateVisibleNodes();
	}

	setOptions = (opts: VirtualizerOptions<TScrollElement, TItemElement, TData>) => {
		Object.entries(opts).forEach(([key, value]) => {
			if (typeof value === 'undefined') delete (opts as any)[key];
		});

		this.options = {
			debug: false,
			onChange: () => {},
			indexAttribute: 'data-index',
			enabled: true,
			...opts
		};
	};

	private notify = (sync: boolean) => {
		this.options.onChange?.(this, sync);
	};

	private cleanup = () => {
		this.scrollElement = null;
		this.targetWindow = null;
	};

	_didMount = () => {
		return () => {
			this.cleanup();
		};
	};

	_willUpdate = () => {
		const scrollElement = this.options.enabled ? this.options.getScrollElement() : null;

		if (this.scrollElement !== scrollElement) {
			this.cleanup();
			this.scrollElement = scrollElement;

			if (this.scrollElement && 'ownerDocument' in this.scrollElement) {
				this.targetWindow = this.scrollElement.ownerDocument.defaultView;
			} else {
				this.targetWindow = this.scrollElement?.window ?? null;
			}
		}
	};

	indexFromElement = (node: TItemElement) => {
		const attributeName = this.options.indexAttribute;
		const indexStr = node.getAttribute(attributeName);

		if (!indexStr) {
			console.warn(`Missing attribute name '${attributeName}={index}' on measured element.`);
			return -1;
		}

		return parseInt(indexStr, 10);
	};

	getVirtualTreeItems = memo(
		() => [this.visibleItems],
		(indexes: VirtualTreeItem<TData>[]) => {
			return indexes;
		},
		{
			key: process.env.NODE_ENV !== 'production' && 'getVirtualTreeItems',
			debug: () => this.options.debug
		}
	);
	/**
	 * Sets the selected ID.
	 *
	 * @param id - The ID to be set as selected. Can be a string or a number.
	 */
	setSelectedId(id: string | number): void {
		this.selectedId = id;
		this.notify(true);
	}

	/**
	 * Retrieves the currently selected ID.
	 *
	 * @returns {string | number} The ID of the selected item.
	 */
	getSelectedId(): string | number {
		return this.selectedId;
	}

	// Set the intial visible nodes from the constructor
	private updateVisibleNodes(): void {
		let nodesThatShouldBeVisible = this.options.data.filter((node: VirtualTreeItem<TData>) => {
			if (node.parentId === null) {
				return true;
			}
			return this.expandedNodes.has(node.parentId);
		});
		this.visibleItems = nodesThatShouldBeVisible;
	}
	/**
	 * Adds or removes the node from the expandedNodes set
	 * @param nodeId id of the node to toggle
	 * @param index current index of the node
	 * @returns
	 */
	toggleNode(nodeId: number | string, index: number): void {
		//TODO Figure out why expanded nodes is not updating correctly.
		this.setSelectedId(nodeId);
		let node: VirtualTreeItem<TData> = this.options.data.find(
			(node) => node.id === nodeId
		) as VirtualTreeItem<TData>;
		if (!node) {
			return;
		}
		if (this.expandedNodes.has(node.id)) {
			this.expandedNodes.delete(node.id);
			if (node.children && node.children.length > 0) {
				const removeChildren = (children: VirtualTreeItem<TData>[]) => {
					children.forEach((child) => {
						const index = this.visibleItems.findIndex((node) => node.id === child.id);
						if (index !== -1) {
							this.expandedNodes.delete(child.id);
							let visibleNodesCopy = [...this.visibleItems];
							visibleNodesCopy.splice(index, 1);
							this.visibleItems = visibleNodesCopy;
							if (child.children && child.children.length > 0) {
								removeChildren(child.children);
							}
						}
					});
				};

				removeChildren(node.children);
			}
		} else {
			this.expandedNodes.add(node.id);
			if (node.children && node.children.length > 0) {
				let newVisibleItems = [...this.visibleItems];
				newVisibleItems = [
					...this.visibleItems.slice(0, index + 1),
					...node.children,
					...this.visibleItems.slice(index + 1)
				];
				this.setVisibleNodes(newVisibleItems);
			} else {
				this.setVisibleNodes([...this.visibleItems]);
			}
		}
	}

	private setVisibleNodes(visibleNodes: VirtualTreeItem<TData>[]): void {
		this.visibleItems = visibleNodes;
		this.notify(true);
	}
}
