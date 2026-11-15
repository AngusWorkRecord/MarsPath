const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
(async () => {
  const manifest = JSON.parse(
    await fs.readFile(
      path.resolve(__dirname, '../assets/observation-manifest.json'),
      'utf8',
    ),
  );
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, '../mission.html')).href, {
      waitUntil: 'load',
    });
    const catalog = await page.evaluate(() => OBSERVATION_DATA);
    assert.equal(catalog.nodes.N2.anchor, null);
    assert.equal(catalog.nodes.N3.anchor, null);
    assert.equal(await page.evaluate(() => photoLocations.length), 1);
    for (const asset of [...manifest.assets, ...manifest.supportingAssets]) {
      const bytes = await fs.readFile(path.resolve(__dirname, '..', asset.src));
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256);
      const size = await page.evaluate(async (source) => {
        const img = new Image();
        img.src = source;
        await img.decode();
        return { width: img.naturalWidth, height: img.naturalHeight };
      }, asset.src);
      assert.equal(size.width, asset.width);
      assert.equal(size.height, asset.height);
      if (catalog.images[asset.id]) assert.equal(catalog.images[asset.id].captured, asset.captured);
    }
    for (const original of manifest.reviewInputs) {
      const bytes = await fs.readFile(path.resolve(__dirname, '..', original.file));
      assert.equal(
        crypto.createHash('sha256').update(bytes).digest('hex'),
        original.sha256,
        `${original.file} must remain unchanged`,
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      'PASS: seven catalog images and two supporting map images decode at recorded full-frame dimensions and match SHA-256; review inputs unchanged; unlocated regional nodes excluded from nearby filtering',
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
