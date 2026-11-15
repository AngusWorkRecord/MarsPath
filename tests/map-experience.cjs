const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const url = pathToFileURL(path.resolve(__dirname, '../mission.html')).href;
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  async function createPage() {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.clock.install({ time: new Date('2026-11-15T04:00:00Z') });
    await page.clock.pauseAt(new Date('2026-11-15T04:00:01Z'));
    await page.goto(url, { waitUntil: 'load' });
    return page;
  }
  const state = (page) =>
    page.evaluate(() => JSON.parse(localStorage.getItem('marspath-mission-v1')));
  const openSection = async (page, selector) => {
    const section = page.locator(selector);
    if (!(await section.evaluate((e) => e.open)))
      await section.locator(':scope > summary').click();
  };
  async function record(page, content, expectedPhase) {
    await openSection(page, '#markerTools');
    await page.locator('#pickNotePosition').click();
    // This is a real mouse action, converted from schematic coordinates through the SVG matrix.
    await page.locator('#mapWrap').scrollIntoViewIfNeeded();
    const existingCount = (await state(page)).mapNotes.length;
    const target = await page.locator('#mapSvg').evaluate((svg, count) => {
      const p = new DOMPoint(180 + count * 50, 200 + count * 15).matrixTransform(
        svg.getScreenCTM(),
      );
      return { x: p.x, y: p.y };
    }, existingCount);
    await page.mouse.click(target.x, target.y);
    await page.locator('#environment').fill(content);
    await page.locator('#saveEnvironment').click();
    assert.equal(await page.locator('.mission-panel').evaluate((e) => e.open), false);
    assert.equal(await page.locator('#activeObjective').isVisible(), true);
    assert.match(await page.locator('#activePosition').textContent(), /Tasks/);
    const banner = await page.locator('.mission-status').boundingBox();
    assert.ok(
      banner.y >= 0 && banner.y + banner.height <= 1100,
      'objective remains in the viewport while recording',
    );
    const saved = await state(page);
    const index = saved.mapNotes.length;
    assert.equal(saved.mapNotes[index - 1].phase, expectedPhase);
    assert.equal(saved.mapNotes[index - 1].content, content);
    await page
      .getByRole('button', { name: `Open field note N${index}`, exact: true })
      .click();
    assert.equal(await page.locator('#fieldNoteContent').textContent(), content);
    await page.locator('#closeFieldNote').click();
  }
  try {
    const page = await createPage();
    const images = await page
      .locator('img')
      .evaluateAll((imgs) =>
        imgs.map((img) => ({
          src: img.getAttribute('src'),
          loaded: img.complete && img.naturalWidth > 1000,
        })),
      );
    assert.equal(images.length, 3);
    assert.ok(images.every((img) => img.loaded));
    console.log(
      'PASS: real HRSC regional image, official star-marked landing inset and local surface photo load without mocked network requests',
    );
    await page.locator('#imagery').uncheck();
    await page.locator('[data-route="custom"]').click();
    assert.equal(await page.locator('#imagery').isChecked(), false);
    await page.locator('[data-route="balanced"]').click();
    assert.equal(await page.locator('#imagery').isChecked(), false);
    await page.locator('#imagery').check();
    await page.locator('[data-route="custom"]').click();
    assert.equal(await page.locator('#imagery').isChecked(), true);
    for (const [x, title] of [
      [300, ''],
      [600, 'Observe midpoint'],
      [900, 'Observe destination'],
    ]) {
      await page.locator('#waypointX').fill(String(x));
      await page.locator('#waypointY').fill('330');
      if (title) {
        await page.locator('#waypointHasTask').check();
        await page.locator('#waypointTitle').fill(title);
        await page.locator('#waypointDescription').fill('Describe the local terrain.');
      }
      await page.locator('#saveWaypoint').click();
    }
    await page.locator('#confirmCustomRoute').click();
    await page.locator('#markerMode').selectOption('near');
    assert.equal(await page.locator('#photoMarker').isVisible(), false);
    await page.locator('#markerMode').selectOption('all');
    assert.equal(await page.locator('#photoMarker').isVisible(), true);
    await page.locator('#photoMarker').click();
    assert.match(
      await page.locator('.photo-metadata').textContent(),
      /Octavia E. Butler Landing/,
    );
    assert.equal(
      await page.locator('.orbital').getAttribute('src'),
      'assets/landing-site.jpg',
    );
    await page.locator('#closePhoto').click();
    await record(page, 'Predeparture note', 'planning');
    await page.locator('#notes').uncheck();
    assert.equal(
      await page
        .getByRole('button', { name: 'Open field note N1', exact: true })
        .isVisible(),
      false,
    );
    const noteSnapshot = (await state(page)).mapNotes;
    await page.locator('#notes').check();
    assert.deepEqual((await state(page)).mapNotes, noteSnapshot);
    await page.locator('#markerMode').selectOption('near');
    await openSection(page, '.mission-panel');
    await page.locator('#start').click();
    await record(page, 'Moving outbound note', 'outbound');
    assert.equal((await state(page)).paused, false);
    await page.clock.runFor(6000);
    assert.ok((await state(page)).progress < 1, 'P1 is near before the final segment');
    assert.equal(await page.locator('#photoMarker').isVisible(), true);
    await page.locator('#markerMode').selectOption('all');
    await page.locator('#markerMode').selectOption('near');
    await page.locator('#quickPause').click();
    await record(page, 'Paused outbound note', 'outbound');
    assert.equal((await state(page)).paused, true);
    await page.locator('#photoMarker').click();
    assert.equal(await page.locator('#photoDialog').isVisible(), true);
    await page.locator('#closePhoto').click();
    await page.locator('#quickPause').click();
    await page.clock.runFor(2000);
    assert.equal(await page.locator('#customTaskDialog').isVisible(), true);
    assert.equal(
      await page.locator('#quickReturn').isEnabled(),
      true,
      'can return even at an unfinished task stop',
    );
    await page.locator('#completeCustomTask').click();
    await page.locator('#closeCustomTask').click();
    assert.match(
      await page.locator('#activeObjective').textContent(),
      /Next task: Observe destination/,
    );
    await page.locator('#quickPause').click();
    await page.clock.runFor(1000);
    await page.locator('#quickPause').click();
    const turn = await state(page);
    assert.equal(turn.progress, 1.125);
    assert.deepEqual(turn.customCompleted, [1]);
    await page.locator('#quickReturn').click();
    assert.equal((await state(page)).phase, 'returning');
    assert.equal((await state(page)).progress, turn.progress);
    assert.match(await page.locator('#activeObjective').textContent(), /Retrace/);
    await record(page, 'Returning note', 'returning');
    await page.locator('#markerMode').selectOption('all');
    await page.locator('#markerMode').selectOption('near');
    await page.clock.runFor(5000);
    assert.equal(await page.locator('#photoMarker').isVisible(), false);
    await page.locator('#markerMode').selectOption('all');
    assert.equal(await page.locator('#photoMarker').isVisible(), true);
    await page.locator('#markerMode').selectOption('near');
    await page.clock.runFor(5000);
    assert.equal((await state(page)).phase, 'finished');
    assert.equal((await state(page)).progress, 0);
    assert.deepEqual((await state(page)).customCompleted, [1]);
    await openSection(page, '.task-overview');
    assert.match(
      await page.locator('#customTaskCards button').first().textContent(),
      /Complete/,
    );
    assert.match(
      await page.locator('#customTaskCards button').last().textContent(),
      /Not completed/,
    );
    await page.locator('#notes').uncheck();
    await page.locator('#imagery').uncheck();
    await page.reload({ waitUntil: 'load' });
    assert.equal(await page.locator('#notes').isChecked(), false);
    assert.equal(await page.locator('#imagery').isChecked(), false);
    assert.equal(await page.locator('#markerMode').inputValue(), 'near');
    assert.equal((await state(page)).mapNotes.length, 4);
    assert.deepEqual((await state(page)).customCompleted, [1]);
    await page.locator('#notes').check();
    await page.getByRole('button', { name: 'Open field note N4', exact: true }).click();
    assert.equal(await page.locator('#fieldNoteContent').textContent(), 'Returning note');
    await page.locator('#closeFieldNote').click();
    await page.screenshot({
      path: path.resolve(__dirname, 'map-experience.png'),
      fullPage: true,
    });
    console.log(
      'PASS: user-controlled imagery and all/near filtering through planning/outbound/pause/return; geometric range before final segment; notes in all stages; sticky objective; fractional early return preserves completed and unfinished tasks; reload restores layers and records',
    );
    await page.close();
    const normal = await createPage();
    await normal.locator('[data-route="shortest"]').click();
    await openSection(normal, '.mission-panel');
    await normal.locator('#markerMode').selectOption('near');
    await normal.locator('#start').click();
    await normal.clock.runFor(24000);
    await normal.locator('#photoMarker').click();
    await normal.locator('#photoCanvas').click({ position: { x: 150, y: 150 } });
    await normal
      .locator('#observation')
      .fill('Raised layered delta remnant in the middle ground.');
    await normal.locator('#saveObservation').click();
    await normal.locator('#closePhoto').click();
    await normal.locator('#complete').check();
    await normal.locator('#quickPause').click();
    await normal.clock.runFor(8000);
    assert.equal((await state(normal)).progress, 4);
    assert.equal(
      await normal.locator('#photoMarker').isVisible(),
      false,
      'endpoint itself is not a nearby-visibility condition',
    );
    await normal.locator('#quickReturn').click();
    await normal.clock.runFor(32000);
    assert.equal((await state(normal)).phase, 'finished');
    assert.equal((await state(normal)).done, true);
    await normal.close();
    const incomplete = await createPage();
    await openSection(incomplete, '.mission-panel');
    await incomplete.locator('#start').click();
    await incomplete.clock.runFor(4000);
    await incomplete.locator('#quickReturn').click();
    await incomplete.clock.runFor(4000);
    assert.equal((await state(incomplete)).phase, 'finished');
    assert.equal((await state(incomplete)).done, false);
    assert.match(
      await incomplete.locator('#deltaTaskStatus').textContent(),
      /Not completed/,
    );
    await record(incomplete, 'After return note', 'finished');
    await incomplete.close();
    assert.deepEqual(errors, []);
    console.log(
      'PASS: default endpoint return with completed delta observation and early return without completing it; no browser script errors',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
