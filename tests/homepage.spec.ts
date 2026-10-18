import { expect, test } from '@playwright/test';

const viewports = [
  { width: 320, height: 740 }, { width: 375, height: 812 },
  { width: 390, height: 844 }, { width: 760, height: 900 },
  { width: 761, height: 900 }, { width: 768, height: 1024 },
  { width: 1024, height: 768 }, { width: 1025, height: 900 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 }, { width: 2560, height: 1440 },
  { width: 3840, height: 2160 },
];

for (const viewport of viewports) {
  test(`${viewport.width}x${viewport.height}: responsive layout and scroll ownership`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ChristianBaloncio.');
    await expect(page.locator('.card')).toHaveCount(5);
    await expect(page.locator('.tool-grid .tool')).toHaveCount(6);
    const projectColumns = await page.locator('.project-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(projectColumns).toBe(viewport.width > 1024 ? 3 : 1);
    expect(await page.locator('main > section').evaluateAll(elements => elements.map(element => element.id))).toEqual(['about', 'experience', 'projects', 'tools']);
    await expect(page.locator('.experience-empty')).toHaveCount(0);
    await expect(page.locator('.job h3')).toHaveText(['Secure Line Marketing', 'Smith Brothers Media', 'Digital Feet Corporation']);
    await expect(page.locator('.job-highlights li')).toHaveCount(10);
    await expect(page.locator('.portrait img')).toHaveAttribute('alt', /Christian Baloncio/);
    await page.locator('.portrait img').evaluate((image: HTMLImageElement) => image.decode());
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    expect(await page.locator('.portfolio').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    const shell = await page.locator('.portfolio').boundingBox();
    const expectedWidth = Math.min(viewport.width, 1920);
    expect(shell!.width).toBe(expectedWidth);
    expect(shell!.x).toBe((viewport.width - expectedWidth) / 2);
    expect(shell!.y).toBe(0);
    expect(shell!.height).toBe(viewport.height);
    await page.screenshot({ path: testInfo.outputPath(`home-${viewport.width}x${viewport.height}.png`) });

    const profile = await page.locator('.profile').boundingBox();
    const actions = await page.locator('.profile-actions').boundingBox();
    if (viewport.width > 1024) {
      const portrait = await page.locator('.portrait').boundingBox();
      const information = await page.locator('.profile-info').boundingBox();
      expect(portrait!.height).toBeLessThanOrEqual(480);
      expect(information!.y).toBeCloseTo(portrait!.y + portrait!.height + 12, 1);
      expect(actions!.y + actions!.height).toBeLessThan(viewport.height);
      await expect(page.locator('.mobile-contact')).toBeHidden();
      expect(await page.locator('.profile-info').evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true);
      await page.locator('#content').hover();
      await page.mouse.wheel(0, 420);
      await expect.poll(() => page.locator('#content').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      expect(await page.locator('.profile').boundingBox()).toEqual(profile);
      expect(await page.locator('.portfolio').evaluate(element => element.scrollTop)).toBe(0);
    } else {
      await expect(page.locator('.mobile-contact')).toBeVisible();
      expect(await page.locator('#content').evaluate(element => getComputedStyle(element).display)).toBe('contents');
      await page.locator('.portrait').hover();
      await page.mouse.wheel(0, 1000);
      await expect.poll(() => page.locator('.portfolio').evaluate(element => element.scrollTop)).toBeGreaterThan(0);
      expect(await page.evaluate(() => scrollY)).toBe(0);
    }
    await page.locator('.section-nav a[href="#tools"]').click();
    await expect(page.locator('.section-nav a[href="#tools"]')).toHaveAttribute('aria-current', 'location');
    const root = viewport.width <= 1024 ? '.portfolio' : '#content';
    expect(await page.locator('.tool-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(viewport.width > 1024 ? 3 : viewport.width > 760 ? 2 : 1);
    await page.locator(root).evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(page.locator('.section-nav a[href="#tools"]')).toHaveAttribute('aria-current', 'location');
    const nav = await page.locator('.section-nav').boundingBox();
    expect(nav!.y).toBeGreaterThanOrEqual(0);
    const footer = await page.locator('.content footer').boundingBox();
    if (viewport.width <= 1024) {
      const contact = await page.locator('.mobile-contact').boundingBox();
      expect(footer!.y + footer!.height).toBeLessThanOrEqual(contact!.y);
      expect(await page.locator('.tool-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(viewport.width > 760 ? 2 : 1);
      expect(await page.locator('.project-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1);
    }
    expect(await page.locator(root).evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`tools-${viewport.width}x${viewport.height}.png`) });
    await page.locator('.section-nav a[href="#about"]').click();
    await expect(page.locator('.section-nav a[href="#about"]')).toHaveAttribute('aria-current', 'location');
    expect(errors).toEqual([]);
  });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`approved dark shell stays consistent with ${scheme} system preference`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    expect(await page.locator('.portfolio').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(3, 3, 3)');
    expect(await page.locator('html').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(3, 3, 3)');
    const shell = await page.locator('.portfolio').boundingBox();
    const viewportWidth = await page.evaluate(() => innerWidth);
    expect(shell!.x).toBe((viewportWidth - Math.min(viewportWidth, 1920)) / 2);
    expect(shell!.y).toBe(0);
    expect(shell!.width).toBe(Math.min(viewportWidth, 1920));
  });
}

test('production homepage contains no mockup presentation controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.study-bar, .view-switch, iframe')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Desktop', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mobile', exact: true })).toHaveCount(0);
  await expect(page.getByText('Design review', { exact: true })).toHaveCount(0);
});

test('responsive resizing resets the previous scroll container', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#projects');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('.portfolio').evaluate(element => element.scrollTop)).toBe(0);
  await page.locator('.portfolio').evaluate(element => { element.scrollTop = 1500; });
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect.poll(() => page.locator('#content').evaluate(element => element.scrollTop)).toBe(0);
  await expect(page.locator('.section-nav a[href="#about"]')).toHaveAttribute('aria-current', 'location');
});

for (const [route, hash] of [['/about/', '#about'], ['/work/', '#projects'], ['/work/portal-df', '#project=portal-df'], ['/work/nested/duvet-genius', '#project=nested%2Fduvet-genius']]) {
  test(`${route} redirects into the homepage`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`^http://localhost:4321/${hash}$`));
    await expect(page.locator('.profile')).toBeAttached();
    if (hash.startsWith('#project=')) await expect(page.locator('#project-lightbox')).toBeVisible();
    else await expect(page.locator(`.section-nav a[href="${hash}"]`)).toHaveAttribute('aria-current', 'location');
  });
}

test('missing routes retain a useful homepage link', async ({ page }) => {
  const response = await page.goto('/missing-page/');
  expect(response?.status()).toBe(404);
  await page.getByRole('link', { name: /Back to the portfolio/ }).click();
  await expect(page).toHaveURL('/');
});
