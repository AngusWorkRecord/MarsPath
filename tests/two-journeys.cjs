const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.clock.install();
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, { waitUntil: 'domcontentloaded' });
    for (const [index, route] of ['shortest', 'balanced'].entries()) {
      await page.locator('#missionRoute').selectOption(route);
      if (index === 1) await page.locator('#extraTask').check();
      await page.locator('#start').click();
      assert.equal(await page.locator('#pause').textContent(), 'Pause');
      await page.clock.runFor(50000);
      await page.locator('#photoMarker').click();
      await page.locator('#photoCanvas').click({ position: { x: 150, y: 150 } });
      await page.locator('#observation').fill(`Delta observation ${index + 1}`);
      await page.locator('#saveObservation').click();
      await page.locator('#closePhoto').click();
      await page.locator('#complete').check();
      if (!(await page.locator('#markerTools').evaluate(e => e.open))) await page.locator('#markerTools > summary').click();
      await page.locator('#pickNotePosition').click();
      await page.locator('#mapSvg').click({ position: { x: 200, y: 100 } });
      if (index === 1) {
        assert.equal(await page.locator('#return').isDisabled(), true);
        await page.locator('#environment').fill('Second journey environment');
        await page.locator('#saveEnvironment').click();
      } else {
        await page.locator('#environment').fill('First journey environment');
        await page.locator('#saveEnvironment').click();
      }
      await page.locator('#return').click();
      await page.clock.runFor(50000);
      assert.equal(await page.locator('#duration').textContent(), 'Returned');
      assert.equal(await page.locator('#newJourney').isVisible(), true);
      await page.reload({ waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('#newJourney').isVisible(), true);
      console.log(`PASS: journey ${index + 1} (${route}) completed and restored after reload`);
      if (index === 0) {
        await page.locator('#newJourney').click();
        assert.equal(await page.locator('#missionRoute').isEnabled(), true);
        assert.equal(await page.locator('#start').isVisible(), true);
        assert.equal(await page.locator('#complete').isChecked(), false);
        assert.equal(await page.locator('#records').getByText('First journey environment').isVisible(), true);
        await page.reload({ waitUntil: 'domcontentloaded' });
        assert.equal(await page.locator('#missionRoute').isEnabled(), true);
      }
    }
    assert.equal(await page.locator('#records').getByText('First journey environment').isVisible(), true);
    assert.equal(await page.locator('#records').getByText('Second journey environment').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log('PASS: two distinct round trips, independent tasks, retained records and reload');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
