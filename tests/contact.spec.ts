import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

for (const width of [390, 1440]) {
  test(`${width}px: contact dialog traps focus, locks the background, and restores its opener`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const opener = page.locator(width <= 760 ? '.mobile-contact button' : '.profile [data-contact]');
    const root = page.locator(width <= 760 ? '.portfolio' : '#content');
    await opener.click();
    const dialog = page.locator('#contact-dialog');
    const close = page.getByRole('button', { name: 'Close contact dialog' });
    const submit = page.getByRole('button', { name: /Prepare email/ });
    await expect(dialog).toBeVisible();
    await expect(close).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(submit).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    const before = await root.evaluate(element => element.scrollTop);
    await page.mouse.move(width - 10, 400);
    await page.mouse.wheel(0, 600);
    expect(await root.evaluate(element => element.scrollTop)).toBe(before);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await root.evaluate(element => element.style.overflow)).toBe('');
    await opener.click();
    await close.click();
    await expect(opener).toBeFocused();
    await opener.click();
    await page.mouse.click(2, 2);
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
}

test('contact validates fields and prepares an encoded email draft without claiming delivery', async ({ page, context }) => {
  await page.goto('/');
  await page.locator('.profile [data-contact]').click();
  await page.getByRole('button', { name: /Prepare email/ }).click();
  expect(await page.locator('#contact-form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBe(false);
  await expect(page.locator('.contact-status')).toBeEmpty();
  await page.getByLabel('Your name').fill('Alex & Morgan');
  await page.getByLabel('Your email').fill('alex@example.com');
  await page.getByLabel('Your message').fill('A project with spaces & questions?');
  const client = await context.newCDPSession(page);
  await client.send('Page.enable');
  const draft = new Promise<string>(resolve => client.on('Page.frameRequestedNavigation', event => {
    if (event.url.startsWith('mailto:')) resolve(event.url);
  }));
  await page.getByRole('button', { name: /Prepare email/ }).click();
  const url = new URL(await draft);
  expect(url.pathname).toBe('work.christianbaloncio@gmail.com');
  expect(url.searchParams.get('subject')).toBe('Portfolio enquiry from Alex & Morgan');
  expect(url.searchParams.get('body')).toBe('A project with spaces & questions?\n\nAlex & Morgan\nalex@example.com');
  await expect(page.locator('.contact-status')).toContainText('Opening your email app with a draft');
  await expect(page.locator('#contact-dialog')).toBeVisible();
  await expect(page.locator('#contact-description')).toContainText('does not send a message');
});

test('resume download is usable and clearly identifies itself as a sample', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: /Download Resume.*Sample/ });
  const [download] = await Promise.all([page.waitForEvent('download'), link.click()]);
  expect(download.suggestedFilename()).toBe('Portfolio-Sample-Resume.txt');
  const path = await download.path();
  expect(path).toBeTruthy();
  const text = await readFile(path!, 'utf8');
  expect(text).toContain('SAMPLE RÉSUMÉ');
  expect(text).toContain('not Christian Baloncio’s résumé');
  expect(text).not.toMatch(/OpenAI|Apple|Google|Microsoft/);
});
