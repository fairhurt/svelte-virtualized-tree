import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			adapter: adapter()
		})
	],
	// Unit tests exercise runes, so load Svelte's client build rather than the server one.
	resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'happy-dom'
	}
});
