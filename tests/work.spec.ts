import { expect, test } from '@playwright/test';
import { expectOptimizedWebP, imageURLs, templateImages } from './image-helpers';

for (const route of ['/']) {
  for (const width of [320, 800, 1440]) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`${route} ${width}px ${colorScheme}: minimal project lightbox`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme });
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(route);
        const cards = page.locator('.card');
        await expect(cards).toHaveCount(5);
        const firstCard = cards.first();
        const title = (await firstCard.locator('.title').innerText()).trim();
        const tags = await firstCard.locator('.badges li').allTextContents();
        const id = await firstCard.getAttribute('data-project-id');
        expect(title).not.toBe('');
        expect(tags.length).toBeGreaterThan(0);
        expect(id).toBeTruthy();
        await expect(cards.locator('.description')).toHaveCount(0);
        const trigger = firstCard.getByRole('link', { name: `Preview ${title}`, exact: true });
        await trigger.scrollIntoViewIfNeeded();
        await trigger.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: title, exact: true });
        await expect(dialog).toBeVisible();
        expect(new URL(page.url()).hash).toBe(`#project=${encodeURIComponent(id!)}`);
        await expect(dialog.getByRole('heading')).toHaveText(title);
        await expect(dialog.locator('.badges li')).toHaveText(tags);
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
  await page.goto('/');
  for (const trigger of await page.locator('.preview').all()) {
    await trigger.click();
    const dialog = page.locator('#project-lightbox');
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
  await page.goto('/#project=nested%2Fduvet-genius');
  await expect(page.getByRole('dialog', { name: 'Pemble Painting', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Pemble Painting', exact: true })).toBeVisible();
  await page.goto('/work/portal-df');
  await expect(page.getByRole('dialog', { name: 'Portal', exact: true })).toBeVisible();
  await page.goto('/#project=%INVALID');
  await expect(page.locator('#project-lightbox')).toBeHidden();
});

test('image failure leaves a usable dialog', async ({ page }) => {
  await page.goto('/');
  const portal = page.locator('.card').filter({ has: page.getByRole('link', { name: 'Preview Portal', exact: true }) });
  const [image] = await templateImages(portal);
  const fullImageURLs = imageURLs(image);
  let blocked = 0;
  // Match every responsive full-image candidate, not the old public PNG or
  // just src: the browser normally chooses a different URL from srcset.
  await page.route(url => fullImageURLs.has(url.href), route => {
    blocked++;
    return route.abort();
  });
  await portal.getByRole('link', { name: 'Preview Portal', exact: true }).click();
  const dialog = page.locator('#project-lightbox');
  await expect(dialog.getByRole('status')).toHaveText('Preview unavailable. Please close and try again.');
  expect(blocked, 'The optimized full screenshot request was intercepted').toBeGreaterThan(0);
  await expect(dialog.locator('.project-media')).toHaveAttribute('aria-busy', 'false');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
});

test.describe('project links without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('projects retain real optimized full-image links', async ({ page }) => {
    await page.goto('/');
    const preview = page.getByRole('link', { name: 'Preview Portal', exact: true });
    const href = await preview.getAttribute('href');
    expect(href).toBeTruthy();
    expectOptimizedWebP(href!);
    const destination = new URL(href!, page.url()).href;
    const response = await Promise.all([
      page.waitForResponse(response => response.url() === destination),
      preview.click(),
    ]).then(([response]) => response);
    await expect(page).toHaveURL(destination);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/webp');
  });
});
