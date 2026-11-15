const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.clock.install();
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {
      waitUntil: 'domcontentloaded',
    });
    await page.locator('#missionRoute').selectOption('custom');
    const add = async (x, y, title) => {
      await page.locator('#waypointX').fill(String(x));
      await page.locator('#waypointY').fill(String(y));
      await page.locator('#waypointHasTask').check();
      await page.locator('#waypointTitle').fill(title);
      await page.locator('#waypointDescription').fill('Observe Δ layers · 地层');
      await page.locator('#saveWaypoint').click();
    };
    await add(200, 200, 'Start task Δ');
    await add(200, 200, 'Duplicate point');
    await page.locator('#confirmCustomRoute').click();
    assert.equal(await page.locator('#start').isDisabled(), true);
    assert.match(
      await page.locator('#customRouteStatus').textContent(),
      /Consecutive points must differ/,
    );
    await page
      .locator('#customWaypointList li')
      .last()
      .getByRole('button', { name: 'Edit', exact: true })
      .click();
    await page.locator('#waypointX').fill('500');
    await page.locator('#waypointTitle').fill('Destination Δ');
    await page.locator('#saveWaypoint').click();
    await page.locator('#confirmCustomRoute').click();
    await page.locator('#start').click();
    assert.equal(await page.locator('#customTaskDialog').isVisible(), true);
    assert.equal(await page.locator('#customTaskTitle').textContent(), 'Start task Δ');
    await page.locator('#completeCustomTask').click();
    await page.locator('#closeCustomTask').click();
    await page.locator('#pause').click();
    await page.clock.runFor(9000);
    assert.equal(await page.locator('#customTaskTitle').textContent(), 'Destination Δ');
    assert.equal(await page.locator('#return').isDisabled(), true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#duration').textContent(), 'Outbound paused');
    await page.locator('#customTaskCards button').last().click();
    assert.equal(await page.locator('#completeCustomTask').isEnabled(), true);
    await page.locator('#completeCustomTask').click();
    await page.locator('#closeCustomTask').click();
    await page.locator('#return').click();
    await page.clock.runFor(9000);
    assert.equal(await page.locator('#duration').textContent(), 'Returned');
    const wait = page.waitForEvent('download');
    await page.locator('#exportLog').click();
    const download = await wait;
    const bytes = await fs.readFile(await download.path());
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    const logs = await page.evaluate(
      () => JSON.parse(localStorage.getItem('marspath-mission-v1')).records,
    );
    for (const entry of logs) {
      assert.ok(text.includes(entry.time));
      assert.ok(text.includes(entry.content));
    }
    assert.match(text, /Destination Δ/);
    await page.locator('#newJourney').click();
    await page.locator('#missionRoute').selectOption('shortest');
    assert.equal(await page.locator('#complete').isChecked(), false);
    await page.locator('#start').click();
    assert.equal(await page.locator('#return').isDisabled(), true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: duplicate rejection, start/destination tasks, paused-task reload, UTF-8 export preserves every timestamp and content, default route cannot inherit custom completion',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
