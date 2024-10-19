import { approxEqual, debounce, memo, notUndefined } from './utils';

//

type ScrollDirection = 'forward' | 'backward';

type ScrollAlignment = 'start' | 'center' | 'end' | 'auto';

type ScrollBehavior = 'auto' | 'smooth';

export interface ScrollToOptions {
	align?: ScrollAlignment;
	behavior?: ScrollBehavior;
}

type ScrollToOffsetOptions = ScrollToOptions;

type ScrollToIndexOptions = ScrollToOptions;

export interface Range {
	startIndex: number;
	endIndex: number;
	overscan: number;
	count: number;
}

type Key = number | string | bigint;
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

//

export const defaultKeyExtractor = (index: number) => index;

export const defaultRangeExtractor = (range: Range) => {
	const start = Math.max(range.startIndex - range.overscan, 0);
	const end = Math.min(range.endIndex + range.overscan, range.count - 1);

	const arr = [];

	for (let i = start; i <= end; i++) {
		arr.push(i);
	}

	return arr;
};

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

const addEventListenerOptions = {
	passive: true
};

export const observeWindowRect = (
	instance: TreeVirtualizer<Window, any, TData>,
	cb: (rect: Rect) => void
) => {
	const element = instance.scrollElement;
	if (!element) {
		return;
	}

	const handler = () => {
		cb({ width: element.innerWidth, height: element.innerHeight });
	};
	handler();

	element.addEventListener('resize', handler, addEventListenerOptions);

	return () => {
		element.removeEventListener('resize', handler);
	};
};

const supportsScrollend = typeof window == 'undefined' ? true : 'onscrollend' in window;

export const observeElementOffset = <T extends Element>(
	instance: TreeVirtualizer<T, any, any>,
	cb: (offset: number, isScrolling: boolean) => void
) => {
	const element = instance.scrollElement;
	if (!element) {
		return;
	}
	const targetWindow = instance.targetWindow;
	if (!targetWindow) {
		return;
	}

	let offset = 0;
	const fallback = supportsScrollend
		? () => undefined
		: debounce(
				targetWindow,
				() => {
					cb(offset, false);
				},
				instance.options.isScrollingResetDelay
			);

	const createHandler = (isScrolling: boolean) => () => {
		const { horizontal, isRtl } = instance.options;
		offset = horizontal ? element['scrollLeft'] * ((isRtl && -1) || 1) : element['scrollTop'];
		fallback();
		cb(offset, isScrolling);
	};
	const handler = createHandler(true);
	const endHandler = createHandler(false);
	endHandler();

	element.addEventListener('scroll', handler, addEventListenerOptions);
	element.addEventListener('scrollend', endHandler, addEventListenerOptions);

	return () => {
		element.removeEventListener('scroll', handler);
		element.removeEventListener('scrollend', endHandler);
	};
};

export const observeWindowOffset = (
	instance: TreeVirtualizer<Window, any, TData>,
	cb: (offset: number, isScrolling: boolean) => void
) => {
	const element = instance.scrollElement;
	if (!element) {
		return;
	}
	const targetWindow = instance.targetWindow;
	if (!targetWindow) {
		return;
	}

	let offset = 0;
	const fallback = supportsScrollend
		? () => undefined
		: debounce(
				targetWindow,
				() => {
					cb(offset, false);
				},
				instance.options.isScrollingResetDelay
			);

	const createHandler = (isScrolling: boolean) => () => {
		offset = element[instance.options.horizontal ? 'scrollX' : 'scrollY'];
		fallback();
		cb(offset, isScrolling);
	};
	const handler = createHandler(true);
	const endHandler = createHandler(false);
	endHandler();

	element.addEventListener('scroll', handler, addEventListenerOptions);
	element.addEventListener('scrollend', endHandler, addEventListenerOptions);

	return () => {
		element.removeEventListener('scroll', handler);
		element.removeEventListener('scrollend', endHandler);
	};
};

