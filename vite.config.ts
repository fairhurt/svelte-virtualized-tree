import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			// The docs site is hosted on Vercel and fully prerendered.
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
