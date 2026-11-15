const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-11-15T04:00:00Z') });
    await page.clock.pauseAt(new Date('2026-11-15T04:00:01Z'));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href);
    const state = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('marspath-mission-v1')));
    const targets = {
      terrain: '.map-image',
      imagery: '#imageryLayer',
      deltaFront: '#regionalObservationLayer',
      route: '#routeLayer',
      customMap: '#customMapLayer',
      science: '#scienceLayer',
      hazards: '#hazardLayer',
      notes: '#fieldNoteLayer',
    };
    async function toggle(key, visible) {
      const input = page.locator(`#${key}`);
      if ((await input.isChecked()) !== visible) await input.locator('..').click();
      assert.equal(await input.isChecked(), visible);
    }
    async function all(visible) {
      for (const key of Object.keys(targets)) await toggle(key, visible);
    }
    async function overview() {
      if (!(await page.locator('.task-overview').evaluate((e) => e.open)))
        await page.locator('.task-overview > summary').click();
    }
    const mapView = () =>
      page
        .locator('#mapScene')
        .evaluate((e) => ({ width: e.style.width, transform: e.style.transform }));
    await page.locator('[data-route="custom"]').click();
    assert.equal((await state()).layers.terrain, true);
    assert.equal(
      (await state()).layers.hazards,
      true,
      'Choosing a strategy must not switch unrelated layers',
    );
    for (const [x, y, name] of [
      [120, 180, 'Start'],
      [600, 500, 'End'],
    ]) {
      await page.locator('#waypointName').fill(name);
      await page.locator('#waypointX').fill(String(x));
      await page.locator('#waypointY').fill(String(y));
      await page.locator('#waypointHasTask').check();
      await page.locator('#waypointTitle').fill(`Task ${name}`);
      await page.locator('#saveWaypoint').click();
    }
    await page.locator('#markerTools > summary').click();
    await page.locator('#pickNotePosition').click();
    const map = await page.locator('#mapWrap').boundingBox();
    await page.mouse.click(map.x + map.width * 0.75, map.y + map.height * 0.3);
    await page.locator('#environment').fill('Layer test note');
    await page.locator('#saveEnvironment').click();
    await page.locator('[data-route="balanced"]').click();
    await all(false);
    for (const target of Object.values(targets))
      assert.equal(await page.locator(target).isVisible(), false);
    assert.equal(await page.locator('#walker').isVisible(), true);
    await page.locator('#mapWrap').scrollIntoViewIfNeeded();
    const hiddenP1 = await page.locator('#mapSvg').evaluate((svg) => {
      const point = new DOMPoint(300, 359).matrixTransform(svg.getScreenCTM());
      return { x: point.x, y: point.y };
    });
    await page.mouse.click(hiddenP1.x, hiddenP1.y);
    assert.equal(await page.locator('#photoDialog').isVisible(), false);
    assert.equal(await page.locator('#regionDialog').isVisible(), false);
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      assert.equal(
        await page.evaluate(() => !!document.activeElement.closest('[inert]')),
        false,
      );
    }
    for (const [key, target] of Object.entries(targets)) {
      await toggle(key, true);
      assert.equal(
        await page.locator(target).isVisible(),
        true,
        `${key} alone is visible`,
      );
      for (const [other, otherTarget] of Object.entries(targets))
        if (other !== key)
          assert.equal(
            await page.locator(otherTarget).isVisible(),
            false,
            `${other} remains hidden`,
          );
      await toggle(key, false);
    }
    await toggle('imagery', true);
    await toggle('deltaFront', true);
    await toggle('imagery', false);
    assert.equal(await page.locator('#deltaFrontRegion').isVisible(), true);
    await toggle('imagery', true);
    await toggle('deltaFront', false);
    assert.equal(await page.locator('#photoMarker').isVisible(), true);
    assert.equal(await page.locator('#p1Uncertainty').isVisible(), true);
    // Hidden map handlers cannot reveal a layer through keyboard activation.
    await page.locator('#deltaFrontRegion').dispatchEvent('keydown', { key: 'Enter' });
    assert.equal((await state()).layers.deltaFront, false);
    assert.equal(await page.locator('#regionDialog').isVisible(), false);
    await all(true);
    await page.locator('#zoomIn').click();
    const wrap = await page.locator('#mapWrap').boundingBox();
    await page.mouse.move(wrap.x + 300, wrap.y + 250);
    await page.mouse.down();
    await page.mouse.move(wrap.x + 360, wrap.y + 290, { steps: 6 });
    await page.mouse.up();
    const view = await mapView();
    const records = (await state()).nodeObservations;
    await all(false);
    await all(true);
    assert.deepEqual(await mapView(), view);
    assert.deepEqual((await state()).nodeObservations, records);
    assert.equal((await state()).customPoints.length, 2);
    assert.equal((await state()).mapNotes.length, 1);
    // Task cards reveal only their own layer and retain unfinished input and mark.
    await all(false);
    await overview();
    await page.locator('.task-overview [data-observation-node="P1"]').click();
    assert.equal((await state()).layers.imagery, true);
    assert.equal((await state()).layers.deltaFront, false);
    assert.equal(await page.locator('#photoMarker').getAttribute('aria-pressed'), 'true');
    await page.locator('#observationPhoto').evaluate((img) => img.decode());
    await page.locator('#photoCanvas').click({ position: { x: 140, y: 120 } });
    await page.locator('#observation').fill('Unsubmitted P1 draft');
    const mark = (await state()).nodeObservations.P1.images.PIA24485.mark;
    await page.locator('#photoLayerControl').uncheck();
    assert.equal(await page.locator('#photoDialog').isVisible(), false);
    assert.equal(await page.locator('#photoMarker').isVisible(), false);
    await page.locator('.task-overview [data-observation-node="P1"]').click();
    assert.equal(await page.locator('#observation').inputValue(), 'Unsubmitted P1 draft');
    assert.deepEqual((await state()).nodeObservations.P1.images.PIA24485.mark, mark);
    assert.equal(
      await page.locator('.orbital').isVisible(),
      true,
      'Reference image remains accessible',
    );
    await page.locator('#closePhoto').click();
    for (const nodeId of ['N2', 'N3']) {
      await toggle('deltaFront', false);
      await page.locator(`.task-overview [data-observation-node="${nodeId}"]`).click();
      assert.equal((await state()).layers.deltaFront, true);
      assert.equal(
        await page.locator('#deltaFrontRegion').getAttribute('aria-pressed'),
        'true',
      );
      await page.locator('#observation').fill(`Unsubmitted ${nodeId} draft`);
      await page.locator('#photoLayerControl').uncheck();
      assert.equal(await page.locator('#photoDialog').isVisible(), false);
      await page.locator(`.task-overview [data-observation-node="${nodeId}"]`).click();
      assert.equal(
        await page.locator('#observation').inputValue(),
        `Unsubmitted ${nodeId} draft`,
      );
      await page.locator('#regionFromPhoto').click();
      assert.equal(await page.locator('#regionDialog img').count(), 2);
      await page.locator('#regionDialog [data-layer-control="deltaFront"]').uncheck();
      assert.equal(await page.locator('#regionDialog').isVisible(), false);
    }
    await toggle('notes', true);
    await page.getByRole('button', { name: 'Open Environment Note · N1', exact: true }).click();
    await page.locator('#editFieldNote').fill('Unsubmitted environmental edit');
    await page.locator('#fieldNoteDialog [data-layer-control="notes"]').uncheck();
    await toggle('notes', true);
    await page.getByRole('button', { name: 'Open Environment Note · N1', exact: true }).click();
    assert.equal(
      await page.locator('#editFieldNote').inputValue(),
      'Unsubmitted environmental edit',
    );
    assert.equal((await state()).mapNotes[0].content, 'Layer test note');
    await page.locator('#closeFieldNote').click();
    await page.locator('[data-route="custom"]').click();
    await page.locator('#waypointName').fill('Sidebar draft to keep');
    await toggle('customMap', false);
    await overview();
    await page.locator('#customTaskCards .task-card').first().click();
    assert.equal((await state()).layers.customMap, true);
    assert.equal(
      await page.locator('#waypointName').inputValue(),
      'Sidebar draft to keep',
    );
    await page.locator('#pointName').fill('Unsubmitted waypoint name');
    await page.locator('#customTaskDialog [data-layer-control="customMap"]').uncheck();
    assert.equal(await page.locator('#customWaypointLayer').isVisible(), false);
    await page.locator('#customTaskCards .task-card').first().click();
    assert.equal(
      await page.locator('#pointName').inputValue(),
      'Unsubmitted waypoint name',
    );
    assert.equal((await state()).customPoints[0].name, 'Start');
    await page.locator('#cancelPointEdit').click();
    // A live simulation continues using its route even while every map layer is hidden.
    await page.locator('[data-route="balanced"]').click();
    await page.locator('.mission-panel > summary').click();
    await page.locator('#start').click();
    await page.clock.runFor(2000);
    const trip = await state();
    assert.ok(trip.progress > 0);
    await all(false);
    const hiddenTrip = await state();
    assert.equal(hiddenTrip.progress, trip.progress);
    assert.equal(hiddenTrip.phase, trip.phase);
    assert.equal(hiddenTrip.paused, trip.paused);
    await page.clock.runFor(1000);
    assert.ok((await state()).progress > trip.progress);
    assert.equal(await page.locator('#walker').isVisible(), true);
    await all(true);
    await page.clock.runFor(500);
    await page.screenshot({ path: path.resolve(__dirname, 'layers.png') });
    await page.reload();
    const restored = await state();
    assert.equal(restored.phase, 'outbound');
    assert.equal(
      restored.nodeObservations.P1.images.PIA24485.draft,
      'Unsubmitted P1 draft',
    );
    assert.equal(
      restored.nodeObservations.N2.images.PIA24925.draft,
      'Unsubmitted N2 draft',
    );
    assert.equal(restored.mapNotes[0].editDraft, 'Unsubmitted environmental edit');
    assert.deepEqual(errors, []);
    console.log(
      'PASS: isolated layers, both observation layers, all off/on, task-based reveal and highlight, hidden keyboard guards, modal ownership, unsaved photo/note/waypoint drafts, references, zoom/pan, live progress and reload',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
