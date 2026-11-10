import type { VirtualTreeItem } from '#lib';

export type FileItem = { name: string };

const PROJECT_A = ['atomic', 'quiet', 'solar', 'lucid', 'rapid', 'amber', 'north', 'hollow'];
const PROJECT_B = ['router', 'engine', 'kit', 'studio', 'forge', 'canvas', 'relay', 'atlas'];
const FOLDERS = [
	'src',
	'lib',
	'components',
	'routes',
	'utils',
	'hooks',
	'stores',
	'assets',
	'tests',
	'docs',
	'api',
	'core',
	'ui',
	'server',
	'client',
	'types',
	'styles',
	'config',
	'scripts',
	'public'
];
const STEMS = [
	'index',
	'app',
	'button',
	'tree',
	'layout',
	'page',
	'store',
	'client',
	'schema',
	'utils',
	'theme',
	'README',
	'logo',
	'config',
	'session',
	'query'
];
const EXTENSIONS = ['.svelte', '.ts', '.ts', '.js', '.json', '.css', '.md', '.png', '.svg'];

/** Small seeded random number generator, so every visit sees the same tree. */
function mulberry32(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Build a fake file tree with exactly `target` nodes, numbered 1..target.
 * Each root is a small project a few folders deep.
 */
export function generateTree(target: number, seed = 7): VirtualTreeItem<FileItem>[] {
	const random = mulberry32(seed);
	const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];
	let id = 0;

	const folder = (name: string, depth: number): VirtualTreeItem<FileItem> => {
		const children: VirtualTreeItem<FileItem>[] = [];
		const node = { id: ++id, name, children };
		const folders = depth < 5 ? Math.floor(random() * 4) : 0;
		const files = 1 + Math.floor(random() * 6);
		for (let i = 0; i < folders && id < target; i++) {
			children.push(folder(pick(FOLDERS), depth + 1));
		}
		for (let i = 0; i < files && id < target; i++) {
			children.push({ id: ++id, name: pick(STEMS) + pick(EXTENSIONS) });
		}
		return node;
	};

	const roots: VirtualTreeItem<FileItem>[] = [];
	while (id < target) {
		roots.push(folder(`${pick(PROJECT_A)}-${pick(PROJECT_B)}-${roots.length + 1}`, 0));
	}
	return roots;
}
