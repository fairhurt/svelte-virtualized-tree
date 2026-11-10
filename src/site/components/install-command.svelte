<script lang="ts">
	import { cn } from '#site/utils.js';
	import CopyButton from './copy-button.svelte';

	let { tabs = false, class: className }: { tabs?: boolean; class?: string } = $props();

	const commands = {
		npm: 'npm install svelte-virtualized-tree',
		pnpm: 'pnpm add svelte-virtualized-tree',
		yarn: 'yarn add svelte-virtualized-tree',
		bun: 'bun add svelte-virtualized-tree'
	};
	type Manager = keyof typeof commands;
	const managers = Object.keys(commands) as Manager[];

	let manager = $state<Manager>('npm');
</script>

<div class={cn('overflow-hidden rounded-lg border bg-black/40 backdrop-blur', className)}>
	{#if tabs}
		<div class="flex gap-1 border-b px-2 pt-2" role="tablist" aria-label="Package manager">
			{#each managers as option (option)}
				<button
					type="button"
					role="tab"
					aria-selected={manager === option}
					class={cn(
						'-mb-px border-b-2 px-3 pb-2 font-mono text-xs transition-colors',
						manager === option
							? 'border-primary text-foreground'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					)}
					onclick={() => (manager = option)}
				>
					{option}
				</button>
			{/each}
		</div>
	{/if}
	<div class="flex items-center gap-3 py-2 pl-4 pr-2 font-mono text-sm">
		<span class="select-none text-primary" aria-hidden="true">$</span>
		<code class="flex-1 overflow-x-auto whitespace-nowrap">{commands[manager]}</code>
		<CopyButton text={commands[manager]} />
	</div>
</div>
