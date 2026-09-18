import { expect, test } from '@playwright/test';

const viewports = [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 800, height: 900 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

for (const viewport of viewports) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${viewport.width}px ${colorScheme}: homepage geometry and images`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.emulateMedia({ colorScheme });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('ChristianBaloncio.');
      await expect(page.locator('html')).toHaveClass(colorScheme === 'dark' ? /theme-dark/ : /^(?!.*theme-dark).*$/);
      const metrics = await page.evaluate(() => {
        const portrait = document.querySelector<HTMLImageElement>('.portrait img')!;
        const rect = portrait.getBoundingClientRect();
        const icons = [...document.querySelectorAll<SVGSVGElement>('.tools .logo svg')];
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          portraitRatio: portrait.clientWidth / portrait.clientHeight,
          portraitWidth: portrait.clientWidth,
          icons: icons.map(icon => {
            const r = icon.getBoundingClientRect();
            const slot = icon.parentElement!.getBoundingClientRect();
            return { width: r.width, height: r.height, fits: r.top >= slot.top - 1 && r.bottom <= slot.bottom + 1 };
          }),
          hero: { bottom: document.querySelector('.hero')!.getBoundingClientRect().bottom },
          portrait: { left: rect.left, right: rect.right },
          navHeight: document.querySelector('nav')!.getBoundingClientRect().height,
        };
      });
      expect(metrics.overflow, 'No horizontal scrolling').toBe(false);
      expect(metrics.portraitRatio, 'Portrait keeps its 4:5 crop at every breakpoint').toBeCloseTo(0.8, 1);
      expect(metrics.portraitWidth, 'Portrait must not expand across tablet width').toBeLessThanOrEqual(400);
      expect(metrics.portrait.left).toBeGreaterThanOrEqual(0);
      expect(metrics.portrait.right).toBeLessThanOrEqual(viewport.width);
      expect(metrics.icons).toHaveLength(18);
      for (const icon of metrics.icons) {
        expect(icon.width).toBe(24);
        expect(icon.height, 'SVG must not retain its old 127px intrinsic height').toBe(24);
        expect(icon.fits, 'Each logo stays aligned with its own label').toBe(true);
      }
      if (viewport.width >= 800) {
        expect(metrics.navHeight).toBeLessThanOrEqual(80);
        expect(metrics.hero.bottom).toBeLessThan(viewport.height);
      }
      // Exercise real lazy loading before capturing the whole page.
      for (const image of await page.locator('main img').all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
        await image.evaluate((el: HTMLImageElement) => el.decode());
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      expect(errors).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`homepage-${viewport.width}-${colorScheme}.png`), fullPage: true });
    });
  }
}

test('mobile menu supports Escape, resizing, and navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const menu = page.getByRole('navigation').getByRole('button', { name: 'Menu', exact: true });
  const work = page.locator('#menu-content').getByRole('link', { name: 'Work', exact: true });
  await expect(work).toBeHidden();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(work).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(work).toBeHidden();
  await expect(menu).toBeFocused();
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(menu).toBeHidden();
  await expect(work).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(work).toBeHidden();
  await menu.click();
  await work.click();
  await expect(page).toHaveURL(/\/work\/?$/);
});

test('theme toggle persists and homepage links work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Dark theme' });
  await toggle.click();
  await expect(page.locator('html')).toHaveClass(/theme-dark/);
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(page.locator('html')).not.toHaveClass(/theme-dark/);
  await page.locator('.hero-actions').getByRole('link', { name: 'View work' }).click();
  await expect(page).toHaveURL(/\/work\/?$/);
  await page.goto('/');
  const preview = page.locator('.project-grid .preview').first();
  const id = await preview.getAttribute('data-project-open');
  expect(id).toBeTruthy();
  await preview.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(new URL(page.url()).hash).toBe(`#project=${encodeURIComponent(id!)}`);
});
