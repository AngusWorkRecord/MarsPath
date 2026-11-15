const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {waitUntil: 'domcontentloaded'});
    assert.equal(await page.locator('#markerMode').inputValue(), 'all');
    assert.equal(await page.locator('#photoMarker').isVisible(), true);
    await page.locator('#imagery').uncheck();
    assert.equal(await page.locator('#photoMarker').isVisible(), false);
    await page.locator('#imagery').check();
    await page.locator('#markerMode').selectOption('near');
    assert.equal(await page.locator('#photoMarker').isVisible(), false);
    await page.locator('#markerMode').selectOption('all');
    await page.locator('#photoMarker').click();
    await page.locator('#photoDialog').waitFor({state:'visible'});
    assert.equal(await page.locator('#photoCanvas img').evaluate(img => img.complete && img.naturalWidth > 1000), true);
    assert.equal(await page.locator('.orbital').evaluate(img => img.complete && img.naturalWidth > 1000), true);
    await page.locator('#closePhoto').click();
    console.log('PASS: all/nearby imagery markers, layer toggle, surface and orbital photos');
    for (const [index, pos] of [{x:220,y:100},{x:420,y:160}].entries()) {
      if (!(await page.locator('#markerTools').evaluate(e => e.open))) await page.locator('#markerTools > summary').click();
      await page.locator('#pickNotePosition').click();
      await page.locator('#mapSvg').click({position: pos});
      await page.locator('#environment').fill(`Environment note ${index + 1}`);
      await page.locator('#saveEnvironment').click();
      await page.getByRole('button', {name:`Open field note N${index + 1}`, exact:true}).click();
      assert.equal(await page.locator('#fieldNoteContent').textContent(), `Environment note ${index + 1}`);
      assert.match(await page.locator('#fieldNoteMeta').textContent(), /Map point/);
      await page.locator('#closeFieldNote').click();
    }
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('marspath-mission-v1')));
    assert.notDeepEqual(saved.mapNotes[0].position, saved.mapNotes[1].position);
    assert.deepEqual(saved.records[0].position, saved.mapNotes[0].position);
    assert.equal(saved.phase, 'planning');
    await page.reload({waitUntil: 'domcontentloaded'});
    await page.getByRole('button',{name:'Open field note N1',exact:true}).click();
    assert.equal(await page.locator('#fieldNoteContent').textContent(), 'Environment note 1');
    await page.locator('#closeFieldNote').click();
    await page.getByRole('button',{name:'Open field note N2',exact:true}).click();
    assert.equal(await page.locator('#fieldNoteContent').textContent(), 'Environment note 2');
    await page.locator('#closeFieldNote').click();
    assert.equal(await page.locator('#photoMarker').isVisible(), true);
    assert.deepEqual(errors, []);
    await page.screenshot({path:path.resolve(__dirname,'map-notes.png'),fullPage:true});
    console.log('PASS: two arbitrary map notes saved before departure, reopened and restored after reload; no script errors');
  } finally { await browser.close(); }
})().catch(e => {console.error(e);process.exitCode=1;});
