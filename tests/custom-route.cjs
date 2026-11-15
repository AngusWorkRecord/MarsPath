const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      acceptDownloads: true,
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.clock.install();
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(await page.locator('#markerTools').getAttribute('open'), null);
    await page.locator('#markerTools > summary').click();
    assert.equal(await page.locator('#pickNotePosition').isVisible(), true);
    await page.locator('#pickNotePosition').click();
    await page.locator('#markerTools > summary').click();
    await page.locator('#mapSvg').click({ position: { x: 180, y: 180 } });
    assert.equal(await page.locator('#saveEnvironment').isDisabled(), true);
    await page.locator('#missionRoute').selectOption('custom');
    assert.equal(await page.locator('#start').isDisabled(), true);
    await page.locator('#drawCustomRoute').click();
    await page.locator('#mapSvg').click({ position: { x: 180, y: 180 } });
    await page.locator('#mapSvg').click({ position: { x: 300, y: 260 } });
    await page.locator('#stopCustomDrawing').click();
    assert.equal(await page.locator('#customWaypointList li').count(), 2);
    async function addPoint(x, y, title) {
      await page.locator('#waypointX').fill(String(x));
      await page.locator('#waypointY').fill(String(y));
      if (title) {
        await page.locator('#waypointHasTask').check();
        await page.locator('#waypointTitle').fill(title);
        await page.locator('#waypointDescription').fill('Inspect layered rocks.');
      }
      await page.locator('#saveWaypoint').click();
    }
    await addPoint(650, 450, 'Inspect delta layers');
    await addPoint(700, 500, null);
    assert.equal(await page.locator('#customWaypointList li').count(), 4);
    await page
      .locator('#customWaypointList li')
      .last()
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await page
      .locator('#customWaypointList li')
      .last()
      .getByRole('button', { name: 'Move up', exact: true })
      .click();
    assert.match(
      await page.locator('#customWaypointList li').nth(1).textContent(),
      /Inspect delta layers/,
    );
    await page
      .locator('#customWaypointList li')
      .nth(1)
      .getByRole('button', { name: 'Edit', exact: true })
      .click();
    await page.locator('#waypointX').fill('600');
    await page.locator('#saveWaypoint').click();
    await page.locator('#confirmCustomRoute').click();
    assert.equal(await page.locator('#start').isEnabled(), true);
    assert.match(
      await page.locator('#customRouteLine').getAttribute('points'),
      /600,450/,
    );
    await page.locator('#customTaskCards button').click();
    assert.equal(
      await page.locator('#customTaskTitle').textContent(),
      'Inspect delta layers',
    );
    assert.equal(await page.locator('#completeCustomTask').isDisabled(), true);
    await page.locator('#closeCustomTask').click();
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#missionRoute').inputValue(), 'custom');
    assert.equal(await page.locator('#start').isEnabled(), true);
    const points = await page.locator('#customRouteLine').getAttribute('points');
    const base = await page
      .locator('#customRouteLine')
      .evaluate(
        (e) => parseFloat(getComputedStyle(e).strokeWidth) * Math.abs(e.getScreenCTM().a),
      );
    await page.locator('#zoomIn').click();
    await page.locator('#zoomIn').click();
    const thin = await page
      .locator('#customRouteLine')
      .evaluate(
        (e) => parseFloat(getComputedStyle(e).strokeWidth) * Math.abs(e.getScreenCTM().a),
      );
    assert.ok(thin < base);
    assert.equal(await page.locator('#customRouteLine').getAttribute('points'), points);
    await page.locator('#resetZoom').click();
    await page.screenshot({
      path: path.resolve(__dirname, 'custom-route.png'),
      fullPage: true,
    });
    await page.locator('#start').click();
    await page.clock.runFor(10000);
    assert.equal(await page.locator('#customTaskDialog').isVisible(), true);
    assert.equal(await page.locator('#completeCustomTask').isEnabled(), true);
    await page.locator('#completeCustomTask').click();
    await page.locator('#closeCustomTask').click();
    await page.locator('#pause').click();
    await page.clock.runFor(10000);
    assert.equal(await page.locator('#return').isEnabled(), true);
    await page.locator('#return').click();
    await page.clock.runFor(20000);
    assert.equal(await page.locator('#duration').textContent(), 'Returned');
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#exportLog').click();
    const download = await downloadPromise;
    const txt = await fs.readFile(await download.path(), 'utf8');
    assert.match(txt, /Inspect delta layers/);
    assert.match(txt, /Round trip complete/);
    assert.match(download.suggestedFilename(), /\.txt$/);
    const times = txt.match(/\d{4}-\d{2}-\d{2}T[^ ]+Z/g);
    assert.deepEqual(times, [...times].sort());
    await page.locator('#newJourney').click();
    await page.locator('#missionRoute').selectOption('shortest');
    assert.equal(await page.locator('#start').isEnabled(), true);
    await page.locator('#missionRoute').selectOption('custom');
    // Make the second custom journey task-free, ensuring old task flags do not gate return.
    if (!(await page.locator('#customRouteEditor').evaluate((e) => e.open)))
      await page.locator('#customRouteEditor > summary').click();
    await page
      .locator('#customWaypointList li')
      .nth(1)
      .getByRole('button', { name: 'Edit', exact: true })
      .click();
    await page.locator('#waypointHasTask').uncheck();
    await page.locator('#saveWaypoint').click();
    assert.equal(await page.locator('#start').isDisabled(), true);
    await page.locator('#confirmCustomRoute').click();
    await page.locator('#start').click();
    await page.clock.runFor(20000);
    assert.equal(await page.locator('#customTaskDialog').isVisible(), false);
    assert.equal(await page.locator('#return').isEnabled(), true);
    await page.locator('#return').click();
    await page.clock.runFor(20000);
    assert.equal(await page.locator('#duration').textContent(), 'Returned');
    assert.deepEqual(errors, []);
    console.log(
      'PASS: marker panel collapse; map + coordinate custom points; edit/delete/reorder; confirm/restore; thin zoomed route; task preview and arrival; custom round trip; UTF-8 chronological TXT; second task-free journey',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
