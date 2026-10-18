import { expect, type Locator, type Page } from '@playwright/test';

interface MotionSample {
	index: number;
	at: number;
	opacity: string;
	transform: string;
}

declare global {
	interface Window {
		__motionSamples: MotionSample[];
	}
}

export async function observeMotion(page: Page) {
	await page.addInitScript(() => {
		window.__motionSamples = [];
		new MutationObserver(records => {
			const targets = [...document.querySelectorAll('[data-motion]')];
			for (const target of new Set(records.map(record => record.target))) {
				if (!(target instanceof HTMLElement)) continue;
				const index = targets.indexOf(target);
				if (index < 0) continue;
				window.__motionSamples.push({
					index, at: performance.now(), opacity: target.style.opacity, transform: target.style.transform,
				});
			}
		}).observe(document, { subtree: true, attributes: true, attributeFilter: ['style'] });
	});
}

export function samplesFor(target: Locator) {
	return target.evaluate(element => {
		const index = [...document.querySelectorAll('[data-motion]')].indexOf(element);
		return window.__motionSamples.filter(sample => sample.index === index);
	});
}

export async function expectAnimated(target: Locator) {
	await expect.poll(async () => (await samplesFor(target)).some(sample =>
		sample.opacity !== '' && Number(sample.opacity) > 0 && Number(sample.opacity) < 1 &&
		sample.transform !== '' && sample.transform !== 'none',
	)).toBe(true);
}

export async function expectSettled(targets: Locator) {
	await expect.poll(() => targets.evaluateAll(elements => elements.length > 0 && elements.every(element => {
		const node = element as HTMLElement;
		const style = getComputedStyle(node);
		return style.opacity === '1' && style.visibility === 'visible' && style.transform === 'none' &&
			node.style.opacity === '' && node.style.transform === '' && node.style.willChange === '';
	}))).toBe(true);
}
