// Run with Node and Playwright; PLAYWRIGHT_MODULE may select an existing install.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs/promises');
const url = pathToFileURL(path.resolve(__dirname, '../mission.html')).href;
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const errors = [], passed = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.clock.install({ time: new Date('2026-11-15T04:00:00Z') });
    await page.clock.pauseAt(new Date('2026-11-15T04:00:01Z'));
    await page.goto(url, { waitUntil: 'load' });
    const text = s => page.locator(s).textContent();
    const check = async (label, expression) => {
      assert.equal(await page.evaluate(expression), true, label); passed.push(label);
    };
    const controls = async () => {
      await page.locator('.mission-panel').evaluate(e => e.open = true);
    };
    const overview = async () => {
      await page.locator('.task-overview').evaluate(e => e.open = true);
    };
    const reset = async () => {
      await page.evaluate(() => { localStorage.removeItem(KEY); localStorage.removeItem(KEY + '-sidebar'); });
      await page.reload({ waitUntil: 'load' });
    };
    assert.equal(await page.title(), 'MarsPath · Marswalk Simulator');
    for (const [route, name, stops] of [['balanced', 'Balanced Route', 2], ['shortest', 'Direct Route', 1], ['science', 'Science Route', 3]]) {
      await page.locator(`[data-route="${route}"]`).click();
      assert.equal(await text('#routeName'), name);
      assert.equal(await page.locator('#missionRoute option:checked').textContent(), name);
      assert.equal(await text('#stopsLabel'), 'Route Stops');
      assert.equal(await text('#stops'), `${stops} stop${stops === 1 ? '' : 's'}`);
      assert.ok((await text('#activePosition')).includes(name));
    }
    passed.push('Route names agree across sidebar, dropdown, heading and status; counts and units agree');
    await page.locator('#markerMode').selectOption('near');
    assert.ok((await text('#nearbySummary')).startsWith('Show When Nearby · SIM'));
    await page.locator('#markerMode').selectOption('all');
    assert.ok((await text('#nearbySummary')).startsWith('Always Show'));
    const expectedSTP1 = [
      'STP1 · Simulated Task Point',
      'SIMULATED · Demo Only',
      'This temporary task point is the shared destination for the three preset simulated routes. It demonstrates route selection, arrival, and task completion. The point and task are for demonstration only and are not linked to real observation data. The routes are simulated and have not been verified for real-world traversal.',
      'Task Objective',
      'Reach STP1 using a preset route, then confirm completion of the simulated task.',
    ];
    const details = selector => page.locator(selector).locator('h3, p').allTextContents();
    assert.deepEqual(await details('#stp1TaskDetails'), expectedSTP1);
    await page.locator('#previewDelta').click();
    assert.deepEqual(await details('#stp1DialogDetails'), expectedSTP1);
    assert.equal(await page.locator('#completeStp1').isEnabled(), false);
    assert.equal(await page.locator('#photoDialog').isVisible(), false);
    await page.locator('#closeStp1').click();
    await page.locator('#stp1Marker').click();
    assert.deepEqual(await details('#stp1DialogDetails'), expectedSTP1);
    await page.locator('#closeStp1').click();
    await page.locator('#stp1Marker').press('Enter');
    assert.equal(await page.locator('#stp1Dialog').isVisible(), true);
    await page.locator('#stp1Dialog').press('Escape');
    passed.push('Tasks, map click and keyboard open the same exact STP1 description; completion blocked before arrival');
    await page.locator('.task-overview [data-observation-node="P1"]').click();
    assert.equal(await text('#photoTitle'), 'P1 · Delta View from the Landing Site');
    assert.equal(await text('#photoLayerControlLabel'), 'P1 · Landing-site Imagery');
    assert.ok(!(await text('#observationTaskPrompt')).includes('STP1'));
    assert.ok((await text('#photoMetadata')).includes('Image Captured'));
    assert.ok((await text('#landingContext')).includes('Exact camera pose and'));
    assert.equal(await page.locator('#confirmObservation').isEnabled(), false);
    await page.locator('#closePhoto').click();
    await page.locator('#openRegion').click();
    assert.equal(await text('#regionTitle'), 'Delta-front Observation Area');
    await page.locator('#regionDialog [data-observation-node="N2"]').click();
    assert.equal(await text('#photoTitle'), 'Skinner Ridge');
    assert.ok((await text('#observationTaskPrompt')).includes('a patch polished by the rover'));
    await page.locator('#showReferences').check();
    assert.ok((await text('#photoReferences')).includes('Reference:'));
    await page.locator('#observationPhoto').evaluate(i => i.decode());
    await page.locator('#photoCanvas').press('Enter');
    await page.locator('#observation').fill('Several parallel layers are visible.');
    await page.locator('#saveDraft').click();
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    assert.ok((await text('#skinnerTaskStatus')).startsWith('Completed'));
    assert.ok((await text('#observationTimes')).includes('Your Observation Saved:'));
    await page.locator('#photoDialog [data-observation-node="N3"]').click();
    assert.equal(await text('#photoTitle'), 'Wildcat Ridge');
    await page.locator('#observationPhoto').evaluate(i => i.decode());
    await page.locator('#comparisonPhoto').evaluate(i => i.decode());
    await page.locator('#observation').fill('Wildcat Ridge looks smoother than Skinner Ridge.');
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    assert.ok((await text('#wildcatTaskStatus')).startsWith('Completed'));
    await page.locator('#closePhoto').click();
    passed.push('P1, regional entry, Skinner Ridge and Wildcat Ridge cards, reference marks, image metadata and completion');
    // Environment Note lifecycle, including actual map clicks.
    await page.locator('#markerTools > summary').click();
    await page.locator('#pickNotePosition').click();
    await page.locator('#mapSvg').click({ position: { x: 100, y: 100 } });
    assert.ok((await text('#notePosition')).startsWith('Location selected. Enter an environment note.'));
    await page.locator('#saveEnvironment').click();
    assert.equal(await text('#noteStatus'), 'Enter a note before saving.');
    await page.locator('#environment').fill('Terrain note · 历史用户原文');
    await page.locator('#saveEnvironment').click();
    assert.equal(await text('#noteStatus'), 'Note saved. Select its map marker to view it.');
    await page.locator('#fieldNoteLayer [role="button"]').click();
    assert.equal(await text('#fieldNoteTitle'), 'Environment Note · N1');
    await page.locator('#editFieldNote').fill('');
    await page.locator('#updateFieldNote').click();
    assert.equal(await text('#fieldNoteFeedback'), 'Enter a note before saving.');
    await page.locator('#editFieldNote').fill('Edited terrain note · 原文');
    await page.locator('#updateFieldNote').click();
    await page.locator('#moveFieldNote').click();
    await page.locator('#mapSvg').click({ position: { x: 160, y: 150 } });
    assert.equal(await text('#noteStatus'), 'Note moved and saved. Select its map marker to view it.');
    await page.reload({ waitUntil: 'load' });
    await check('Environment Note edit and location survive reload', () => state.mapNotes[0].content === 'Edited terrain note · 原文' && state.mapNotes[0].updatedAt !== undefined);
    await page.locator('#fieldNoteLayer [role="button"]').click();
    await page.locator('#deleteFieldNote').click();
    assert.equal(await text('#noteStatus'), 'Note deleted. Historical journey log entries are retained.');
    await check('Deleting a note preserves historical log content', () => !state.mapNotes.length && state.records.some(r => r.content === 'Terrain note · 历史用户原文'));
    await reset();
    await page.locator('[data-route="shortest"]').click();
    await controls(); await page.locator('#start').click();
    await page.clock.runFor(8000);
    await overview(); await page.locator('.task-overview [data-observation-node="P1"]').click();
    await check('Real P1 observation still requires its own saved evidence', () => near() && !canConfirmNode('P1') && !state.stp1Done);
    await page.locator('#observationPhoto').evaluate(i => i.decode());
    await page.locator('#photoCanvas').press('Enter');
    await page.locator('#observation').fill('Visible delta remnant in the landing-site image.');
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    await check('Real P1 completion does not complete STP1', () => observationState('P1').done && !state.stp1Done);
    const savedP1 = await page.evaluate(() => JSON.stringify(state.nodeObservations.P1));
    await page.locator('#closePhoto').click();
    await controls(); await page.locator('#pause').click(); await page.clock.runFor(40000);
    await overview(); await page.locator('#previewDelta').click();
    await page.locator('#completeStp1').click();
    assert.equal(await page.evaluate(() => JSON.stringify(state.nodeObservations.P1)), savedP1);
    passed.push('STP1 completion preserves existing real P1 observation evidence and completion');
    await page.locator('#closeStp1').click();
    // All preset journeys run using the actual timer, accelerated by Playwright's clock.
    for (const route of ['balanced', 'shortest', 'science']) {
      await reset();
      await page.locator(`[data-route="${route}"]`).click();
      await controls(); await page.locator('#start').click(); await page.locator('#pause').click();
      await check(`${route}: new log uses the unified route name`, () => state.records.some(r => r.kind === 'start' && r.content.includes(routes[state.route].name)));
      await page.reload({ waitUntil: 'load' });
      await check(`${route}: paused journey restored`, () => state.phase === 'outbound' && state.paused && $('pause').textContent === 'Resume');
      await controls();
      await page.locator('#pause').click();
      await page.clock.runFor(50000);
      await check(`${route}: arrived at STP1; demo completion needs no observation evidence`, () => atSTP1() && state.paused && canCompleteSTP1() && !observationEvidence('P1'));
      const observationsBefore = await page.evaluate(() => JSON.stringify(state.nodeObservations));
      await overview(); await page.locator('#previewDelta').click();
      assert.deepEqual(await details('#stp1DialogDetails'), expectedSTP1);
      await page.locator('#completeStp1').click();
      assert.equal(await page.evaluate(() => JSON.stringify(state.nodeObservations)), observationsBefore);
      await check(`${route}: simulated completion log has no real image or evidence`, () => state.records.some(r => r.taskId === 'T-STP1' && r.kind === 'task' && r.nodeId === null && r.imageId === null && !r.evidence));
      await page.locator('#closeStp1').click();
      await page.reload({ waitUntil: 'load' });
      await check(`${route}: STP1 completion restored`, () => state.stp1Done && atSTP1() && $('deltaTaskStatus').textContent.includes('Completed'));
      await controls(); await page.locator('#return').click();
      await page.clock.runFor(50000);
      await check(`${route}: return reaches start and retains completion`, () => state.phase === 'finished' && state.progress === 0 && state.stp1Done);
      await page.locator('#newJourney').click();
      await check(`${route}: new journey retains history`, () => state.phase === 'planning' && state.records.length > 0 && !state.stp1Done);
    }
    // Custom route editor, task count, completion and storage restore.
    await reset(); await page.locator('[data-route="custom"]').click();
    await page.evaluate(() => openSidebarSection(document.querySelector('.task-overview')));
    await page.locator('#previewDelta').click();
    assert.equal(await page.locator('#completeStp1').isEnabled(), false);
    await page.locator('#closeStp1').click(); await controls();
    await check('Custom Route cannot complete STP1', () => !canCompleteSTP1() && !state.stp1Done);
    assert.equal(await text('#stopsLabel'), 'Tasks');
    assert.equal(await text('#stops'), '0 tasks');
    assert.equal(await text('#customTaskCards'), 'No tasks added to this route.');
    for (const [x, y, task] of [[200, 200, false], [300, 300, true]]) {
      await page.locator('#waypointName').fill(task ? 'Rock overlook' : 'Start');
      await page.locator('#waypointX').fill(String(x)); await page.locator('#waypointY').fill(String(y));
      await page.locator('#waypointHasTask').setChecked(task);
      if (task) await page.locator('#waypointTitle').fill('Describe the rocks');
      await page.locator('#saveWaypoint').click();
    }
    assert.equal(await text('#stops'), '1 task');
    await page.locator('#customWaypointList li').last().getByRole('button', { name: 'Edit', exact: true }).click();
    assert.equal(await text('#saveWaypoint'), 'Save Waypoint');
    await page.locator('#saveWaypoint').click();
    await page.locator('#confirmCustomRoute').click(); await page.locator('#start').click();
    await page.clock.runFor(9000);
    assert.equal(await page.locator('#customTaskDialog').isVisible(), true);
    assert.equal(await text('#completeCustomTask'), 'Complete Task');
    await page.locator('#completeCustomTask').click(); await page.locator('#closeCustomTask').click();
    await page.reload({ waitUntil: 'load' });
    await check('Custom Route waypoints, confirmation and task completion restore', () => state.customConfirmed && state.customCompleted.includes(1) && state.customPoints[1].name === 'Rock overlook');
    await controls(); await page.locator('#return').click(); await page.clock.runFor(9000);
    await check('Custom Route returns to its own start', () => state.phase === 'finished' && getSimulatedPosition().x === 200);
    for (const version of [1, 2]) {
      await page.evaluate(version => {
        const legacy = initial();
        legacy.version = version;
        legacy.records = [{ kind: 'environment', content: 'Historical Field note: unchanged 原文', route: 'balanced', phase: 'planning', time: '2026-11-01T00:00:00Z', progress: 0, position: { x: 100, y: 100 } }];
        legacy.mapNotes = [{ content: 'Existing user note 原文', position: { x: 100, y: 100 }, time: '2026-11-01T00:00:00Z' }];
        localStorage.setItem(KEY, JSON.stringify(legacy));
      }, version);
      await page.reload({ waitUntil: 'load' });
      await check(`v${version}: migration retains historical user text and logs`, () => state.version === 3 && state.mapNotes[0].content === 'Existing user note 原文' && state.records[0].content === 'Historical Field note: unchanged 原文');
    }
    await reset();
    // Verify each dialog and expanded editor fits the viewport at representative widths.
    const out = process.env.UI_WORDING_QA_DIR;
    if (out) await fs.mkdir(out, { recursive: true });
    for (const [width, height] of [[1440, 900], [1280, 720], [1024, 768], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await check(`${width}: page has no horizontal overflow`, () => document.documentElement.scrollWidth <= innerWidth);
      for (const id of ['previewDelta', 'openRegion', 'previewEnvironment']) {
        await overview(); await page.locator('#' + id).click();
        await check(`${width}: ${id} dialog fits`, () => { const d = document.querySelector('dialog[open]'); return d.scrollWidth <= d.clientWidth + 1; });
        if (out && width === 1440 && id === 'previewDelta') await page.screenshot({ path: path.join(out, 'stp1.png') });
        await page.locator('dialog[open]').press('Escape');
      }
      await page.locator('[data-route="custom"]').click();
      await check(`${width}: Route Editor fits`, () => document.documentElement.scrollWidth <= innerWidth);
      if (out) {
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(out, `layout-${width}.png`), fullPage: true });
      }
      await page.locator('[data-route="balanced"]').click();
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ passed, consoleErrors: errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
