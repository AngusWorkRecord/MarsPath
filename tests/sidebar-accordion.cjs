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
    await page.clock.install();
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {
      waitUntil: 'domcontentloaded',
    });
    const sections = page.locator('#taskSidebar > .sidebar-section');
    const openCount = () => page.locator('#taskSidebar > .sidebar-section[open]').count();
    assert.equal(await openCount(), 1);
    for (let i = 0; i < 4; i++) {
      if (await sections.nth(i).evaluate((e) => e.open))
        await sections.nth(i).locator(':scope > summary').click();
      await sections.nth(i).locator(':scope > summary').click();
      assert.equal(await openCount(), 1);
      assert.equal(await sections.nth(i).evaluate((e) => e.open), true);
    }
    await sections.nth(3).locator(':scope > summary').click();
    assert.equal(await openCount(), 0);
    await sections.nth(2).locator(':scope > summary').click();
    await page.locator('#environment').fill('Unsaved field note survives folding');
    await sections.nth(0).locator(':scope > summary').click();
    await page.locator('[data-route="custom"]').click();
    assert.equal(await openCount(), 1);
    assert.equal(await sections.nth(1).evaluate((e) => e.open), true);
    assert.equal(await page.locator('#customRouteEditor').evaluate((e) => e.open), true);
    assert.ok(
      Math.abs(
        await page
          .locator('#customRouteEditor')
          .evaluate((e) => e.getBoundingClientRect().top),
      ) < 2,
    );
    await page.locator('#waypointX').fill('200');
    await page.locator('#waypointY').fill('200');
    await page.locator('#saveWaypoint').click();
    await page.locator('#waypointX').fill('500');
    await page.locator('#waypointY').fill('300');
    await page.locator('#waypointHasTask').check();
    await page.locator('#waypointTitle').fill('Observe layers');
    await page.locator('#waypointDescription').fill('Draft description preserved');
    await sections.nth(3).locator(':scope > summary').click();
    await page.locator('[data-route="custom"]').click();
    assert.equal(await openCount(), 1);
    assert.equal(await page.locator('#waypointTitle').inputValue(), 'Observe layers');
    assert.equal(
      await page.locator('#waypointDescription').inputValue(),
      'Draft description preserved',
    );
    await page.locator('#saveWaypoint').click();
    await page.locator('#confirmCustomRoute').click();
    await sections.nth(2).locator(':scope > summary').click();
    assert.equal(
      await page.locator('#environment').inputValue(),
      'Unsaved field note survives folding',
    );
    await sections.nth(1).locator(':scope > summary').click();
    assert.equal(await page.locator('#start').isEnabled(), true);
    await page.locator('#start').click();
    await page.clock.runFor(9000);
    assert.equal(await page.locator('#customTaskDialog').isVisible(), true);
    await page.locator('#completeCustomTask').click();
    await page.locator('#closeCustomTask').click();
    const before = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('marspath-mission-v1')),
    );
    for (let i = 0; i < 4; i++) await sections.nth(i).locator(':scope > summary').click();
    const after = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('marspath-mission-v1')),
    );
    assert.deepEqual(after.customCompleted, before.customCompleted);
    assert.deepEqual(after.customPoints, before.customPoints);
    assert.equal(after.progress, before.progress);
    await sections.nth(1).locator(':scope > summary').click();
    assert.equal(await page.locator('#return').isEnabled(), true);
    await page.locator('#return').click();
    await page.clock.runFor(9000);
    assert.equal(await page.locator('#duration').textContent(), 'Returned');
    assert.deepEqual(errors, []);
    console.log(
      'PASS: mutually exclusive accordion, all sections closed, draft inputs retained, Custom opens/scrolls Marswalk, route and task progress retained, custom round trip',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
