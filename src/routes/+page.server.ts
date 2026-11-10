import { highlight } from '#site/highlight.server.js';
import { quickStart } from '#site/snippets.js';

export const load = async () => ({
	quickStart: { code: quickStart, html: await highlight(quickStart, 'svelte') }
});
