const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {
      waitUntil: 'domcontentloaded',
    });
    assert.equal(await p.locator('#toggleTaskSidebar').count(), 0);
    assert.equal(await p.locator('#taskSidebar > details').count(), 4);
    await p.locator('#mapWrap').scrollIntoViewIfNeeded();
    const rect = await p.locator('#mapWrap').boundingBox();
    const anchor = {
      x: Math.floor(rect.x + rect.width * 0.45),
      y: Math.floor(rect.y + rect.height * 0.5),
    };
    const mapPoint = () =>
      p.locator('#mapSvg').evaluate((svg, a) => {
        const q = new DOMPoint(a.x, a.y).matrixTransform(svg.getScreenCTM().inverse());
        return { x: q.x, y: q.y };
      }, anchor);
    const before = await mapPoint();
    const legend = await p.locator('.map-legend').boundingBox();
    const label = await p.locator('.map-toplabel').boundingBox();
    await p.mouse.move(anchor.x, anchor.y);
    await p.mouse.wheel(0, -450);
    await p.waitForFunction(
      () => document.querySelector('#zoomLevel').textContent !== '100%',
    );
    const after = await mapPoint();
    assert.ok(
      Math.abs(before.x - after.x) < 1 && Math.abs(before.y - after.y) < 1,
      'pointer anchor remains fixed',
    );
    assert.deepEqual(await p.locator('.map-legend').boundingBox(), legend);
    assert.deepEqual(await p.locator('.map-toplabel').boundingBox(), label);
    const transform = await p.locator('#mapScene').evaluate((e) => e.style.transform);
    await p.mouse.down();
    await p.mouse.move(anchor.x + 70, anchor.y + 50, { steps: 10 });
    await p.mouse.up();
    assert.notEqual(
      await p.locator('#mapScene').evaluate((e) => e.style.transform),
      transform,
    );
    assert.equal(
      await p.locator('#notePosition').textContent(),
      'Select any map point, then write and save a field note.',
    );
    assert.equal(await p.locator('dialog[open]').count(), 0);
    assert.deepEqual(await p.locator('.map-legend').boundingBox(), legend);
    const zoom = await p.locator('#zoomLevel').textContent();
    for (let i = 0; i < 4; i++) {
      const section = p.locator('#taskSidebar > details').nth(i);
      await section.locator(':scope > summary').click();
      assert.equal(await section.getAttribute('open'), null);
      for (let j = 0; j < 4; j++)
        if (i !== j)
          assert.notEqual(
            await p.locator('#taskSidebar > details').nth(j).getAttribute('open'),
            null,
          );
      await section.locator(':scope > summary').click();
      assert.equal(await section.locator(':scope > .panel-body').isVisible(), true);
    }
    assert.equal(await p.locator('#zoomLevel').textContent(), zoom);
    if (!(await p.locator('#markerTools').evaluate(e => e.open))) await p.locator('#markerTools > summary').click();
    await p.locator('#pickNotePosition').click();
    const v = await p.locator('#mapWrap').boundingBox();
    await p.mouse.click(Math.floor(v.x + 200), Math.floor(v.y + 200));
    await p.locator('#environment').fill('Dragged and zoomed note');
    await p.locator('#saveEnvironment').click();
    await p.getByRole('button', { name: 'Open field note N1', exact: true }).click();
    assert.equal(
      await p.locator('#fieldNoteContent').textContent(),
      'Dragged and zoomed note',
    );
    await p.locator('#closeFieldNote').click();
    await p.locator('#resetZoom').click();
    assert.equal(await p.locator('#zoomLevel').textContent(), '100%');
    await p.locator('#previewDelta').click();
    assert.equal(await p.locator('#photoDialog').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: four independent collapsible sections; pointer-centered wheel zoom; drag without accidental notes/dialogs; fixed HUD; notes after pan/zoom; task preview',
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
