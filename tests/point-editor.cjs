const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {
      waitUntil: 'domcontentloaded',
    });
    const marswalk = page.locator('.mission-panel');
    const openSidebar = async () => {
      if (!(await marswalk.evaluate((e) => e.open)))
        await marswalk.locator(':scope > summary').click();
    };
    const saved = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('marspath-mission-v1')));
    await page.locator('[data-route="custom"]').click();
    for (const [x, y, name] of [
      [100, 150, 'Landing camp'],
      [500, 450, 'Ridge'],
    ]) {
      await page.locator('#waypointName').fill(name);
      await page.locator('#waypointX').fill(String(x));
      await page.locator('#waypointY').fill(String(y));
      await page.locator('#saveWaypoint').click();
    }
    // Keep the first point selected in the sidebar so a popup save must update its fields too.
    await page
      .locator('#customWaypointList li')
      .first()
      .getByRole('button', { name: 'Edit', exact: true })
      .click();
    await page.getByRole('button', { name: 'Custom Route · Waypoint C1', exact: true }).click();
    assert.equal(await page.locator('#pointName').inputValue(), 'Landing camp');
    await page.locator('#pointName').fill('Delta overlook');
    await page.locator('#pointX').fill('180');
    await page.locator('#pointY').fill('220');
    await page.locator('#pointHasTask').check();
    await page.locator('#pointTitle').fill('Inspect sediment layers');
    await page
      .locator('#pointDescription')
      .fill('Compare visible layering at the overlook.');
    await page.screenshot({ path: path.resolve(__dirname, 'point-editor.png') });
    await page.locator('#pointEditForm').getByRole('button', { name: 'Save Waypoint', exact: true }).click();
    assert.equal(await page.locator('#customTaskDialog').isVisible(), false);
    assert.equal(await page.locator('#waypointName').inputValue(), 'Delta overlook');
    assert.equal(await page.locator('#waypointX').inputValue(), '180');
    assert.equal(
      await page.locator('#waypointTitle').inputValue(),
      'Inspect sediment layers',
    );
    assert.match(
      await page.locator('#customWaypointList li').first().textContent(),
      /Delta overlook/,
    );
    assert.equal(
      await page
        .getByRole('button', { name: 'Custom Route · Waypoint C1', exact: true })
        .getAttribute('transform'),
      'translate(180 220)',
    );
    assert.match(
      await page.locator('#customRouteLine').getAttribute('points'),
      /^180,220/,
    );
    assert.match(
      await page.locator('#customTaskCards').textContent(),
      /Inspect sediment layers/,
    );
    const snapshot = (await saved()).customPoints;
    await page.getByRole('button', { name: 'Custom Route · Waypoint C1', exact: true }).click();
    await page.locator('#pointName').fill('Discard me');
    await page.locator('#pointX').fill('999');
    await page.locator('#cancelPointEdit').click();
    assert.deepEqual((await saved()).customPoints, snapshot);
    assert.equal(await page.locator('#waypointName').inputValue(), 'Delta overlook');
    await page.getByRole('button', { name: 'Custom Route · Waypoint C1', exact: true }).click();
    assert.equal(await page.locator('#pointName').inputValue(), 'Delta overlook');
    await page.locator('#pointX').fill('1001');
    await page.locator('#pointEditForm').getByRole('button', { name: 'Save Waypoint', exact: true }).click();
    assert.equal(
      await page.locator('#pointX').evaluate((e) => e.validity.rangeOverflow),
      true,
    );
    assert.deepEqual((await saved()).customPoints, snapshot);
    await page.locator('#closeCustomTask').click();
    // Sidebar saves are reflected in the map popup and task overview.
    await openSidebar();
    await page.locator('#waypointName').fill('Updated from sidebar');
    await page.locator('#waypointTitle').fill('Revised task');
    await page.locator('#waypointDescription').fill('Updated task description');
    await page.locator('#saveWaypoint').click();
    await page.getByRole('button', { name: 'Custom Route · Waypoint C1', exact: true }).click();
    assert.equal(await page.locator('#pointName').inputValue(), 'Updated from sidebar');
    assert.equal(await page.locator('#pointTitle').inputValue(), 'Revised task');
    assert.equal(
      await page.locator('#pointDescription').inputValue(),
      'Updated task description',
    );
    await page.locator('#pointHasTask').uncheck();
    await page.locator('#pointEditForm').getByRole('button', { name: 'Save Waypoint', exact: true }).click();
    assert.doesNotMatch(
      await page.locator('#customTaskCards').textContent(),
      /Revised task/,
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Custom Route · Waypoint C1', exact: true }).click();
    assert.equal(await page.locator('#pointName').inputValue(), 'Updated from sidebar');
    assert.equal(await page.locator('#pointHasTask').isChecked(), false);
    await page.locator('#closeCustomTask').click();
    await openSidebar();
    await page.locator('#confirmCustomRoute').click();
    await page.getByRole('button', { name: 'Custom Route · Waypoint C1', exact: true }).click();
    await page.locator('#pointName').fill('No commit');
    await page.locator('#cancelPointEdit').click();
    assert.equal((await saved()).customConfirmed, true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: popup edits name/coordinates/task, shared sidebar data, synchronized route/markers/task overview, cancel and validation, optional tasks, reload, confirmation unchanged on cancel',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
