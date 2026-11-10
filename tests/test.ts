import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toBeVisible();
});

test('basic example only renders the rows in view', async ({ page }) => {
	await page.goto('/examples/basic');
	const rows = page.getByRole('treeitem');
	await expect(rows.first()).toBeVisible();
	// 2000 root nodes, but the 600px viewport only fits about 17 rows plus overscan.
	expect(await rows.count()).toBeLessThan(40);
});

test('basic example expands nested nodes', async ({ page }) => {
	await page.goto('/examples/basic');
	const tree = page.getByRole('tree');
	// The demo renders in the browser only, so wait for rows before counting them.
	await expect(tree.getByRole('treeitem').first()).toBeVisible();

	// Walk down the tree, expanding the first collapsed node at each level. The data is random,
	// so a level may have no expandable node in view; level 1 always does.
	for (let level = 1; level <= 3; level++) {
		const parent = tree.locator(`[role="treeitem"][aria-level="${level}"][aria-expanded="false"]`);
		if (level > 1 && (await parent.count()) === 0) break;
		await parent.first().getByRole('button').click();
		await expect(
			tree.locator(`[role="treeitem"][aria-level="${level + 1}"]`).first()
		).toBeVisible();
	}

	await expect(tree.locator('[role="treeitem"][aria-selected="true"]')).toHaveCount(1);
});
