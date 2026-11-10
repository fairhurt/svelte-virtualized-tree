import { highlight } from '#site/highlight.server.js';
import { controlling, dataShapes, quickStart, virtualList } from '#site/snippets.js';

export const load = async () => ({
	quickStart: { code: quickStart, html: await highlight(quickStart, 'svelte') },
	virtualList: { code: virtualList, html: await highlight(virtualList, 'svelte') },
	dataShapes: { code: dataShapes, html: await highlight(dataShapes, 'ts') },
	controlling: { code: controlling, html: await highlight(controlling, 'ts') }
});
