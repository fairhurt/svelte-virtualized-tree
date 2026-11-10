import { codeToHtml } from 'shiki';

/** Highlight a snippet at build time, so no highlighter ships to the browser. */
export const highlight = (code: string, lang: 'svelte' | 'ts' | 'bash') =>
	codeToHtml(code, { lang, theme: 'vesper' });
