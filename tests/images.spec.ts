import { expect, test } from '@playwright/test';
import { expectOptimizedWebP, expectResponsiveImage, imageURLs, srcsetCandidates, templateImages } from './image-helpers';

for (const viewportWidth of [390, 1440]) {
  for (const portrait of [
    { route: '/', selector: '.portrait img', width: 384 },
    { route: '/about/', selector: 'main.about img', width: 720 },
  ]) {
    test(`${portrait.route} ${viewportWidth}px: responsive optimized portrait keeps priority and framing`, async ({ page }) => {
      await page.setViewportSize({ width: viewportWidth, height: 900 });
      await page.goto(portrait.route);
      const image = page.locator(portrait.selector);
      await expectResponsiveImage(image);
      await expect(image).toHaveAttribute('width', String(portrait.width));
      // Astro infers height from source metadata; CSS, not a second asset crop,
      // keeps the established portrait framing on each page.
      expect(Number(await image.getAttribute('height'))).toBeGreaterThan(portrait.width);
      await expect(image).toHaveAttribute('loading', 'eager');
      await expect(image).toHaveAttribute('fetchpriority', 'high');
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      await image.evaluate((img: HTMLImageElement) => img.decode());
      const geometry = await image.evaluate((img: HTMLImageElement) => {
        const rect = img.getBoundingClientRect();
        const style = getComputedStyle(img);
        return { left: rect.left, right: rect.right, width: rect.width, height: rect.height,
          fit: style.objectFit, position: style.objectPosition, currentSrc: img.currentSrc };
      });
      expectOptimizedWebP(geometry.currentSrc);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(viewportWidth);
      expect(geometry.fit).toBe('cover');
      expect(geometry.position).toBe('50% 25%');
      if (portrait.route === '/') expect(geometry.width / geometry.height).toBeCloseTo(4 / 5, 2);
      else {
        expect(geometry.height).toBeGreaterThan(0);
        const maxHeight = await image.evaluate(img => parseFloat(getComputedStyle(img).maxHeight));
        expect(geometry.height).toBeLessThanOrEqual(maxHeight + 1);
      }
    });
  }

  test(`${viewportWidth}px: all project cards are responsive 16:10 top crops, full screenshots are not`, async ({ page }) => {
    await page.setViewportSize({ width: viewportWidth, height: 900 });
    await page.goto('/work/');
    const cards = page.locator('.card');
    expect(await cards.count()).toBeGreaterThanOrEqual(5);
    for (const card of await cards.all()) {
      const image = card.locator('.preview img');
      await expectResponsiveImage(image);
      await expect(image).toHaveAttribute('width', '720');
      await expect(image).toHaveAttribute('height', '450');
      await expect(image).toHaveAttribute('loading', 'lazy');
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      const crop = await image.evaluate((img: HTMLImageElement) => {
        const rect = img.getBoundingClientRect();
        const style = getComputedStyle(img);
        return { ratio: rect.width / rect.height, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
          fit: style.objectFit, position: style.objectPosition };
      });
      expect(crop.ratio, 'Card geometry must not use the fixed 450px HTML height').toBeCloseTo(16 / 10, 2);
      // naturalWidth/Height are density-corrected integer CSS pixels for srcset;
      // allow one pixel of rounding, not a stretched or uncropped bitmap.
      expect(Math.abs(crop.naturalHeight - crop.naturalWidth * 10 / 16),
        'The optimized bitmap itself is cropped, not just CSS').toBeLessThanOrEqual(1);
      expect(crop.fit).toBe('cover');
      expect(crop.position).toBe('50% 0%');

      const [full] = await templateImages(card);
      expect(full.width).toBeGreaterThan(0);
      expect(full.width).toBeLessThanOrEqual(1920);
      expect(full.height).toBeGreaterThan(0);
      expect(full.loading).toBe('eager');
      expect(full.decoding).toBe('async');
      expect(full.sizes).not.toBe('');
      expectOptimizedWebP(full.src);
      const candidates = srcsetCandidates(full.srcset);
      // Astro caps requested widths to the intrinsic source width rather than
      // upscaling a narrower screenshot.
      const expectedWidths = [...new Set([480, 960, 1440, 1920].map(width => Math.min(width, full.width)))];
      expect(candidates.map(candidate => candidate.width)).toEqual(expectedWidths);
      for (const candidate of candidates) expectOptimizedWebP(candidate.url);
      expect(new URL((await card.locator('.preview').getAttribute('href'))!, page.url()).href).toBe(full.src);
      expect(new URL((await card.locator('.title a').getAttribute('href'))!, page.url()).href).toBe(full.src);

      await card.locator('.preview').click();
      const dialog = page.getByRole('dialog');
      const fullImage = dialog.locator('img');
      await expect(dialog.locator('.project-media')).toHaveAttribute('aria-busy', 'false');
      await expectResponsiveImage(fullImage);
      await expect(fullImage).toHaveAttribute('loading', 'eager');
      await fullImage.evaluate((img: HTMLImageElement) => img.decode());
      const uncropped = await fullImage.evaluate((img: HTMLImageElement) => {
        const style = getComputedStyle(img);
        const contentWidth = img.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const contentHeight = img.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
        return { contentWidth, contentHeight, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight,
          currentSrc: img.currentSrc };
      });
      expectOptimizedWebP(uncropped.currentSrc);
      const fullRatio = full.width / full.height;
      // Both axes can round by one CSS pixel; use a dimension-based tolerance
      // rather than a ratio delta that penalizes narrow responsive candidates.
      expect(Math.abs(uncropped.naturalWidth - uncropped.naturalHeight * fullRatio),
        'Full screenshot keeps its metadata aspect ratio').toBeLessThanOrEqual(1 + fullRatio);
      expect(Math.abs(uncropped.contentWidth - uncropped.contentHeight * fullRatio),
        'Lightbox does not crop or stretch the screenshot').toBeLessThanOrEqual(1 + fullRatio);
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    }
  });
}

for (const route of ['/', '/work/']) {
  test(`${route}: eager full screenshots stay inert until their lightbox opens`, async ({ page }) => {
    const requests = new Set<string>();
    page.on('request', request => {
      if (request.resourceType() === 'image') requests.add(request.url());
    });
    await page.goto(route);
    const cards = page.locator('.card');
    const fullImages = await templateImages(cards);
    expect(fullImages.length).toBeGreaterThan(1);
    const fullURLs = fullImages.map(imageURLs);
    for (const image of fullImages) expect(image.loading).toBe('eager');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('#project-lightbox img')).toHaveCount(0);
    // Load all visible/card assets before checking. Template images must remain
    // deferred even when their corresponding cards have entered the viewport.
    for (const image of await cards.locator('.preview img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    for (const urls of fullURLs) {
      expect([...urls].filter(url => requests.has(url)), 'No template src or responsive candidate is fetched before opening').toEqual([]);
    }
    await cards.first().locator('.preview').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.project-media')).toHaveAttribute('aria-busy', 'false');
    const currentSrc = await dialog.locator('img').evaluate((img: HTMLImageElement) => img.currentSrc);
    expect(fullURLs[0].has(currentSrc), 'The lightbox chooses a full responsive image, not its card crop').toBe(true);
    expect(requests.has(currentSrc), 'Opening initiates the deferred image request').toBe(true);
    for (const urls of fullURLs.slice(1)) {
      expect([...urls].filter(url => requests.has(url)), 'Other project templates remain inert').toEqual([]);
    }
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('#project-lightbox img')).toHaveCount(0);
  });
}
