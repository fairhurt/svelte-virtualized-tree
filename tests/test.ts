import { expect, test } from '@playwright/test';

const PAGES = ['/', '/examples/basic'];

test('every page renders a heading', async ({ page }) => {
	for (const path of ['/', '/installation', '/usage', '/examples/basic']) {
		await page.goto(path);
		await expect(page.locator('h1')).toBeVisible();
	}
});

for (const path of PAGES) {
	test(`${path} only renders the rows in view`, async ({ page }) => {
		await page.goto(path);
		const rows = page.getByRole('treeitem');
		await expect(rows.first()).toBeVisible();
		// Tens of thousands of nodes, but only the rows on screen plus overscan are rendered.
		expect(await rows.count()).toBeLessThan(80);
		await expect(page.getByText('Nodes in tree')).toBeVisible();
	});
}

test('playground expands, collapses and selects nodes', async ({ page }) => {
	await page.goto('/examples/basic');
	const tree = page.getByRole('tree');
	await expect(tree.getByRole('treeitem').first()).toBeVisible();

	const collapsed = tree.locator('[role="treeitem"][aria-expanded="false"]').first();
	const name = await collapsed.getAttribute('id');
	await collapsed.click();
	const clicked = tree.locator(`[id="${name}"]`);
	await expect(clicked).toHaveAttribute('aria-expanded', 'true');
	await expect(clicked).toHaveAttribute('aria-selected', 'true');

	await page.getByRole('button', { name: 'Collapse all' }).click();
	await expect(tree.locator('[role="treeitem"][aria-expanded="true"]')).toHaveCount(0);
});

test('playground jumps to a node deep in a million', async ({ page }) => {
	await page.goto('/examples/basic');
	const tree = page.getByRole('tree');
	await expect(tree.getByRole('treeitem').first()).toBeVisible();

	await page.getByRole('button', { name: '1M', exact: true }).click();
	await expect(page.getByText('1,000,000')).toBeVisible({ timeout: 20_000 });

	await page.getByRole('button', { name: 'Jump to random' }).click();
	await expect(tree.locator('[role="treeitem"][aria-selected="true"]')).toBeVisible();
});

test('the tree can be driven from the keyboard', async ({ page }) => {
	await page.goto('/examples/basic');
	const tree = page.getByRole('tree');
	await expect(tree.getByRole('treeitem').first()).toBeVisible();

	await tree.focus();
	await page.keyboard.press('Home');
	const first = tree.getByRole('treeitem').first();
	await expect(first).toHaveAttribute('aria-selected', 'true');
	await page.keyboard.press('ArrowLeft');
	await expect(first).toHaveAttribute('aria-expanded', 'false');
	await page.keyboard.press('ArrowRight');
	await expect(first).toHaveAttribute('aria-expanded', 'true');
	await page.keyboard.press('ArrowDown');
	await expect(first).toHaveAttribute('aria-selected', 'false');
});
