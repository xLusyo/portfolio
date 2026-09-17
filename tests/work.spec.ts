import { expect, test } from '@playwright/test';

for (const route of ['/', '/work/']) {
  for (const width of [320, 800, 1440]) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`${route} ${width}px ${colorScheme}: minimal project lightbox`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(route);
        const cards = page.locator('.card');
        await expect(cards).toHaveCount(route === '/' ? 2 : 3);
        await expect(cards.first().locator('.badges li')).toHaveText(['Dev', 'Full Stack', 'Laravel 11']);
        await expect(cards.locator('.description')).toHaveCount(0);
        await expect(cards.locator('.website')).toHaveCount(0);
        const trigger = cards.first().getByRole('link', { name: 'Preview Portal' });
        await trigger.scrollIntoViewIfNeeded();
        await trigger.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Portal', exact: true });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('heading')).toHaveText('Portal');
        await expect(dialog.locator('.badges li')).toHaveText(['Dev', 'Full Stack', 'Laravel 11']);
        await expect(dialog.locator('.project-media')).toHaveAttribute('aria-busy', 'false');
        await expect(dialog.locator('.image-status')).toBeHidden();
        await expect.poll(() => dialog.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
        await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
        await page.keyboard.press('Tab');
        expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true);
        const geometry = await dialog.evaluate(el => {
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, overflow: el.scrollWidth > el.clientWidth };
        });
        expect(geometry.left).toBeGreaterThanOrEqual(0);
        expect(geometry.right).toBeLessThanOrEqual(width);
        expect(geometry.top).toBeGreaterThanOrEqual(0);
        expect(geometry.bottom).toBeLessThanOrEqual(900);
        expect(geometry.overflow).toBe(false);
        expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
        await dialog.locator('img').evaluate(async (img: HTMLImageElement) => {
          await img.decode();
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        });
        await page.screenshot({ path: testInfo.outputPath('lightbox.png') });
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
        expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
        expect(new URL(page.url()).pathname).toBe(route);
        expect(new URL(page.url()).hash).toBe('');
        expect(errors).toEqual([]);
      });
    }
  }
}

test('all projects open independently; Close and backdrop restore focus', async ({ page }) => {
  await page.goto('/work/');
  for (const trigger of await page.locator('.preview').all()) {
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('heading').click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.mouse.click(2, 2);
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test('nested deep links and legacy URLs open the corresponding project', async ({ page }) => {
  await page.goto('/work/#project=nested%2Fduvet-genius');
  await expect(page.getByRole('dialog', { name: 'Pemble Painting', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Pemble Painting', exact: true })).toBeVisible();
  await page.goto('/work/portal-df');
  await expect(page.getByRole('dialog', { name: 'Portal', exact: true })).toBeVisible();
  await page.goto('/work/#project=%INVALID');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('image failure leaves a usable dialog', async ({ page }) => {
  await page.route('**/portal-thumb.png', route => route.abort());
  await page.goto('/work/');
  await page.getByRole('link', { name: 'Preview Portal' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('status')).toHaveText('Preview unavailable. Please close and try again.');
  await expect(dialog.locator('.project-media')).toHaveAttribute('aria-busy', 'false');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

test('without JavaScript projects retain real image links', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:4321/work/');
  const preview = page.getByRole('link', { name: 'Preview Portal' });
  await expect(preview).toHaveAttribute('href', '/assets/portal-thumb.png');
  await preview.click();
  await expect(page).toHaveURL(/\/assets\/portal-thumb.png$/);
  await context.close();
});
