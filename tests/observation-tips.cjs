const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const state = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('marspath-mission-v1')));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href);
    await page.locator('.task-overview [data-observation-node="N2"]').click();
    await page.locator('#observationPhoto').evaluate((img) => img.decode());
    assert.equal(await page.locator('#showReferences').isChecked(), false);
    assert.equal(await page.locator('#photoReferences').isVisible(), false);
    assert.match(await page.locator('#beginnerHint').textContent(), /parallel lines/);
    const before = (await state()).nodeObservations;
    await page.locator('#showReferences').check();
    assert.equal(await page.locator('#photoReferences .reference-box').count(), 2);
    assert.deepEqual(
      (await state()).nodeObservations,
      before,
      'Teaching overlays must not alter evidence',
    );
    // A learner may mark outside either teaching box and use ordinary language.
    await page.locator('#photoCanvas').click({ position: { x: 140, y: 140 } });
    await page.locator('#observation').fill('There are several parallel lines here.');
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    const evidence = (await state()).nodeObservations.N2.images.PIA24925.saved;
    await page.locator('#showReferences').uncheck();
    assert.equal(await page.locator('#annotation').isVisible(), true);
    assert.deepEqual((await state()).nodeObservations.N2.images.PIA24925.saved, evidence);
    await page.locator('#showReferences').check();
    await page.locator('#photoDialog').evaluate((e) => {
      e.scrollTop = 0;
    });
    await page.screenshot({
      path: path.resolve(__dirname, 'observation-tips-skinner.png'),
    });
    await page.locator('#observationImage').selectOption('PIA24926-left');
    assert.equal(await page.locator('#photoReferences .reference-box').count(), 1);
    assert.match(await page.locator('#beginnerHint').textContent(), /rover-scraped/);
    await page.locator('#photoDialog [data-observation-node="N3"]').click();
    assert.equal(await page.locator('#showReferences').isChecked(), false);
    assert.equal(await page.locator('#comparisonReferences').isVisible(), false);
    await page.locator('#observationPhoto').evaluate((img) => img.decode());
    await page.locator('#comparisonPhoto').evaluate((img) => img.decode());
    await page.locator('#showReferences').check();
    assert.equal(await page.locator('#photoReferences .reference-box').count(), 1);
    assert.equal(await page.locator('#comparisonReferences .reference-box').count(), 1);
    assert.match(await page.locator('#beginnerHint').textContent(), /grains.*smoother/);
    await page
      .locator('#observation')
      .fill('One picture looks smoother, and the other has more little specks.');
    await page.locator('#saveObservation').click();
    await page.locator('#confirmObservation').check();
    await page.locator('#photoDialog').evaluate((e) => {
      e.scrollTop = 0;
    });
    await page.screenshot({
      path: path.resolve(__dirname, 'observation-tips-wildcat.png'),
    });
    await page.locator('#observationImage').selectOption('PIA24928');
    assert.equal(await page.locator('#comparisonContext').isVisible(), false);
    assert.equal(await page.locator('#comparisonReferences').isVisible(), false);
    assert.match(
      await page.locator('#beginnerHint').textContent(),
      /Choose the Wildcat close-up/,
    );
    await page.locator('#photoDialog [data-observation-node="P1"]').click();
    assert.equal(await page.locator('#beginnerHelp').isVisible(), false);
    assert.equal(await page.locator('#photoReferences').isVisible(), false);
    await page.reload();
    await page.locator('.task-overview [data-observation-node="N2"]').click();
    assert.equal(await page.locator('#showReferences').isChecked(), false);
    await page.locator('#observationImage').selectOption('PIA24925');
    assert.equal(await page.locator('#observation').inputValue(), evidence.text);
    assert.equal(await page.locator('#annotation').isVisible(), true);
    assert.equal((await state()).nodeObservations.N3.done, true);
    assert.deepEqual(errors, []);
    console.log(
      'PASS: image-specific tips, default-off independent reference overlays, paired texture examples, ordinary-language observations, own-mark preservation, image switching and refresh',
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
