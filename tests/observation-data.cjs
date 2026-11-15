const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');
const url = pathToFileURL(path.resolve(__dirname, '../mission.html')).href;
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [];
  const getState = (page) =>
    page.evaluate(() => JSON.parse(localStorage.getItem('marspath-mission-v1')));
  async function newPage(legacy) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      acceptDownloads: true,
    });
    page.on('pageerror', (e) => errors.push(e.message));
    if (legacy)
      await page.addInitScript((value) => {
        if (!localStorage.getItem('marspath-mission-v1'))
          localStorage.setItem('marspath-mission-v1', value);
      }, JSON.stringify(legacy));
    await page.clock.install({ time: new Date('2026-11-15T04:00:00Z') });
    await page.clock.pauseAt(new Date('2026-11-15T04:00:01Z'));
    await page.goto(url, { waitUntil: 'load' });
    return page;
  }
  async function showNode(page, nodeId) {
    if (await page.locator('#photoDialog').isVisible())
      await page.locator(`#photoDialog [data-observation-node="${nodeId}"]`).click();
    else {
      const overview = page.locator('.task-overview');
      if (!(await overview.evaluate((e) => e.open)))
        await overview.locator(':scope > summary').click();
      if (nodeId === 'P1') await page.locator('#previewDelta').click();
      else
        await page.locator(`.task-overview [data-observation-node="${nodeId}"]`).click();
    }
  }
  try {
    // Each existing preset can reach the corrected P1; none equates its destination with P1.
    for (const strategy of ['balanced', 'shortest', 'science']) {
      const p = await newPage();
      assert.equal(
        await p.locator('#photoMarker').getAttribute('transform'),
        'translate(300 359)',
      );
      assert.equal(await p.locator('#p1Uncertainty').getAttribute('r'), '36');
      await showNode(p, 'P1');
      assert.match(await p.locator('#landingContext').textContent(), /2.3\s+km west/);
      await p.locator('#observationPhoto').evaluate((img) => img.decode());
      assert.equal(
        await p.locator('.orbital').evaluate((img) => img.naturalWidth > 1000),
        true,
      );
      if (strategy === 'balanced')
        await p.screenshot({ path: path.resolve(__dirname, 'observation-p1.png') });
      await p.locator('#closePhoto').click();
      await p.locator(`[data-route="${strategy}"]`).click();
      const mars = p.locator('.mission-panel');
      if (!(await mars.evaluate((e) => e.open)))
        await mars.locator(':scope > summary').click();
      await p.locator('#markerMode').selectOption('near');
      await p.locator('#start').click();
      for (
        let tick = 0;
        tick < 80 && !(await p.locator('#photoMarker').isVisible());
        tick++
      )
        await p.clock.runFor(500);
      assert.equal(
        await p.locator('#photoMarker').isVisible(),
        true,
        `${strategy} reaches P1`,
      );
      const arrival = await getState(p);
      assert.ok(
        arrival.progress <
          (await p.locator('#routeLine').getAttribute('points')).split(' ').length - 1,
      );
      assert.equal(arrival.phase, 'outbound');
      await p.locator('#photoMarker').click();
      await p.locator('#photoCanvas').click({ position: { x: 220, y: 180 } });
      await p
        .locator('#observation')
        .fill(
          'A raised layered remnant in the middle ground; the camera is at the landing site and the target is west in the distance.',
        );
      await p.locator('#saveObservation').click();
      await p.locator('#confirmObservation').check();
      assert.equal((await getState(p)).nodeObservations.P1.done, true);
      await p.locator('#closePhoto').click();
      await p.locator('#quickPause').click();
      await p.clock.runFor(50000);
      assert.equal(
        await p.locator('#photoMarker').isVisible(),
        false,
        'route endpoint is not P1',
      );
      await p.locator('#quickReturn').click();
      await p.clock.runFor(50000);
      assert.equal((await getState(p)).phase, 'finished');
      assert.equal((await getState(p)).nodeObservations.P1.done, true);
      await p.close();
    }
    console.log(
      'PASS: corrected approximate P1, official inset, camera/target distinction, all three preset arrivals and task completion, independent endpoint and normal return',
    );
    const page = await newPage();
    await page.locator('#openRegion').click();
    assert.equal(await page.locator('#regionDialog').isVisible(), true);
    assert.equal(await page.locator('#regionDialog img').count(), 2);
    assert.equal(
      await page
        .locator('#regionDialog img')
        .evaluateAll((imgs) =>
          imgs.every((img) => img.complete && img.naturalWidth >= 1900),
        ),
      true,
    );
    await page.screenshot({ path: path.resolve(__dirname, 'observation-region.png') });
    await page.locator('#regionDialog [data-observation-node="N2"]').click();
    assert.equal(await page.locator('#observationImage').inputValue(), 'PIA24925');
    await page.locator('#observationPhoto').evaluate((img) => img.decode());
    assert.match(await page.locator('#photoMetadata').textContent(), /Enhanced color/);
    await page.locator('#photoCanvas').click({ position: { x: 150, y: 120 } });
    await page.locator('#observation').fill('Skinner draft: visible horizontal layers.');
    await page.locator('#saveDraft').click();
    assert.equal((await getState(page)).nodeObservations.N2.done, false);
    await page.screenshot({ path: path.resolve(__dirname, 'observation-skinner.png') });
    await showNode(page, 'N3');
    await page.locator('#observationPhoto').evaluate((img) => img.decode());
    assert.equal(await page.locator('#comparisonContext').isVisible(), true);
    assert.equal(
      await page
        .locator('#comparisonPhoto')
        .evaluate((img) => img.complete && img.naturalWidth === 981),
      true,
    );
    assert.equal(await page.locator('#observation').inputValue(), '');
    await page.screenshot({ path: path.resolve(__dirname, 'observation-wildcat.png') });
    await page
      .locator('#observation')
      .fill(
        'Wildcat appears more uniform and less visibly coarse than Skinner in these close-ups.',
      );
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    await page.locator('#observationImage').selectOption('PIA24928');
    await page.locator('#observationPhoto').evaluate((img) => img.decode());
    await page
      .locator('#observation')
      .fill('Wildcat landscape draft: circular abrasion patch.');
    await page.locator('#saveDraft').click();
    await showNode(page, 'N2');
    assert.equal(
      await page.locator('#observation').inputValue(),
      'Skinner draft: visible horizontal layers.',
    );
    assert.equal(await page.locator('#annotation').isVisible(), true);
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    await page.locator('#observationImage').selectOption('PIA24926-left');
    await page.locator('#observationPhoto').evaluate((img) => img.decode());
    await page.locator('#photoCanvas').click({ position: { x: 260, y: 220 } });
    await page.locator('#observation').fill('Separate Skinner close-up draft.');
    await showNode(page, 'P1');
    await page.locator('#photoCanvas').click({ position: { x: 100, y: 100 } });
    await page.locator('#observation').fill('Separate P1 unfinished draft.');
    await page.locator('#saveDraft').click();
    const before = await getState(page);
    assert.equal(before.version, 2);
    assert.equal('mark' in before, false);
    assert.equal('done' in before, false);
    assert.equal(before.nodeObservations.N2.done, true);
    assert.equal(before.nodeObservations.N3.done, true);
    assert.equal(before.nodeObservations.P1.done, false);
    assert.equal(
      before.nodeObservations.N2.images['PIA24925'].saved.text,
      'Skinner draft: visible horizontal layers.',
    );
    assert.notDeepEqual(
      before.nodeObservations.N2.images['PIA24925'].mark,
      before.nodeObservations.N2.images['PIA24926-left'].mark,
    );
    await page.reload({ waitUntil: 'load' });
    await showNode(page, 'N2');
    assert.equal(await page.locator('#observationImage').inputValue(), 'PIA24926-left');
    assert.equal(
      await page.locator('#observation').inputValue(),
      'Separate Skinner close-up draft.',
    );
    await showNode(page, 'N3');
    assert.equal(await page.locator('#observationImage').inputValue(), 'PIA24928');
    assert.equal(
      await page.locator('#observation').inputValue(),
      'Wildcat landscape draft: circular abrasion patch.',
    );
    await showNode(page, 'P1');
    assert.equal(
      await page.locator('#observation').inputValue(),
      'Separate P1 unfinished draft.',
    );
    await page.locator('#closePhoto').click();
    const logs = (await getState(page)).records.filter((log) => log.nodeId);
    assert.ok(logs.length >= 7);
    for (const log of logs) {
      assert.ok(log.taskId);
      assert.ok(log.imageId);
      assert.ok(log.capturedAt);
      assert.match(log.time, /^2026-/);
    }
    assert.equal(
      before.nodeObservations.N3.images['PIA24926-right'].saved.capturedAt,
      '2022-07-21',
    );
    console.log(
      'PASS: official regional entry, two observation cards, full-frame assets, separate node/image marks, independent drafts and user-confirmed tasks, capture vs operation dates, schema-v2 refresh recovery',
    );
    // Existing map tools, custom routes and early return remain independent of observation cards.
    await page.locator('[data-route="custom"]').click();
    for (const [x, y] of [
      [250, 580],
      [300, 359],
      [700, 359],
    ]) {
      await page.locator('#waypointX').fill(String(x));
      await page.locator('#waypointY').fill(String(y));
      await page.locator('#saveWaypoint').click();
    }
    await page.locator('#confirmCustomRoute').click();
    await page.locator('#start').click();
    await page.clock.runFor(4000);
    await page.locator('#markerTools > summary').click();
    await page.locator('#pickNotePosition').click();
    await page.locator('#mapSvg').click({ position: { x: 200, y: 200 } });
    await page
      .locator('#environment')
      .fill('Environment observation remains independent.');
    await page.locator('#saveEnvironment').click();
    await page.getByRole('button', { name: 'Open field note N1', exact: true }).click();
    assert.match(await page.locator('#fieldNoteContent').textContent(), /independent/);
    await page.locator('#closeFieldNote').click();
    await page.locator('#quickReturn').click();
    await page.clock.runFor(4000);
    assert.equal((await getState(page)).phase, 'finished');
    assert.equal((await getState(page)).nodeObservations.N2.done, true);
    assert.equal((await getState(page)).nodeObservations.N3.done, true);
    const logPanel = page.locator('.sidebar-section').filter({ has: page.locator('#exportLog') });
    if (!(await logPanel.evaluate(e => e.open))) await logPanel.locator(':scope > summary').click();
    const waitDownload = page.waitForEvent('download');
    await page.locator('#exportLog').click();
    const download = await waitDownload;
    const text = new TextDecoder('utf-8', {fatal:true}).decode(await fs.readFile(await download.path()));
    assert.match(text, /Node N2 \| Task T-N2 \| Image PIA24925/);
    assert.match(text, /Node N3 \| Task T-N3 \| Image PIA24926-right/);
    assert.match(text, /Image captured: 2022-07-21/);
    await page.close();
    // A real legacy v1 shape is read before any page code runs; the raw original is backed up.
    const legacy = {
      version: 1,
      route: 'balanced',
      phase: 'planning',
      progress: 0,
      paused: false,
      done: true,
      mark: { x: 0.3, y: 0.4 },
      draft: 'Legacy P1 draft',
      observation: {
        mark: { x: 0.2, y: 0.5 },
        text: 'Legacy saved P1',
        time: '2026-11-14T01:00:00.000Z',
      },
      records: [
        {
          kind: 'observation',
          route: 'balanced',
          phase: 'outbound',
          time: '2026-11-14T01:00:00.000Z',
          content: 'Legacy saved P1',
          progress: 2,
          position: { x: 355, y: 350 },
        },
      ],
    };
    const migrated = await newPage(legacy);
    let restored = await getState(migrated);
    assert.equal(restored.version, 2);
    assert.equal(restored.nodeObservations.P1.done, true);
    assert.equal(restored.nodeObservations.P1.images.PIA24485.draft, legacy.draft);
    assert.deepEqual(restored.nodeObservations.P1.images.PIA24485.mark, legacy.mark);
    assert.equal(
      restored.nodeObservations.P1.images.PIA24485.saved.text,
      legacy.observation.text,
    );
    assert.deepEqual(
      restored.nodeObservations.P1.images.PIA24485.saved.mark,
      legacy.observation.mark,
    );
    assert.equal(restored.records[0].imageId, 'PIA24485');
    assert.equal(restored.records[0].time, legacy.records[0].time);
    assert.equal(
      await migrated.evaluate(() =>
        localStorage.getItem('marspath-mission-v1-backup-v1'),
      ),
      JSON.stringify(legacy),
    );
    assert.equal(restored.nodeObservations.N2.done, false);
    assert.equal(restored.nodeObservations.N3.done, false);
    await migrated.reload({ waitUntil: 'load' });
    assert.equal((await getState(migrated)).nodeObservations.P1.done, true);
    assert.equal(
      await migrated.evaluate(() =>
        localStorage.getItem('marspath-mission-v1-backup-v1'),
      ),
      JSON.stringify(legacy),
    );
    await migrated.close();
    assert.deepEqual(errors, []);
    console.log(
      'PASS: custom route, environmental N marker, fractional early return, legacy P1 evidence/draft/completion migration and exact original backup; no browser errors',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
