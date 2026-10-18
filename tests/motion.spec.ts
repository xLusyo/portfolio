import { expect, test } from '@playwright/test';
import { expectAnimated, expectSettled, observeMotion, samplesFor } from './motion-helpers';

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`${viewport.width}px: reduced motion disables smooth scrolling`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const root = viewport.width <= 1024 ? '.portfolio' : '#content';
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
    const root = viewport.width <= 1024 ? '.portfolio' : '#content';
    await expect(page.locator(root)).toHaveCSS('scroll-behavior', 'smooth');
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

test.describe('GSAP portfolio motion', () => {
  test.use({ reducedMotion: 'no-preference', forcedColors: 'none' });

  test.beforeEach(async ({ page }) => {
    await observeMotion(page);
  });

  test('desktop introduction animates, finishes promptly, and clears temporary styles', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const portrait = page.locator('[data-motion="portrait"]');
    await expectAnimated(portrait);
    await expectSettled(page.locator('[data-motion="portrait"], [data-motion="profile"], [data-motion="intro"]'));
    const samples = await samplesFor(portrait);
    const start = samples.find(sample => sample.opacity !== '' && Number(sample.opacity) < 1)!;
    const end = samples.find(sample => sample.at > start.at && sample.opacity === '' && sample.transform === '')!;
    expect(end.at - start.at).toBeLessThan(1500);
  });

  for (const viewport of [{ width: 390, height: 844 }, { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 3840, height: 2160 }]) {
    test(`${viewport.width}px: experience, projects, and tools animate once in their scroll container`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expectAnimated(page.locator('[data-motion="portrait"]'));
      await expectSettled(page.locator('[data-motion="portrait"]'));
      for (const kind of ['experience', 'project', 'tool']) {
        const target = page.locator(`[data-motion="${kind}"]`).first();
        await target.scrollIntoViewIfNeeded();
        await expectAnimated(target);
        await expectSettled(target);
      }
      const root = page.locator(viewport.width <= 1024 ? '.portfolio' : '#content');
      expect(await root.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      await page.locator('[data-motion="tool"]').last().scrollIntoViewIfNeeded();
      await expectSettled(page.locator('[data-motion="tool"]'));
      await page.screenshot({ path: testInfo.outputPath(`motion-tools-${viewport.width}.png`) });
      const project = page.locator('[data-motion="project"]').first();
      const before = (await samplesFor(project)).length;
      await page.locator('[data-motion="portrait"]').scrollIntoViewIfNeeded();
      await project.scrollIntoViewIfNeeded();
      await expectSettled(project);
      expect((await samplesFor(project)).length).toBe(before);
      expect(await page.evaluate(() => scrollY)).toBe(0);
    });
  }

  test('keyboard focus reveals a pending project before opening its accessible dialog', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expectAnimated(page.locator('[data-motion="portrait"]'));
    const project = page.locator('[data-motion="project"]').first();
    await expect(project).toHaveCSS('opacity', '0');
    const trigger = project.locator('.preview');
    await trigger.focus();
    await expectSettled(project);
    await page.keyboard.press('Enter');
    await expect(page.locator('#project-lightbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('breakpoint changes preserve completed reveals and attach unseen cards to the new scroller', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const portrait = page.locator('[data-motion="portrait"]');
    await expectAnimated(portrait);
    await expectSettled(portrait);
    const before = (await samplesFor(portrait)).filter(sample => sample.opacity !== '' && Number(sample.opacity) < 1).length;
    await page.setViewportSize({ width: 1024, height: 768 });
    await expectSettled(portrait);
    const tool = page.locator('[data-motion="tool"]').first();
    await tool.scrollIntoViewIfNeeded();
    await expectAnimated(tool);
    await expectSettled(tool);
    await page.setViewportSize({ width: 1025, height: 900 });
    await expectSettled(portrait);
    await tool.scrollIntoViewIfNeeded();
    await expectSettled(tool);
    const after = (await samplesFor(portrait)).filter(sample => sample.opacity !== '' && Number(sample.opacity) < 1).length;
    expect(after).toBe(before);
  });

  test('preference changes immediately reveal content and completed entrances do not replay', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const portrait = page.locator('[data-motion="portrait"]');
    await expectAnimated(portrait);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expectSettled(page.locator('[data-motion]'));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expectSettled(portrait);
    await page.emulateMedia({ forcedColors: 'active' });
    await expectSettled(page.locator('[data-motion]'));
    await page.emulateMedia({ forcedColors: 'none' });
    await expectSettled(portrait);
  });

  test('direct section and project links skip the introduction and stay immediately usable', async ({ page }) => {
    await page.goto('/#tools');
    await page.waitForLoadState('networkidle');
    await expectSettled(page.locator('[data-motion="intro"], [data-motion="portrait"], [data-motion="tool"]'));
    expect(await samplesFor(page.locator('[data-motion="portrait"]'))).toHaveLength(0);
    await page.goto('/#project=portal-df');
    await expect(page.getByRole('dialog', { name: 'Portal', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Preview Portal', exact: true })).toBeFocused();
    await expectSettled(page.locator('[data-project-id="portal-df"]'));
  });

  test('browser history restoration returns to visible content without replaying the intro', async ({ page }) => {
    await page.goto('/');
    await expectAnimated(page.locator('[data-motion="portrait"]'));
    await expectSettled(page.locator('[data-motion="portrait"]'));
    await page.goto('/missing-page/');
    await page.goBack();
    await expectSettled(page.locator('[data-motion]'));
    const navigationType = await page.evaluate(() => (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming).type);
    if (navigationType === 'back_forward') expect(await samplesFor(page.locator('[data-motion="portrait"]'))).toHaveLength(0);
  });

  test('a motion-module loading failure leaves every section visible', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const feedback: string[] = [];
    page.on('console', message => { if (message.type() === 'error') feedback.push(message.text()); });
    await page.route(/\/portfolio-motion\.[^/]*$/, route => route.abort());
    await page.goto('/');
    await expectSettled(page.locator('[data-motion]'));
    await expect.poll(() => feedback.some(message => message.includes('Portfolio motion could not be initialized'))).toBe(true);
    expect(errors).toEqual([]);
  });
});

for (const preference of ['reduced motion', 'forced colors'] as const) {
  test(`${preference}: content stays static and GSAP is not downloaded`, async ({ page }) => {
    const requests: string[] = [];
    page.on('request', request => {
      if (/\/portfolio-motion\.|\/gsap[./]/.test(request.url())) requests.push(request.url());
    });
    await page.emulateMedia(preference === 'reduced motion'
      ? { reducedMotion: 'reduce', forcedColors: 'none' }
      : { reducedMotion: 'no-preference', forcedColors: 'active' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expectSettled(page.locator('[data-motion]'));
    expect(requests).toEqual([]);
  });
}

test.describe('motion without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the full portfolio remains visible and projects retain their image links', async ({ page }) => {
    await page.goto('/');
    await expectSettled(page.locator('[data-motion]'));
    await expect(page.locator('.preview').first()).toHaveAttribute('href', /.+/);
    await page.locator('#tools').scrollIntoViewIfNeeded();
    await expect(page.getByRole('heading', { name: 'Tech Stack & Tools' })).toBeVisible();
  });
});
