// Run with Node and Playwright installed. PLAYWRIGHT_MODULE can select an existing install.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('#routeName').filter({ hasText: 'Balanced exploration' }).waitFor();
    const originalRoute = await page.locator('#routeLine').getAttribute('points');
    await page.locator('#missionRoute').selectOption('shortest');
    assert.equal(await page.locator('#routeName').textContent(), 'Shortest path');
    assert.notEqual(await page.locator('#routeLine').getAttribute('points'), originalRoute);
    assert.equal(await page.locator('#distance').textContent(), '4 segments');
    await page.locator('[data-route="science"]').click();
    assert.equal(await page.locator('#missionRoute').inputValue(), 'science');
    assert.equal(await page.locator('#routeName').textContent(), 'Science priority');
    assert.equal(await page.locator('#distance').textContent(), '6 segments');
    console.log('PASS: dropdown and sidebar both update route name, path and segment count');

    await page.locator('#start').click();
    await page.locator('#pause').click();
    const note = 'Regression check: scattered rocks give way to flatter terrain.';
    if (!(await page.locator('#markerTools').evaluate(e => e.open))) await page.locator('#markerTools > summary').click();
    await page.locator('#pickNotePosition').click();
    await page.locator('#mapSvg').click({ position: { x: 200, y: 100 } });
    await page.locator('#environment').fill(note);
    await page.locator('#saveEnvironment').click();
    const entry = page.locator('#records li').filter({ hasText: note });
    assert.equal(await entry.count(), 1);
    assert.equal(await entry.isVisible(), true);
    assert.match(await entry.textContent(), /Selected map position/);
    assert.match(await page.locator('#noteStatus').textContent(), /Field note saved/);
    await entry.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.resolve(__dirname, 'mission-regression.png'), fullPage: true });
    console.log('PASS: added field note is visible in the mission log with position and time');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#records li').filter({ hasText: note }).waitFor();
    assert.equal(await page.locator('#routeName').textContent(), 'Science priority');
    assert.equal(await page.locator('#pause').textContent(), 'Resume');
    assert.deepEqual(errors, []);
    console.log('PASS: selected route, paused journey and saved note survive reload; no page errors');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
