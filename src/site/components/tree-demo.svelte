<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Folder from '@lucide/svelte/icons/folder';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import File from '@lucide/svelte/icons/file';
	import FileCode from '@lucide/svelte/icons/file-code';
	import FileBraces from '@lucide/svelte/icons/file-braces';
	import FileText from '@lucide/svelte/icons/file-text';
	import FileImage from '@lucide/svelte/icons/file-image';
	import Palette from '@lucide/svelte/icons/palette';
	import UnfoldVertical from '@lucide/svelte/icons/unfold-vertical';
	import FoldVertical from '@lucide/svelte/icons/fold-vertical';
	import LocateFixed from '@lucide/svelte/icons/locate-fixed';
	import { createTreeVirtualizer, type TreeItemId, type VirtualTreeItem } from '#lib';
	import { generateTree, type FileItem } from '#site/tree-data.js';
	import { cn } from '#site/utils.js';
	import AnimatedNumber from './animated-number.svelte';

	let {
		sizes = [10_000, 100_000, 1_000_000],
		initialSize = 100_000,
		treeClass = 'h-[420px]',
		class: className
	}: {
		sizes?: number[];
		initialSize?: number;
		/** Classes that set the height of the scrolling tree area. */
		treeClass?: string;
		class?: string;
	} = $props();

	const ROW_HEIGHT = 28;
	// Browsers stop laying out elements somewhere past 17 million pixels tall.
	const MAX_LIST_HEIGHT = 15_000_000;
	const uid = $props.id();

	const tree = createTreeVirtualizer<FileItem>({ data: [], accessorKey: 'name' });

	// svelte-ignore state_referenced_locally
	let size = $state(initialSize);
	let total = $state(0);
	let building = $state(true);
	let lastUpdate = $state<{ label: string; ms: number } | null>(null);
	let flashId = $state<TreeItemId | null>(null);
	let scrollEl = $state<HTMLDivElement | null>(null);
	let flashTimer: ReturnType<typeof setTimeout> | undefined;

	const virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: 0,
		estimateSize: () => ROW_HEIGHT,
		getScrollElement: () => scrollEl,
		overscan: 8
	});

	// Keep the virtual list's row count in step with the expanded nodes.
	$effect(() => {
		const count = tree.visibleItems.length;
		untrack(() => $virtualizer.setOptions({ count }));
	});

	const canExpandAll = $derived(total * ROW_HEIGHT <= MAX_LIST_HEIGHT);

	const compact = (n: number) =>
		n >= 1_000_000 ? `${n / 1_000_000}M` : n >= 1_000 ? `${n / 1_000}K` : String(n);

	/** Run a tree update and record how long it took, including recomputing the rows. */
	function measure(label: string, update: () => void) {
		const start = performance.now();
		update();
		void tree.visibleItems.length;
		lastUpdate = { label, ms: performance.now() - start };
	}

	async function build(count: number) {
		size = count;
		building = true;
		// Let the "building" state paint before blocking the main thread.
		await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve)));

		measure(`Built ${compact(count)} nodes`, () => {
			tree.collapseAll();
			tree.select(null);
			const data = generateTree(count);
			tree.setOptions({ data });
			// Open the first project a little so the tree doesn't start as a flat list.
			const first = data[0];
			if (first) {
				tree.expand(first.id);
				const firstFolder = first.children?.find((child) => child.children);
				if (firstFolder) tree.expand(firstFolder.id);
			}
		});
		total = count;
		building = false;
		scrollEl?.scrollTo({ top: 0 });
	}

	onMount(() => {
		build(initialSize);
		return () => clearTimeout(flashTimer);
	});

	function scrollToNode(id: TreeItemId, align: 'auto' | 'center' = 'auto') {
		const node = tree.getNode(id);
		const index = node ? tree.visibleItems.indexOf(node) : -1;
		if (index >= 0) $virtualizer.scrollToIndex(index, { align });
		return index;
	}

	async function jumpToRandom() {
		const id = 1 + Math.floor(Math.random() * total);
		measure(`Jumped to node ${id.toLocaleString('en-US')}`, () => {
			tree.expandTo(id);
			tree.select(id);
		});
		await tick();
		scrollToNode(id, 'center');
		flashId = id;
		clearTimeout(flashTimer);
		flashTimer = setTimeout(() => (flashId = null), 1400);
	}

	function activate(node: VirtualTreeItem<FileItem>) {
		const label = tree.isExpanded(node.id)
			? 'Collapsed'
			: tree.hasChildren(node.id)
				? 'Expanded'
				: 'Selected';
		measure(`${label} ${node.name}`, () => tree.toggleNode(node.id));
	}

	function onkeydown(event: KeyboardEvent) {
		const items = tree.visibleItems;
		if (items.length === 0) return;
		const selected = tree.selectedId === null ? undefined : tree.getNode(tree.selectedId);
		const index = selected ? items.indexOf(selected) : -1;
		let next: TreeItemId | null = null;

		switch (event.key) {
			case 'ArrowDown':
				next = items[Math.min(index + 1, items.length - 1)].id;
				break;
			case 'ArrowUp':
				next = items[Math.max(index - 1, 0)].id;
				break;
			case 'Home':
				next = items[0].id;
				break;
			case 'End':
				next = items[items.length - 1].id;
				break;
			case 'ArrowRight':
				if (!selected) return;
				if (tree.hasChildren(selected.id) && !tree.isExpanded(selected.id)) activate(selected);
				else if (tree.hasChildren(selected.id)) next = tree.getChildren(selected.id)[0].id;
				break;
			case 'ArrowLeft':
				if (!selected) return;
				if (tree.isExpanded(selected.id)) activate(selected);
				else next = tree.getParent(selected.id);
				break;
			case 'Enter':
			case ' ':
				if (!selected) return;
				activate(selected);
				break;
			default:
				return;
		}

		event.preventDefault();
		if (next !== null) {
			tree.select(next);
			scrollToNode(next);
		}
	}

	const FILE_ICONS: Record<string, { icon: typeof File; color: string }> = {
		svelte: { icon: FileCode, color: 'text-orange-400' },
		ts: { icon: FileCode, color: 'text-sky-400' },
		js: { icon: FileCode, color: 'text-yellow-300' },
		json: { icon: FileBraces, color: 'text-emerald-400' },
		css: { icon: Palette, color: 'text-fuchsia-400' },
		md: { icon: FileText, color: 'text-slate-400' },
		png: { icon: FileImage, color: 'text-violet-400' },
		svg: { icon: FileImage, color: 'text-violet-400' }
	};
	const PLAIN_FILE = { icon: File, color: 'text-slate-500' };

	const fileIcon = (name: string) =>
		FILE_ICONS[name.slice(name.lastIndexOf('.') + 1)] ?? PLAIN_FILE;

	const toolButton =
		'inline-flex h-7 items-center gap-1.5 rounded-md border bg-white/[0.03] px-2 text-xs text-muted-foreground transition-colors hover:bg-white/[0.08] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40';
