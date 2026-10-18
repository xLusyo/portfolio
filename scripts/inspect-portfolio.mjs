import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch();
await mkdir('artifacts/portfolio', { recursive: true });
for (const [width, height] of [[1440, 900], [1280, 800], [390, 844], [375, 812]]) {
	const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
	page.on('pageerror', error => console.error(error));
	await page.goto('http://localhost:4321/');
	await page.evaluate(() => document.fonts.ready);
	await page.locator('.portrait img').evaluate(image => image.decode());
	await page.screenshot({ path: `artifacts/portfolio/home-${width}x${height}.png` });
	console.log(JSON.stringify(await page.evaluate(() => ({
		viewport: [innerWidth, innerHeight],
		documentWidth: document.documentElement.scrollWidth,
		profile: document.querySelector('.profile').getBoundingClientRect().toJSON(),
		actions: document.querySelector('.profile-actions').getBoundingClientRect().toJSON(),
		scrollRoots: [...document.querySelectorAll('.portfolio, .profile-info, .content')].map(element => ({
			class: element.className, client: element.clientHeight, scroll: element.scrollHeight,
			overflow: getComputedStyle(element).overflow, display: getComputedStyle(element).display,
		})),
	}))));
	await page.locator('.section-nav a[href="#experience"]').click();
	await page.locator('.company-icon img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
	await page.screenshot({ path: `artifacts/portfolio/experience-${width}x${height}.png` });
	await page.locator('.section-nav a[href="#tools"]').click();
	await page.screenshot({ path: `artifacts/portfolio/tools-${width}x${height}.png` });
	await page.locator('.section-nav a[href="#projects"]').click();
	await page.locator('.preview').first().click();
	await page.locator('#project-lightbox img').evaluate(image => image.decode());
	await page.screenshot({ path: `artifacts/portfolio/project-${width}x${height}.png` });
	await page.close();
}
await browser.close();
