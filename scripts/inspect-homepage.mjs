import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch();
await mkdir('artifacts/homepage', { recursive: true });
for (const width of [1440, 1024, 800, 768, 390, 320]) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `artifacts/homepage/before-${width}.png`, fullPage: true });
  console.log(JSON.stringify(await page.evaluate(() => {
    const selectors = ['nav', '.hero', '.intro', '.portrait', '.project-grid', '.tools', '.tools .logo', '.tools .logo svg'];
    return {
      width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      elements: selectors.map(selector => {
        const element = document.querySelector(selector);
        const rect = element?.getBoundingClientRect();
        return { selector, rect: rect?.toJSON(), children: element?.children.length };
      }),
      overflowing: [...document.querySelectorAll('main *')].filter(el => {
        const r = el.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1);
      }).slice(0, 10).map(el => ({ tag: el.tagName, class: el.getAttribute('class') })),
    };
  }), null, 2));
  console.log({ errors });
  await page.close();
}
await browser.close();
