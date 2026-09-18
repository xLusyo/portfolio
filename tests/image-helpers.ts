import { expect, type Locator } from '@playwright/test';

// Astro serves transforms dynamically in dev and emits hashed files in builds.
export function expectOptimizedWebP(value: string) {
  const url = new URL(value, 'http://localhost');
  if (url.pathname === '/_image') {
    expect(url.searchParams.get('f')).toBe('webp');
    expect(url.searchParams.get('href')).toBeTruthy();
  } else {
    expect(url.pathname).toMatch(/^\/_astro\/[^/]+\.webp$/);
  }
}

export function srcsetCandidates(srcset: string) {
  return srcset.split(',').filter(candidate => candidate.trim()).map(candidate => {
    const match = candidate.trim().match(/^(\S+)\s+(\d+)w$/);
    expect(match, `A responsive width descriptor is required: ${candidate}`).not.toBeNull();
    return { url: match![1], width: Number(match![2]) };
  });
}

export async function expectResponsiveImage(image: Locator) {
  const src = await image.getAttribute('src');
  expect(src).toBeTruthy();
  expectOptimizedWebP(src!);
  const candidates = srcsetCandidates((await image.getAttribute('srcset')) || '');
  expect(candidates.length).toBeGreaterThan(1);
  expect(new Set(candidates.map(candidate => candidate.width)).size).toBe(candidates.length);
  for (const candidate of candidates) expectOptimizedWebP(candidate.url);
  await expect(image).toHaveAttribute('sizes', /\S/);
  await expect(image).toHaveAttribute('alt', /\S/);
  await expect(image).toHaveAttribute('decoding', 'async');
  return candidates;
}

export async function templateImages(cards: Locator) {
  return cards.evaluateAll(elements => elements.map(card => {
    const template = card.querySelector<HTMLTemplateElement>('template[data-project-template]')!;
    const image = template.content.querySelector<HTMLImageElement>('img')!;
    // A template's inert document has no useful base URL; resolve against the page.
    return {
      id: template.dataset.projectTemplate!,
      src: new URL(image.getAttribute('src')!, document.baseURI).href,
      srcset: image.getAttribute('srcset') || '',
      sizes: image.getAttribute('sizes') || '',
      width: Number(image.getAttribute('width')),
      height: Number(image.getAttribute('height')),
      loading: image.getAttribute('loading'),
      decoding: image.getAttribute('decoding'),
    };
  }));
}

export function imageURLs(image: { src: string; srcset: string }) {
  return new Set([image.src, ...srcsetCandidates(image.srcset).map(candidate => new URL(candidate.url, image.src).href)]);
}