export const measureElement = <TItemElement extends Element>(
	element: TItemElement,
	entry: ResizeObserverEntry | undefined,
	instance: TreeVirtualizer<any, TItemElement, TData>
) => {
	if (entry?.borderBoxSize) {
		const box = entry.borderBoxSize[0];
		if (box) {
			const size = Math.round(box[instance.options.horizontal ? 'inlineSize' : 'blockSize']);
			return size;
		}
	}
	return Math.round(
		element.getBoundingClientRect()[instance.options.horizontal ? 'width' : 'height']
	);
};

export const windowScroll = <T extends Window>(
	offset: number,
	{ adjustments = 0, behavior }: { adjustments?: number; behavior?: ScrollBehavior },
	instance: TreeVirtualizer<T, any, TData>
) => {
	const toOffset = offset + adjustments;

	instance.scrollElement?.scrollTo?.({
		[instance.options.horizontal ? 'left' : 'top']: toOffset,
		behavior
	});
};

export const elementScroll = <T extends Element>(
	offset: number,
	{ adjustments = 0, behavior }: { adjustments?: number; behavior?: ScrollBehavior },
	instance: TreeVirtualizer<T, any, any>
) => {
	const toOffset = offset + adjustments;

	instance.scrollElement?.scrollTo?.({
		[instance.options.horizontal ? 'left' : 'top']: toOffset,
		behavior
	});
};

export interface VirtualizerOptions<
	TScrollElement extends Element | Window,
	TItemElement extends Element,
    TData
> {
	// Required from the user
    count: number;
	data: VirtualTreeItem<TData>[];
	accessorKey: VirtualTreeItemAccessorKey<TData>;
	getScrollElement: () => TScrollElement | null;
	estimateSize: (index: number) => number;

	// Required from the framework adapter (but can be overridden)
	scrollToFn: (
		offset: number,
		options: { adjustments?: number; behavior?: ScrollBehavior },
		instance: TreeVirtualizer<TScrollElement, TItemElement, TData>
	) => void;
	observeElementRect: (
		instance: TreeVirtualizer<TScrollElement, TItemElement, TData>,
		cb: (rect: Rect) => void
	) => void | (() => void);
	observeElementOffset: (
		instance: TreeVirtualizer<TScrollElement, TItemElement, TData>,
		cb: (offset: number, isScrolling: boolean) => void
	) => void | (() => void);

	// Optional
	debug?: boolean;
	initialRect?: Rect;
	onChange?: (instance: TreeVirtualizer<TScrollElement, TItemElement, TData>, sync: boolean) => void;
	// measureElement?: (
	// 	element: TItemElement,
	// 	entry: ResizeObserverEntry | undefined,
	// 	instance: TreeVirtualizer<TScrollElement, TItemElement, TData>
	// ) => number;
	overscan?: number;
	horizontal?: boolean;
	paddingStart?: number;
	paddingEnd?: number;
	scrollPaddingStart?: number;
	scrollPaddingEnd?: number;
	initialOffset?: number | (() => number);
	getItemKey?: (index: number) => Key;
	rangeExtractor?: (range: Range) => Array<number>;
	scrollMargin?: number;
	gap?: number;
	indexAttribute?: string;
	initialMeasurementsCache?: Array<VirtualTreeItem<TData>>;
	lanes?: number;
	isScrollingResetDelay?: number;
	enabled?: boolean;
	isRtl?: boolean;
}

export class TreeVirtualizer<
	TScrollElement extends Element | Window,
	TItemElement extends Element,
    TData
