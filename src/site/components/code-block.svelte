<script lang="ts">
	import { cn } from '#site/utils.js';
	import CopyButton from './copy-button.svelte';

	let {
		html,
		code,
		title,
		class: className
	}: {
		/** Highlighted markup from `highlight()`. */
		html: string;
		/** The raw snippet, for the copy button. */
		code: string;
		title?: string;
		class?: string;
	} = $props();
</script>

<div class={cn('overflow-hidden rounded-xl border bg-black/50 backdrop-blur', className)}>
	<div class="flex items-center justify-between border-b py-1.5 pl-4 pr-2">
		<span class="font-mono text-xs text-muted-foreground">{title}</span>
		<CopyButton text={code} />
	</div>
	<div class="prose-code">
		<!-- Built from our own snippets at build time. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html html}
	</div>
</div>
