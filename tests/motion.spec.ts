import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}px: reduced motion disables smooth scrolling`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const root = viewport.width <= 760 ? '.portfolio' : '#content';
    expect(await page.locator(root).evaluate(element => getComputedStyle(element).scrollBehavior)).toBe('auto');
    await page.locator('.section-nav a[href="#projects"]').click();
    await expect(page.locator('.section-nav a[href="#projects"]')).toHaveAttribute('aria-current', 'location');
    await expect(page.locator('#projects')).toBeVisible();
    expect(await page.locator('#projects').evaluate(element => getComputedStyle(element).opacity)).toBe('1');
  });

  test(`${viewport.width}px: native smooth anchors settle with motion enabled`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    const root = viewport.width <= 760 ? '.portfolio' : '#content';
    expect(await page.locator(root).evaluate(element => getComputedStyle(element).scrollBehavior)).toBe('smooth');
    await page.locator('.section-nav a[href="#tools"]').click();
    await expect(page.locator('.section-nav a[href="#tools"]')).toHaveAttribute('aria-current', 'location');
    await expect.poll(async () => {
      const section = await page.locator('#tools').boundingBox();
      return section!.y;
    }).toBeLessThan(viewport.height / 2);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.locator(root).evaluate(element => getComputedStyle(element).scrollBehavior)).toBe('auto');
  });
}

test('forced colors preserves controls, section navigation, and modal keyboard access', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  const opener = page.locator('.profile [data-contact]');
  await opener.focus();
  await page.keyboard.press('Enter');
  const close = page.getByRole('button', { name: 'Close contact dialog' });
  await expect(close).toBeFocused();
  expect(await close.evaluate(element => getComputedStyle(element).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
  await page.locator('.section-nav a[href="#projects"]').click();
  await expect(page.locator('.section-nav a[href="#projects"]')).toHaveAttribute('aria-current', 'location');
});
