import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { expectOptimizedWebP } from './image-helpers';

const root = 'main[data-home-motion]';
const targets = `${root} [data-motion]`;
const entrances = `${root} [data-motion="hero"], ${root} [data-motion="portrait"]`;
const reveals = `${root} [data-motion="reveal"]`;

type MotionSample = {
  index: number;
  at: number;
  opacity: string;
  transform: string;
};

declare global {
  interface Window {
    __homeMotionSamples: MotionSample[];
    __homeMotionRestored: boolean;
  }
}

// Record startup before module execution: a post-goto assertion alone could pass
// even when the controller never ran, or miss the entire sub-second entrance.
async function observeMotion(page: Page) {
  await page.addInitScript((selector) => {
    window.__homeMotionSamples = [];
    window.__homeMotionRestored = false;
    window.addEventListener('pageshow', event => {
      window.__homeMotionRestored = event.persisted;
    });
    new MutationObserver(records => {
      const changed = new Set(records.map(record => record.target));
      const elements = [...document.querySelectorAll<HTMLElement>(selector)];
      for (const node of changed) {
        if (!(node instanceof HTMLElement)) continue;
        const index = elements.indexOf(node);
        if (index < 0) continue;
        window.__homeMotionSamples.push({
          index,
          at: performance.now(),
          opacity: node.style.opacity,
          transform: node.style.transform,
        });
      }
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
  }, targets);
}

async function samplesFor(locator: Locator) {
  return locator.evaluate((element, selector) => {
    const index = [...document.querySelectorAll(selector)].indexOf(element);
    return window.__homeMotionSamples.filter(sample => sample.index === index);
  }, targets);
}

async function expectSettled(locator: Locator) {
  await expect.poll(() => locator.evaluateAll(elements => elements.length > 0 && elements.every(element => {
    const node = element as HTMLElement;
    const style = getComputedStyle(node);
    return node.style.opacity === '' && node.style.transform === '' &&
      style.opacity === '1' && style.visibility === 'visible' && style.display !== 'none';
  }))).toBe(true);
}

async function expectPending(locator: Locator) {
  await expect.poll(() => locator.evaluate((element: HTMLElement) => ({
    opacity: element.style.opacity,
    transformed: element.style.transform !== '' && element.style.transform !== 'none',
    visibility: getComputedStyle(element).visibility,
  }))).toEqual({ opacity: '0', transformed: true, visibility: 'visible' });
}

// Flush scroll/media notifications and their next render, not a guessed sleep.
async function nextPaint(page: Page) {
  await page.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function positionAt(locator: Locator, viewportFraction: number) {
  await locator.evaluate((element, fraction) => {
    const transform = getComputedStyle(element).transform;
    const translateY = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
    const naturalTop = element.getBoundingClientRect().top + scrollY - translateY;
    const desired = naturalTop - innerHeight * fraction;
    // Near the footer, ScrollTrigger clamps its start to the maximum scroll.
    // Stay before that boundary for the pending assertion, then cross it.
    const maxScroll = document.documentElement.scrollHeight - innerHeight;
    const top = fraction > 0.88 ? Math.min(desired, maxScroll - 40) : desired;
    window.scrollTo({ top, behavior: 'instant' });
  }, viewportFraction);
}

function hiddenSamples(samples: MotionSample[]) {
  return samples.filter(sample => sample.opacity !== '' && Number(sample.opacity) < 1);
}

async function settledScreenshot(page: Page, testInfo: TestInfo, name: string) {
  // Visit every target to finish below-fold entrances and load real images.
  for (const target of await page.locator(targets).all()) {
    await target.scrollIntoViewIfNeeded();
    await expectSettled(target);
  }
  for (const image of await page.locator(`${root} img`).all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    await image.evaluate((element: HTMLImageElement) => element.decode());
  }
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await nextPaint(page);
  await expectSettled(page.locator(targets));
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

test.describe('homepage motion', () => {
  // The shared config intentionally defaults to reduce; exercise real motion here.
  test.use({ reducedMotion: 'no-preference', forcedColors: 'none', viewport: { width: 1440, height: 900 } });

  test.beforeEach(async ({ page }) => {
    await observeMotion(page);
  });

  test('hero and portrait actually animate, settle within one second, and clear inline styles', async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator(`${root} [data-motion="hero"]`)).toHaveCount(4);
    await expect(page.locator(`${root} [data-motion="portrait"]`)).toHaveCount(1);
    await expectSettled(page.locator(entrances));

    const starts: number[] = [];
    const finishes: number[] = [];
    for (const target of await page.locator(entrances).all()) {
      const samples = await samplesFor(target);
      const initial = samples.find(sample => sample.opacity !== '' && Number(sample.opacity) < 1 &&
        sample.transform !== '' && sample.transform !== 'none');
      expect(initial, 'Every entrance must have real inline opacity and transform motion').toBeDefined();
      const settled = samples.find(sample => sample.at >= initial!.at && sample.opacity === '' && sample.transform === '');
      expect(settled, 'Completion must remove inline animation properties').toBeDefined();
      starts.push(initial!.at);
      finishes.push(settled!.at);
    }
    expect(Math.max(...finishes) - Math.min(...starts), 'Whole hero choreography stays below one second').toBeLessThan(1000);
    const firstSkill = page.locator(`${root} .skill[data-motion="reveal"]`).first();
    expect(await firstSkill.evaluate(element => element.getBoundingClientRect().top < innerHeight * 0.88),
      'Desktop fixture includes a reveal already inside the initial trigger region').toBe(true);
    await expectSettled(firstSkill);
    await settledScreenshot(page, testInfo, 'motion-desktop-settled');
    expect(errors).toEqual([]);
  });

  test('each skills row, project, tools wrapper, and contact reveals independently at the viewport threshold, once', async ({ page }, testInfo) => {
    // Stacked cards and a tall hero keep every reveal below the initial fold.
    await page.setViewportSize({ width: 390, height: 740 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    // The stacked mobile portrait is itself a scroll reveal, not in the hero timeline.
    await expectSettled(page.locator(`${root} [data-motion="hero"]`));
    await expect(page.locator(`${root} .skill[data-motion="reveal"]`)).toHaveCount(3);
    await expect(page.locator(`${root} .project-grid > li[data-motion="reveal"]`)).toHaveCount(2);
    await expect(page.locator(`${root} [data-motion="reveal"]:has(.tools)`)).toHaveCount(1);
    await expect(page.locator(`${root} .contact-inner[data-motion="reveal"]`)).toHaveCount(1);
    const items = await page.locator(reveals).all();
    expect(items).toHaveLength(7);

    for (const [index, item] of items.entries()) {
      await expectPending(item);
      // 92% has not crossed the 88% trigger; 84% has. Remove the
      // entrance translation when calculating the element's natural top.
      await positionAt(item, 0.92);
      await nextPaint(page);
      await expectPending(item);
      const mark = (await samplesFor(item)).length;
      await positionAt(item, 0.84);
      await expectSettled(item);
      const revealSamples = (await samplesFor(item)).slice(mark);
      const playing = hiddenSamples(revealSamples).filter(sample => Number(sample.opacity) > 0);
      expect(playing.length, 'Reveal interpolates rather than jumping straight to visible').toBeGreaterThan(0);
      const cleared = revealSamples.find(sample => sample.at >= playing[0].at && sample.opacity === '' && sample.transform === '');
      expect(cleared, 'Each independent reveal clears its inline styles').toBeDefined();
      // ~550ms animation, allowing frame scheduling but not a multi-second reveal.
      expect(cleared!.at - playing[0].at).toBeGreaterThan(300);
      expect(cleared!.at - playing[0].at).toBeLessThan(1000);
      if (index + 1 < items.length) await expectPending(items[index + 1]);

      const completed = (await samplesFor(item)).length;
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await nextPaint(page);
      await positionAt(item, 0.84);
      await nextPaint(page);
      await expectSettled(item);
      expect(hiddenSamples((await samplesFor(item)).slice(completed)), 'Scrolling out and back must not replay viewed content').toEqual([]);
    }
    await settledScreenshot(page, testInfo, 'motion-mobile-settled');
  });

  for (const preference of ['reduced motion', 'forced colors'] as const) {
    const staticMedia = preference === 'reduced motion'
      ? { reducedMotion: 'reduce' as const }
      : { forcedColors: 'active' as const };
    const enabledMedia = { reducedMotion: 'no-preference' as const, forcedColors: 'none' as const };

    test(`${preference} on initial load leaves all content static and visible`, async ({ page }) => {
      await page.emulateMedia(staticMedia);
      await page.goto('/');
      await expectSettled(page.locator(targets));
      await page.locator('.contact-inner').scrollIntoViewIfNeeded();
      await nextPaint(page);
      await expectSettled(page.locator(targets));
      expect(hiddenSamples(await page.evaluate(() => window.__homeMotionSamples))).toEqual([]);
    });

    test(`runtime ${preference} reverts pending motion and does not replay viewed content when disabled`, async ({ page }) => {
      await page.goto('/');
      await expectSettled(page.locator(entrances));
      const viewed = page.locator(`${root} .skill[data-motion="reveal"]`).last();
      await viewed.scrollIntoViewIfNeeded();
      await expectSettled(viewed);
      const contact = page.locator(`${root} .contact-inner[data-motion="reveal"]`);
      await expectPending(contact);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await nextPaint(page);

      await page.emulateMedia(staticMedia);
      await expectSettled(page.locator(targets));
      const mark = await page.evaluate(() => window.__homeMotionSamples.length);
      await page.emulateMedia(enabledMedia);
      await nextPaint(page);
      await viewed.scrollIntoViewIfNeeded();
      await expectSettled(viewed);
      await contact.scrollIntoViewIfNeeded();
      await expectSettled(contact);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await nextPaint(page);
      await expectSettled(page.locator(entrances));
      const replayed = await page.locator(entrances).or(viewed).evaluateAll((elements, args) => {
        const all = [...document.querySelectorAll(args.selector)];
        const indices = elements.map(element => all.indexOf(element));
        return window.__homeMotionSamples.slice(args.mark).filter(sample => indices.includes(sample.index) &&
          sample.opacity !== '' && Number(sample.opacity) < 1);
      }, { selector: targets, mark });
      expect(replayed, 'Previously viewed hero and skills must never be hidden again').toEqual([]);
    });
  }

  test('focusing an opacity-hidden CTA immediately completes its reveal without scrolling', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator(`${root} .contact-inner[data-motion="reveal"]`);
    await expectPending(contact);
    const cta = contact.getByRole('link', { name: 'Send Me a Message' });
    const result = await cta.evaluate((element: HTMLElement) => {
      const parent = element.closest<HTMLElement>('[data-motion]')!;
      const before = scrollY;
      element.focus({ preventScroll: true });
      return {
        focused: document.activeElement === element,
        opacity: getComputedStyle(parent).opacity,
        visibility: getComputedStyle(parent).visibility,
        inlineOpacity: parent.style.opacity,
        inlineTransform: parent.style.transform,
        scrollDelta: scrollY - before,
      };
    });
    expect(result).toEqual({ focused: true, opacity: '1', visibility: 'visible', inlineOpacity: '', inlineTransform: '', scrollDelta: 0 });
    await expect(cta).toBeFocused();
    const mark = (await samplesFor(contact)).length;
    await contact.scrollIntoViewIfNeeded();
    await nextPaint(page);
    await expectSettled(contact);
    expect(hiddenSamples((await samplesFor(contact)).slice(mark))).toEqual([]);
  });

  test('pagehide clears pending styles and disconnects motion work', async ({ page }) => {
    await page.goto('/');
    await expectPending(page.locator(`${root} .contact-inner`));
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    await expectSettled(page.locator(targets));
    const mark = await page.evaluate(() => window.__homeMotionSamples.length);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('.contact-inner').scrollIntoViewIfNeeded();
    await nextPaint(page);
    await expectSettled(page.locator(targets));
    expect(hiddenSamples(await page.evaluate(mark => window.__homeMotionSamples.slice(mark), mark))).toEqual([]);
  });

  test('full-page navigation back restores static content without rehiding it', async ({ page }) => {
    await page.goto('/');
    await expectSettled(page.locator(entrances));
    await expectPending(page.locator(`${root} .contact-inner`));
    await page.evaluate(() => { window.__homeMotionSamples = []; });
    await page.locator('.hero-actions').getByRole('link', { name: 'View work' }).click();
    await expect(page).toHaveURL(/\/work\/?$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expectSettled(page.locator(targets));
    expect(await page.evaluate(() => window.__homeMotionRestored ||
      (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type === 'back_forward'),
    'Exercise an actual history traversal or BFCache restore').toBe(true);
    await page.locator('.contact-inner').scrollIntoViewIfNeeded();
    await nextPaint(page);
    expect(hiddenSamples(await page.evaluate(() => window.__homeMotionSamples))).toEqual([]);
  });

  test('project lightbox and direct project hashes still work with motion enabled', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const card = page.locator('.project-grid .card').first();
    const title = (await card.locator('.title').innerText()).trim();
    const trigger = card.locator('.preview');
    const id = await trigger.getAttribute('data-project-open');
    expect(id).toBeTruthy();
    const projectHash = `#project=${encodeURIComponent(id!)}`;
    await trigger.scrollIntoViewIfNeeded();
    await expectSettled(page.locator('.project-grid > li[data-motion="reveal"]').first());
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: title, exact: true });
    await expect(dialog).toBeVisible();
    expect(new URL(page.url()).hash).toBe(projectHash);
    await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expectSettled(page.locator('.project-grid > li[data-motion="reveal"]').first());
    await expect(page).toHaveURL(/\/$/);

    await page.goto(`/${projectHash}`);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('');
    await trigger.scrollIntoViewIfNeeded();
    await expectSettled(page.locator('.project-grid > li[data-motion="reveal"]').first());
    await trigger.click();
    await expect(dialog).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a blocked animation module leaves default markup visible and links usable', async ({ page, request }) => {
    const response = await request.get('/');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    // In dev, abort only the controller import. Production bundles that import
    // into the homepage's index.*.js entry; discover its actual hashed URL.
    const scriptSources = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(match => match[1]);
    const productionEntries = scriptSources
      .map(src => new URL(src, response.url()).pathname)
      .filter(path => /\/_astro\/index\.[^/]+\.js$/.test(path));
    const blocked: string[] = [];
    await page.route('**/*', async route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/src/scripts/home-motion.ts' || productionEntries.includes(path)) {
        blocked.push(path);
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    await page.goto('/');
    await expect.poll(() => blocked.length, { message: 'The animation entry must actually have been blocked' }).toBeGreaterThan(0);
    await expectSettled(page.locator(targets));
    expect(hiddenSamples(await page.evaluate(() => window.__homeMotionSamples))).toEqual([]);
    await page.locator('.contact-inner').scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', { name: 'Send Me a Message' })).toHaveAttribute('href', /^mailto:/);
    await page.locator('.hero-actions').getByRole('link', { name: 'View work' }).click();
    await expect(page).toHaveURL(/\/work\/?$/);
  });
});

test.describe('homepage progressive enhancement without JavaScript', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'no-preference' });

  test('all motion targets are visible by default and real links remain usable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(targets)).toHaveCount(12);
    await expectSettled(page.locator(targets));
    await page.locator('.contact-inner').scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', { name: 'Send Me a Message' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Send Me a Message' })).toHaveAttribute('href', /^mailto:/);
    const preview = page.locator('.project-grid .preview').first();
    const href = await preview.getAttribute('href');
    expect(href).toBeTruthy();
    expectOptimizedWebP(href!);
    const destination = new URL(href!, page.url()).href;
    await preview.click();
    await expect(page).toHaveURL(destination);
    await page.goto('/');
    await page.locator('.hero-actions').getByRole('link', { name: 'View work' }).click();
    await expect(page).toHaveURL(/\/work\/?$/);
  });
});
