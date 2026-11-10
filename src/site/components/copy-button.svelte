<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { cn } from '#site/utils.js';

	let { text, class: className }: { text: string; class?: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		await navigator.clipboard.writeText(text);
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1500);
	}
</script>

<button
	type="button"
	class={cn(
		'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
		className
	)}
	aria-label={copied ? 'Copied' : 'Copy to clipboard'}
	onclick={copy}
>
	{#if copied}
		<Check class="h-3.5 w-3.5 text-emerald-400" />
	{:else}
		<Copy class="h-3.5 w-3.5" />
	{/if}
</button>
