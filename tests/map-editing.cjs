const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../mission.html')).href,{waitUntil:'domcontentloaded'});
  await page.locator('#previewDelta').click();
  assert.equal(await page.locator('#photoDialog').isVisible(),true);
  await page.locator('#closePhoto').click();
  const geology=page.locator('.task-overview details').first();
  await geology.locator('summary').click();
  assert.equal(await page.locator('#previewDelta').isVisible(),false);
  await geology.locator('summary').click();
  await page.locator('#previewEnvironment').click();
  assert.equal(await page.locator('#environmentTaskDialog').isVisible(),true);
  await page.locator('#closeEnvironmentTask').click();
  await page.locator('#zoomIn').click();
  await page.locator('#zoomIn').click();
  assert.equal(await page.locator('#zoomLevel').textContent(),'200%');
  async function selectMapPoint(x,y){
   await page.locator('#mapWrap').scrollIntoViewIfNeeded();
   const point=await page.locator('#mapWrap').evaluate((e,p)=>{const b=e.getBoundingClientRect();return {x:Math.floor(b.left+p.x),y:Math.floor(b.top+p.y)};},{x,y});
   const expected=await page.locator('#mapSvg').evaluate((svg,p)=>{const q=new DOMPoint(p.x,p.y).matrixTransform(svg.getScreenCTM().inverse());return {x:q.x,y:q.y};},point);
   await page.mouse.click(point.x,point.y);
   return expected;
  }
  if (!(await page.locator('#markerTools').evaluate(e => e.open))) await page.locator('#markerTools > summary').click();
  await page.locator('#pickNotePosition').click();
  const expected=await selectMapPoint(200,180);
  await page.locator('#environment').fill('Original zoomed observation');
  await page.locator('#saveEnvironment').click();
  async function saved(){return page.evaluate(()=>JSON.parse(localStorage.getItem('marspath-mission-v1')));}
  let note=(await saved()).mapNotes[0];

  assert.ok(Math.abs(note.position.x-expected.x)<0.1);
  assert.ok(Math.abs(note.position.y-expected.y)<0.1);
  await page.getByRole('button',{name:'Open field note N1',exact:true}).click();
  await page.locator('#editFieldNote').fill('Edited observation');
  await page.locator('#updateFieldNote').click();
  assert.equal(await page.locator('#fieldNoteContent').textContent(),'Edited observation');
  await page.locator('#moveFieldNote').click();
  const moved=await selectMapPoint(310,250);
  note=(await saved()).mapNotes[0];
  assert.ok(Math.abs(note.position.x-moved.x)<0.1);
  assert.ok(Math.abs(note.position.y-moved.y)<0.1);
  await page.locator('#resetZoom').click();
  await page.getByRole('button',{name:'Open field note N1',exact:true}).click();
  assert.equal(await page.locator('#fieldNoteContent').textContent(),'Edited observation');
  await page.locator('#closeFieldNote').click();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.deepEqual((await saved()).mapNotes[0].position,note.position);
  await page.getByRole('button',{name:'Open field note N1',exact:true}).click();
  assert.equal(await page.locator('#fieldNoteContent').textContent(),'Edited observation');
  await page.locator('#closeFieldNote').click();
  await page.locator('#zoomIn').click();
  await page.getByRole('button',{name:'Open field note N1',exact:true}).click();
  await page.locator('#deleteFieldNote').click();
  assert.equal(await page.getByRole('button',{name:'Open field note N1',exact:true}).count(),0);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal((await saved()).mapNotes.length,0);
  await page.screenshot({path:path.resolve(__dirname,'map-editing.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: task previews, theme collapse, independent task sidebar, 200% zoom, coordinate accuracy, edit, move, reset zoom, reload and delete');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