> {
	selectedId: string | number;
	visibleItems: VirtualTreeItem<TData>[];
	expandedNodes: Set<number | string>;
	private unsubs: Array<void | (() => void)> = [];
	options!: Required<VirtualizerOptions<TScrollElement, TItemElement, TData>>;
	scrollElement: TScrollElement | null = null;
	targetWindow: (Window & typeof globalThis) | null = null;
	isScrolling = false;
	private scrollToIndexTimeoutId: number | null = null;
	measurementsCache: Array<VirtualTreeItem<TData>> = [];
	private itemSizeCache = new Map<Key, number>();
	private pendingMeasuredCacheIndexes: Array<number> = [];
	scrollRect: Rect | null = null;
	scrollOffset: number | null = null;
	scrollDirection: ScrollDirection | null = null;
	private scrollAdjustments = 0;
	shouldAdjustScrollPositionOnItemSizeChange:
		| undefined
		| ((
				item: VirtualTreeItem<TData>,
				delta: number,
				instance: TreeVirtualizer<TScrollElement, TItemElement, TData>
		  ) => boolean);
	elementsCache = new Map<Key, TItemElement>();
	private observer = (() => {
		let _ro: ResizeObserver | null = null;

		const get = () => {
			if (_ro) {
				return _ro;
			}

			if (!this.targetWindow || !this.targetWindow.ResizeObserver) {
				return null;
			}

			return (_ro = new this.targetWindow.ResizeObserver((entries) => {
				entries.forEach((entry) => {
					// this._measureElement(entry.target as TItemElement, entry);
				});
			}));
		};

		return {
			disconnect: () => {
				get()?.disconnect();
				_ro = null;
			},
			observe: (target: Element) => get()?.observe(target, { box: 'border-box' }),
			unobserve: (target: Element) => get()?.unobserve(target)
		};
	})();
	range: { startIndex: number; endIndex: number } | null = null;

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
			initialOffset: 0,
			overscan: 1,
			paddingStart: 0,
			paddingEnd: 0,
			scrollPaddingStart: 0,
			scrollPaddingEnd: 0,
			horizontal: false,
			getItemKey: defaultKeyExtractor,
			rangeExtractor: defaultRangeExtractor,
			onChange: () => {},
			initialRect: { width: 0, height: 0 },
			scrollMargin: 0,
			gap: 0,
			indexAttribute: 'data-index',
			initialMeasurementsCache: [],
			lanes: 1,
			isScrollingResetDelay: 150,
			enabled: true,
			isRtl: false,
			...opts
		};
	};

	private notify = (sync: boolean) => {
		this.options.onChange?.(this, sync);
	};

	private maybeNotify = memo(
		() => {
			// this.calculateRange();

			return [
				this.isScrolling,
				this.range ? this.range.startIndex : null,
				this.range ? this.range.endIndex : null
			];
		},
		(isScrolling: boolean) => {
			this.notify(isScrolling);
		},
		{
			key: process.env.NODE_ENV !== 'production' && 'maybeNotify',
			debug: () => this.options.debug,
			initialDeps: [
				this.isScrolling,
				this.range ? this.range.startIndex : null,
				this.range ? this.range.endIndex : null
			] as [boolean, number | null, number | null]
		}
	);

	private cleanup = () => {
		this.unsubs.filter(Boolean).forEach((d) => d!());
		this.unsubs = [];
		this.observer.disconnect();
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

			if (!scrollElement) {
				this.maybeNotify();
				return;
			}

			this.scrollElement = scrollElement;

			if (this.scrollElement && 'ownerDocument' in this.scrollElement) {
				this.targetWindow = this.scrollElement.ownerDocument.defaultView;
			} else {
				this.targetWindow = this.scrollElement?.window ?? null;
			}

			this.elementsCache.forEach((cached) => {
				this.observer.observe(cached);
			});

			//   this._scrollToOffset(this.getScrollOffset(), {
			//     adjustments: undefined,
			//     behavior: undefined,
			//   })

			this.unsubs.push(
				this.options.observeElementRect(this, (rect) => {
					this.scrollRect = rect;
					this.maybeNotify();
				})
			);

			this.unsubs.push(
				this.options.observeElementOffset(this, (offset, isScrolling) => {
					this.scrollAdjustments = 0;
					this.scrollDirection = isScrolling
						? this.getScrollOffset() < offset
							? 'forward'
							: 'backward'
						: null;
					this.scrollOffset = offset;
					this.isScrolling = isScrolling;

					this.maybeNotify();
				})
			);
		}
	};

	private getSize = () => {
		if (!this.options.enabled) {
			this.scrollRect = null;
			return 0;
		}

		this.scrollRect = this.scrollRect ?? this.options.initialRect;

		return this.scrollRect[this.options.horizontal ? 'width' : 'height'];
	};

	private getScrollOffset = () => {
		if (!this.options.enabled) {
			this.scrollOffset = null;
			return 0;
		}

		this.scrollOffset =
			this.scrollOffset ??
			(typeof this.options.initialOffset === 'function'
				? this.options.initialOffset()
				: this.options.initialOffset);

		return this.scrollOffset;
	};

	private getIndexes = memo(
		() => [
			this.options.rangeExtractor,
			this.options.overscan
			//   this.options.count,
		],
		(rangeExtractor, range, overscan) => {
			return range === null
				? []
				: rangeExtractor({
						startIndex: range.startIndex,
						endIndex: range.endIndex,
						overscan
					});
		},
		{
			key: process.env.NODE_ENV !== 'production' && 'getIndexes',
			debug: () => this.options.debug
		}
	);

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
		() => [this.getIndexes()],
		(indexes: any) => {
			const VirtualTreeItems: Array<VirtualTreeItem<TData>> = [];

			for (let k = 0, len = indexes.length; k < len; k++) {
				const i = indexes[k]!;
				// const measurement = measurements[i]!

				VirtualTreeItems.push(i);
			}

			return VirtualTreeItems;
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

    getSelectedId(): string | number {
        return this.selectedId;
    }

	setExpandedNodes(expandedNodes: Set<number | string>): void {
		this.expandedNodes = expandedNodes;
		this.notify(true);
	}
	// Updates the visible nodes based on the expanded nodes
	updateVisibleNodes(): void {
		let nodesThatShouldBeVisible = this.options.data.filter((node: VirtualTreeItem<TData>) => {
			if (node.parentId === null) {
				return true;
			}
			return this.expandedNodes.has(node.parentId);
		});
		this.visibleItems = nodesThatShouldBeVisible;
		// console.log(this.visibleNodes);
	}

	// getVisibleNodes(): TreeItem<T>[] {
	//     return this.visibleNodes;
	// }
	getVisibleNodes = memo(
		() => [this.visibleItems],
		(indexes: any) => {
			const VirtualTreeItems: Array<VirtualTreeItem<TData>> = [];

			for (let k = 0, len = indexes.length; k < len; k++) {
				const i = indexes[k]!;
				VirtualTreeItems.push(i);
			}

			return VirtualTreeItems;
		},
		{
			key: process.env.NODE_ENV !== 'production' && 'getVirtualTreeItems',
			debug: () => this.options.debug
		}
	);

	toggleNode(nodeId: number | string, index: number): void {
		let node: VirtualTreeItem<TData> = this.options.data.find((node) => node.id === nodeId) as VirtualTreeItem<TData>;
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
				this.visibleItems = [
					...this.visibleItems.slice(0, index + 1),
					...node.children,
					...this.visibleItems.slice(index + 1)
				];
			} else {
				this.visibleItems = [...this.visibleItems];
			}
		}
		// this.updateVisibleNodes();
	}

	private getParentIds = (newExpanded: Set<number| string>, node: VirtualTreeItem<TData>) => {
		// If no nodes are selected return empty
		if (node === undefined) return [];
		//Only the root node is null, so just return the root nodes id
		if (node.parentId === null) return newExpanded.add(node.id);
		//Otherwise push the current nodes id
		newExpanded.add(node.id);
		//Find the parent of the node
		let parentNode = this.options.data.find((value) => value.id === node.parentId);
		//Add the parent node to the list of expanded nodes
		if (parentNode !== undefined) this.getParentIds(newExpanded, parentNode);
	};
}
