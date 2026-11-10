<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	let { value }: { value: number } = $props();

	const tween = new Tween(0, { duration: 450, easing: cubicOut });

	$effect(() => {
		tween.target = value;
	});
</script>

<span class="tabular-nums">{Math.round(tween.current).toLocaleString('en-US')}</span>
