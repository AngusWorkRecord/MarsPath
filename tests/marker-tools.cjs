const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {
      waitUntil: 'domcontentloaded',
    });
    await p.locator('#mapWrap').scrollIntoViewIfNeeded();
    const clickMap = () => p.locator('#mapSvg').click({ position: { x: 200, y: 220 } });
    await clickMap();
    assert.equal(await p.locator('#saveEnvironment').isDisabled(), true);
    if (!(await p.locator('#markerTools').evaluate(e => e.open))) await p.locator('#markerTools > summary').click();
    await p.locator('#pickNotePosition').click();
    assert.equal(await p.locator('#cancelNotePosition').isEnabled(), true);
    await p.locator('#cancelNotePosition').click();
    await p.locator('#mapSvg').click({ position: { x: 100, y: 300 } });
    assert.equal(await p.locator('#fieldNoteDialog').isVisible(), false);
    assert.equal(await p.locator('#saveEnvironment').isDisabled(), true);
    if (!(await p.locator('#markerTools').evaluate(e => e.open))) await p.locator('#markerTools > summary').click();
    await p.locator('#pickNotePosition').click();
    await clickMap();
    assert.equal(await p.locator('#cancelNotePosition').isDisabled(), true);
    await p.locator('#environment').fill('Scalable note');
    await p.locator('#saveEnvironment').click();
    await p.locator('#mapWrap').scrollIntoViewIfNeeded();
    const snapshot = () =>
      p.locator('#mapSvg .marker, #mapSvg .home-marker, #walker').evaluateAll((markers) =>
        markers.map((m) => {
          const g = m.querySelector('.marker-glyph');
          const r = g.getBoundingClientRect();
          const a = m.getCTM();
          const hit = m.querySelector('.marker-hit');
          return {
            width: r.width,
            height: r.height,
            x: a.e,
            y: a.f,
            anchor: m.getAttribute('transform'),
            hitRadius: hit
              ? Number(hit.getAttribute('r')) * Math.abs(m.getScreenCTM().a)
              : null,
          };
        }),
      );
    const before = await snapshot();
    const toolPosition = () =>
      p.locator('.note-map-toolbar').evaluate((e) => {
        const r = e.getBoundingClientRect(),
          v = document.querySelector('#mapWrap').getBoundingClientRect();
        return { x: r.x - v.x, y: r.y - v.y, width: r.width, height: r.height };
      });
    const toolbar = await toolPosition();
    await p.locator('#zoomIn').click();
    await p.locator('#zoomIn').click();
    const after = await snapshot();
    assert.equal(before.length, after.length);
    after.forEach((m, i) => {
      assert.equal(m.anchor, before[i].anchor);
      assert.ok(m.width < before[i].width);
      assert.ok(m.height < before[i].height);
      if (m.hitRadius) assert.ok(m.hitRadius >= 23.9);
    });
    assert.deepEqual(await toolPosition(), toolbar);
    const hitPoint = await p.getByRole('button', { name: 'Open field note N1', exact: true }).evaluate(marker => {
      const matrix = marker.getScreenCTM();
      return { x: matrix.e + 20, y: matrix.f };
    });
    await p.mouse.click(hitPoint.x, hitPoint.y);
    assert.equal(await p.locator('#fieldNoteDialog').isVisible(), true);
    await p.locator('#closeFieldNote').click();
    await p.locator('#resetZoom').click();
    await p.getByRole('button', { name: 'Open field note N1', exact: true }).click();
    await p.locator('#moveFieldNote').click();
    assert.equal(await p.locator('#cancelNotePosition').textContent(), 'Cancel moving');
    await p.locator('#cancelNotePosition').click();
    await p.locator('#mapSvg').click({ position: { x: 100, y: 300 } });
    assert.equal(await p.locator('#fieldNoteDialog').isVisible(), false);
    await p.getByRole('button', { name: 'Open field note N1', exact: true }).click();
    assert.equal(await p.locator('#fieldNoteContent').textContent(), 'Scalable note');
    await p.locator('#closeFieldNote').click();
    await p.locator('#photoMarker').click();
    assert.equal(await p.locator('#photoDialog').isVisible(), true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: all marker glyphs shrink at 200%, fixed 48px hit areas, fixed in-map tools, explicit add/cancel, cancelled move preserves note, marker dialogs work',
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