</script>

<!-- The pointer handler only moves a decorative glow. -->
<div
	role="presentation"
	class={cn('spotlight flex flex-col overflow-hidden shadow-2xl shadow-black/60', className)}
	onpointermove={(event) => {
		const rect = event.currentTarget.getBoundingClientRect();
		event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`);
		event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`);
	}}
>
	<!-- Toolbar -->
	<div class="flex flex-wrap items-center gap-2 border-b px-3 py-2">
		<div class="mr-1 hidden gap-1.5 sm:flex" aria-hidden="true">
			<span class="h-2.5 w-2.5 rounded-full bg-white/15"></span>
			<span class="h-2.5 w-2.5 rounded-full bg-white/15"></span>
			<span class="h-2.5 w-2.5 rounded-full bg-white/15"></span>
		</div>

		<div class="flex rounded-md border bg-black/30 p-0.5" role="group" aria-label="Tree size">
			{#each sizes as option (option)}
				<button
					type="button"
					class={cn(
						'h-6 rounded px-2 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
						size === option
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:text-foreground'
					)}
					aria-pressed={size === option}
					disabled={building}
					onclick={() => build(option)}
				>
					{compact(option)}
				</button>
			{/each}
		</div>

		<div class="ml-auto flex flex-wrap gap-1.5">
			<button type="button" class={toolButton} disabled={building} onclick={jumpToRandom}>
				<LocateFixed class="h-3.5 w-3.5" />
				Jump to random
			</button>
			<button
				type="button"
				class={toolButton}
				disabled={building || !canExpandAll}
				title={canExpandAll
					? undefined
					: 'A fully expanded list this long would be taller than browsers can lay out.'}
				onclick={() => measure('Expanded everything', () => tree.expandAll())}
			>
				<UnfoldVertical class="h-3.5 w-3.5" />
				<span class="hidden sm:inline">Expand all</span>
			</button>
			<button
				type="button"
				class={toolButton}
				disabled={building}
				onclick={() => measure('Collapsed everything', () => tree.collapseAll())}
			>
				<FoldVertical class="h-3.5 w-3.5" />
				<span class="hidden sm:inline">Collapse all</span>
			</button>
		</div>
	</div>

	<!-- Tree -->
	<div class="relative">
		<div
			bind:this={scrollEl}
			class={cn(
				'overflow-auto font-mono text-[13px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
				treeClass
			)}
			role="tree"
			aria-label="Demo file tree"
			aria-activedescendant={tree.selectedId === null ? undefined : `${uid}-${tree.selectedId}`}
			tabindex="0"
			{onkeydown}
		>
			<div style="position: relative; height: {$virtualizer.getTotalSize()}px;">
				{#each $virtualizer.getVirtualItems() as row (row.key)}
					{@const node = tree.visibleItems[row.index]}
					{#if node}
						{@const hasChildren = tree.hasChildren(node.id)}
						{@const expanded = tree.isExpanded(node.id)}
						{@const selected = tree.isSelected(node.id)}
						{@const level = tree.getLevel(node.id)}
						{@const file = fileIcon(node.name)}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							id="{uid}-{node.id}"
							role="treeitem"
							tabindex="-1"
							aria-level={level + 1}
							aria-selected={selected}
							aria-expanded={hasChildren ? expanded : undefined}
							class={cn(
								'row absolute left-0 top-0 flex w-full cursor-pointer select-none items-center whitespace-nowrap pr-3 text-slate-300 hover:bg-white/[0.05]',
								selected && 'selected text-foreground',
								flashId === node.id && 'flash'
							)}
							style="height: {row.size}px; transform: translateY({row.start}px);"
							onclick={() => activate(node)}
						>
							<span class="guides ml-3 h-full shrink-0" style="width: {level * 16}px;"></span>
							<ChevronRight
								class={cn(
									'mr-1 h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-150',
									expanded && 'rotate-90',
									!hasChildren && 'invisible'
								)}
							/>
							{#if hasChildren}
								{#if expanded}
									<FolderOpen class="mr-2 h-4 w-4 shrink-0 text-amber-400" />
								{:else}
									<Folder class="mr-2 h-4 w-4 shrink-0 text-amber-400/80" />
								{/if}
							{:else}
								<file.icon class={cn('mr-2 h-4 w-4 shrink-0', file.color)} />
							{/if}
							<span>{tree.getLabel(node)}</span>
							{#if hasChildren}
								<span class="ml-2 rounded bg-white/[0.06] px-1.5 text-[11px] text-slate-500">
									{tree.getChildren(node.id).length}
								</span>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		</div>

		{#if building}
			<div
				class="absolute inset-0 grid place-items-center bg-background/70 font-mono text-sm text-muted-foreground backdrop-blur-sm"
				role="status"
			>
				<span class="animate-pulse">Building {size.toLocaleString('en-US')} nodes…</span>
			</div>
		{/if}
	</div>

	<!-- Live stats -->
	<dl class="grid grid-cols-2 border-t text-xs sm:grid-cols-4">
		<div class="border-b border-r px-3 py-2 sm:border-b-0">
			<dt class="text-muted-foreground">Nodes in tree</dt>
			<dd class="font-mono text-base text-foreground"><AnimatedNumber value={total} /></dd>
		</div>
		<div class="border-b px-3 py-2 sm:border-b-0 sm:border-r">
			<dt class="text-muted-foreground">Rows in list</dt>
			<dd class="font-mono text-base text-foreground">
				<AnimatedNumber value={tree.visibleItems.length} />
			</dd>
		</div>
		<div class="border-r px-3 py-2">
			<dt class="text-muted-foreground">Rows in the DOM</dt>
			<dd class="font-mono text-base font-semibold text-primary" data-testid="dom-rows">
				{$virtualizer.getVirtualItems().length}
			</dd>
		</div>
		<div class="min-w-0 px-3 py-2">
			<dt class="truncate text-muted-foreground" title={lastUpdate?.label}>
				{lastUpdate?.label ?? 'Last update'}
			</dt>
			<dd class="font-mono text-base text-foreground">
				{lastUpdate
					? `${lastUpdate.ms < 10 ? lastUpdate.ms.toFixed(1) : Math.round(lastUpdate.ms)} ms`
					: '–'}
			</dd>
		</div>
	</dl>
</div>

<style>
	/* Indent guides: one hairline per level. */
	.guides {
		background-image: repeating-linear-gradient(
			to right,
			transparent 0 6px,
			hsl(0 0% 100% / 0.08) 6px 7px,
			transparent 7px 16px
		);
	}
	.row.selected {
		background: linear-gradient(to right, hsl(var(--primary) / 0.22), hsl(var(--primary) / 0.04));
		box-shadow: inset 2px 0 0 hsl(var(--primary));
	}
	.row.flash {
		animation: flash 1.4s ease-out;
	}
	@keyframes flash {
		0%,
		30% {
			background-color: hsl(var(--primary) / 0.55);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.row.flash {
			animation: none;
		}
	}
</style>
