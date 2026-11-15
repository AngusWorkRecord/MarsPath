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
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href);
    const area = page.locator('#deltaFrontRegion');
    const view = () =>
      page.evaluate(() => ({
        transform: document.getElementById('mapScene').style.transform,
        width: document.getElementById('mapScene').style.width,
        scrollY: window.scrollY,
      }));
    const state = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('marspath-mission-v1')));
    async function mapPoint(x = 260, y = 345) {
      return page.locator('#mapSvg').evaluate(
        (svg, point) => {
          const p = new DOMPoint(point.x, point.y).matrixTransform(svg.getScreenCTM());
          return { x: p.x, y: p.y };
        },
        { x, y },
      );
    }
    async function clickArea() {
      const p = await mapPoint();
      await page.mouse.click(p.x, p.y);
    }
    assert.equal(await area.isVisible(), true);
    assert.match(
      await page.locator('#deltaFrontLabel').textContent(),
      /Approximate observation area/,
    );
    const opacity = await page
      .locator('#deltaFrontArea')
      .evaluate((e) => Number(getComputedStyle(e).fillOpacity));
    assert.ok(opacity > 0 && opacity < 1);
    assert.equal(await area.getAttribute('aria-pressed'), 'false');
    await page.locator('#zoomIn').click();
    await page.locator('#zoomIn').click();
    await page.locator('#mapWrap').scrollIntoViewIfNeeded();
    // Bring the region comfortably into view by a real pointer drag.
    const wrap = await page.locator('#mapWrap').boundingBox();
    await page.mouse.move(wrap.x + 160, wrap.y + 260);
    await page.mouse.down();
    await page.mouse.move(wrap.x + 280, wrap.y + 270, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator('#regionDialog').isVisible(), false);
    const before = await view();
    await clickArea();
    assert.equal(await page.locator('#regionDialog').isVisible(), true);
    assert.equal(await area.getAttribute('aria-pressed'), 'true');
    assert.match(
      await page.locator('#regionPrecision').textContent(),
      /no quantified\s+accuracy/,
    );
    await page
      .locator('#regionDialog img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    await page.screenshot({ path: path.resolve(__dirname, 'region-entry-cards.png') });
    await page.locator('#regionDialog [data-observation-node="N2"]').click();
    await page.locator('#observationPhoto').evaluate((image) => image.decode());
    await page.locator('#photoCanvas').click({ position: { x: 170, y: 135 } });
    await page
      .locator('#observation')
      .fill('Map entry: a horizontal rock layer is visible.');
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    assert.equal((await state()).nodeObservations.N2.done, true);
    await page.locator('#photoDialog [data-observation-node="N3"]').click();
    await page.locator('#observationPhoto').evaluate((image) => image.decode());
    await page.locator('#comparisonPhoto').evaluate((image) => image.decode());
    await page
      .locator('#observation')
      .fill('Map entry: the Wildcat surface appears smoother than the Skinner close-up.');
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    assert.equal((await state()).nodeObservations.N3.done, true);
    await page.locator('#closePhoto').click();
    await page.waitForFunction(() => !document.getElementById('photoDialog').open);
    await page.waitForTimeout(100);
    assert.deepEqual(
      await view(),
      before,
      'Closing the final card restores zoom, pan and page scroll',
    );
    await page.screenshot({ path: path.resolve(__dirname, 'region-entry-map.png') });

    // A drag beginning on the polygon must not open its dialog.
    const start = await mapPoint();
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x + 35, start.y + 15, { steps: 6 });
    await page.mouse.up();
    assert.equal(await page.locator('#regionDialog').isVisible(), false);
    assert.notEqual((await view()).transform, before.transform);

    // Sidebar rock tasks reuse the same records and selection highlight.
    await page.locator('#previewDelta').click();
    assert.equal(await area.getAttribute('aria-pressed'), 'false');
    await page.locator('#closePhoto').click();
    for (const nodeId of ['N2', 'N3']) {
      await page.locator(`.task-overview [data-observation-node="${nodeId}"]`).click();
      assert.equal(await area.getAttribute('aria-pressed'), 'true');
      assert.match(await page.locator('#observation').inputValue(), /Map entry:/);
      assert.equal(await page.locator('#confirmObservation').isChecked(), true);
      await page.locator('#closePhoto').click();
    }
    await page.locator('#mapWrap').scrollIntoViewIfNeeded();
    await area.focus();
    const keyboardView = await view();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#regionDialog').isVisible(), true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    assert.deepEqual(await view(), keyboardView);

    // The area remains usable without photo anchors and never acquires rock coordinates.
    assert.equal(await page.evaluate(() => OBSERVATION_DATA.nodes.N2.anchor), null);
    assert.equal(await page.evaluate(() => OBSERVATION_DATA.nodes.N3.anchor), null);
    assert.equal(
      await page.evaluate(() => OBSERVATION_DATA.regions.deltaFront.nearbyEnabled),
      false,
    );
    if (!(await page.locator('#markerTools').evaluate((e) => e.open)))
      await page.locator('#markerTools > summary').click();
    await page.locator('#pickNotePosition').click();
    await page.locator('#mapWrap').scrollIntoViewIfNeeded();
    await clickArea();
    assert.equal(await page.locator('#regionDialog').isVisible(), false);
    await page
      .locator('#environment')
      .fill('Environment note inside approximate observation area.');
    await page.locator('#saveEnvironment').click();
    assert.equal((await state()).mapNotes.length, 1);
    await page.getByRole('button', { name: 'Open field note N1', exact: true }).click();
    assert.match(
      await page.locator('#fieldNoteContent').textContent(),
      /inside approximate/,
    );
    await page.locator('#closeFieldNote').click();
    await page.reload();
    assert.equal((await state()).nodeObservations.N2.done, true);
    assert.equal((await state()).nodeObservations.N3.done, true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: actual map-area click, highlight, shared cards, independent saved observations, restored zoom/pan/scroll, sidebar access, keyboard, drag and note placement',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
