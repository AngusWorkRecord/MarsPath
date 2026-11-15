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
    await page.locator('.mission-panel > summary').click();
    await page.locator('[data-route="custom"]').click();
    assert.equal(await page.locator('.mission-panel').evaluate((e) => e.open), true);
    assert.equal(await page.locator('#customRouteEditor').evaluate((e) => e.open), true);
    assert.equal(await page.locator('#missionRoute').inputValue(), 'custom');
    const top = await page
      .locator('#customRouteEditor')
      .evaluate((e) => e.getBoundingClientRect().top);
    assert.ok(top >= -1 && top < 150, 'editor is scrolled into view');
    assert.equal(await page.locator('#terrain').isChecked(), true);
    assert.equal(await page.locator('#customMap').isChecked(), true);
    for (const id of ['hazards', 'science', 'route', 'imagery'])
      assert.equal(await page.locator('#' + id).isChecked(), false);
    for (const [i, point] of [
      [100, 100],
      [400, 300],
      [700, 550],
    ].entries()) {
      await page.locator('#waypointX').fill(String(point[0]));
      await page.locator('#waypointY').fill(String(point[1]));
      if (i === 1) {
        await page.locator('#waypointHasTask').check();
        await page.locator('#waypointTitle').fill('Observe waypoint geology');
      }
      await page.locator('#saveWaypoint').click();
    }
    await page.locator('#confirmCustomRoute').click();
    const line = await page.locator('#customRouteLine').getAttribute('points');
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem('marspath-mission-v1')).customPoints,
    );
    assert.equal(line, '100,100 400,300 700,550');
    await page.getByRole('button', { name: 'Custom waypoint 2', exact: true }).click();
    assert.equal(
      await page.locator('#customTaskTitle').textContent(),
      'Observe waypoint geology',
    );
    await page.locator('#closeCustomTask').click();
    await page.locator('#customMap').uncheck();
    assert.equal(await page.locator('#customRouteLine').isVisible(), false);
    assert.equal(
      await page
        .getByRole('button', { name: 'Custom waypoint 2', exact: true })
        .isVisible(),
      false,
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('#customMap').isChecked(), false);
    assert.deepEqual(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('marspath-mission-v1')).customPoints,
      ),
      saved,
    );
    await page.locator('#customMap').check();
    assert.equal(await page.locator('#customRouteLine').isVisible(), true);
    assert.equal(await page.locator('#customRouteLine').getAttribute('points'), line);
    await page.getByRole('button', { name: 'Custom waypoint 2', exact: true }).click();
    assert.equal(
      await page.locator('#customTaskTitle').textContent(),
      'Observe waypoint geology',
    );
    await page.locator('#closeCustomTask').click();
    // Generic route visibility does not govern the custom layer.
    await page.locator('#route').check();
    await page.locator('#route').uncheck();
    assert.equal(await page.locator('#customRouteLine').isVisible(), true);
    await page.locator('[data-route="balanced"]').click();
    assert.equal(await page.locator('#routeLine').isVisible(), true);
    assert.equal(await page.locator('#customRouteLine').isVisible(), true);
    await page.locator('#customMap').uncheck();
    assert.equal(await page.locator('#routeLine').isVisible(), true);
    assert.equal(await page.locator('#customRouteLine').isVisible(), false);
    await page.locator('[data-route="custom"]').click();
    assert.equal(await page.locator('#customMap').isChecked(), true);
    assert.equal(await page.locator('#customRouteEditor').evaluate((e) => e.open), true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: Custom strategy expands and scrolls editor; isolated layer defaults; route and task markers hide/restore without data loss, including reload; generic/custom layers independent',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
