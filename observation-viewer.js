'use strict';
function createObservationViewer() {
  // Fractions of the full, unmodified image frame, checked against bundled images.
  // Teaching examples only: never copied into user evidence or completion state.
  const imageTips = {
    PIA24925: {
      hint: 'Look for stacked, roughly parallel lines in the upper rocks, or the small pale round patch below, where the rover scraped the surface. Everyday words are enough: “There are several parallel lines here.”',
      placeholder: 'For example: There are several parallel lines here.',
      boxes: [
        { x: 0.24, y: 0.065, w: 0.23, h: 0.1, label: 'Layers' },
        { x: 0.52, y: 0.66, w: 0.055, h: 0.095, label: 'Abrasion patch' },
      ],
    },
    'PIA24926-left': {
      hint: 'This close-up shows the rover-scraped surface. Look for small grains and rough-looking texture inside the patch. Describe what you see in everyday words, such as “There are lots of little specks here.”',
      placeholder: 'For example: There are lots of little specks here.',
      boxes: [{ x: 0.43, y: 0.35, w: 0.16, h: 0.17, label: 'Texture sample' }],
    },
    'PIA24926-right': {
      hint: 'Compare the two close-ups: where are individual grains easier to see, and which surface looks smoother or more speckled? Write one visible difference in your own words. You do not need to name any minerals.',
      placeholder:
        'For example: In one photo I can see more separate specks than in the other.',
      boxes: [{ x: 0.43, y: 0.35, w: 0.16, h: 0.17, label: 'Texture sample' }],
    },
    PIA24928: {
      hint: 'The pale round patch is where the rover scraped this rock. Choose the Wildcat close-up above to compare its grains and texture with Skinner. Everyday words such as “smoother” or “more speckled” are enough.',
      placeholder:
        'Describe what you notice. Use the paired close-ups to save the comparison task.',
      boxes: [{ x: 0.62, y: 0.285, w: 0.055, h: 0.07, label: 'Abrasion patch' }],
    },
  };
  function paintReferences() {
    const tips = imageTips[currentObservationImage];
    $('beginnerHelp').hidden = !tips;
    $('beginnerHint').textContent = tips?.hint || '';
    $('observation').placeholder =
      tips?.placeholder ||
      'Write one visible observation. Drafts are saved automatically for this node and image.';
    for (const [id, imageId] of [
      ['photoReferences', currentObservationImage],
      ['comparisonReferences', 'PIA24926-left'],
    ]) {
      const overlay = $(id);
      overlay.replaceChildren();
      overlay.hidden =
        !tips ||
        !$('showReferences').checked ||
        (id === 'comparisonReferences' && currentObservationImage !== 'PIA24926-right');
      if (overlay.hidden) continue;
      for (const box of imageTips[imageId].boxes) {
        const outline = document.createElement('span');
        outline.className = 'reference-box';
        Object.assign(outline.style, {
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
        });
        const label = document.createElement('span');
        label.textContent = `Ref: ${box.label}`;
        outline.append(label);
        overlay.append(outline);
      }
    }
  }
  $('showReferences').onchange = paintReferences;
  let regionMapView = null;
  function highlightRegion(selected) {
    $('deltaFrontRegion').classList.toggle('selected-region', selected);
    $('deltaFrontRegion').setAttribute('aria-pressed', String(selected));
  }
  function beginRegionViewing() {
    if (!regionMapView) regionMapView = captureMapView();
    highlightRegion(true);
    $('photoMarker').classList.remove('selected-location');
    $('photoMarker').setAttribute('aria-pressed', 'false');
  }
  // Viewer state is stored in mission.js; this file only reads/commits per-node, per-image records.
  function activeImageRecord() {
    return observationState(currentObservationNode).images[currentObservationImage];
  }
  function observationLogMetadata(nodeId, imageId, evidence = null) {
    const node = OBSERVATION_DATA.nodes[nodeId];
    const image = OBSERVATION_DATA.images[imageId];
    return {
      nodeId,
      taskId: node.taskId,
      imageId,
      capturedAt: image.captured,
      sourceId: image.sourceId,
      evidence,
    };
  }
  function canConfirmNode(nodeId) {
    if (!observationEvidence(nodeId)) return false;
    return nodeId !== 'P1' || (state.phase === 'outbound' && near());
  }
  function refreshObservationControls() {
    const node = observationState(currentObservationNode);
    $('saveObservation').disabled = false;
    $('confirmObservation').checked = node.done;
    $('confirmObservation').disabled = !canConfirmNode(currentObservationNode);
    $('skinnerTaskStatus').textContent =
      `${observationState('N2').done ? 'Complete' : 'Not completed'} · Regional materials · Preview anytime`;
    $('wildcatTaskStatus').textContent =
      `${observationState('N3').done ? 'Complete' : 'Not completed'} · Regional materials · Preview anytime`;
    const record = activeImageRecord();
    $('observationTimes').textContent =
      `Your draft updated: ${record.draftUpdatedAt ? new Date(record.draftUpdatedAt).toLocaleString('en-GB') : 'not yet'} · Observation saved: ${record.saved?.savedAt ? new Date(record.saved.savedAt).toLocaleString('en-GB') : 'not yet'} · Task confirmed: ${node.completedAt ? new Date(node.completedAt).toLocaleString('en-GB') : 'not yet'}. These are user operation times, separate from the image capture date above.`;
  }
  function paintMark() {
    const m = activeImageRecord().mark;
    $('annotation').hidden = !m;
    if (m) {
      $('annotation').style.left = `${m.x * 100}%`;
      $('annotation').style.top = `${m.y * 100}%`;
    }
  }
  function showObservationImage(imageId) {
    const node = OBSERVATION_DATA.nodes[currentObservationNode];
    if (!node.images.includes(imageId)) return;
    currentObservationImage = imageId;
    observationState(node.id).activeImageId = imageId;
    const image = OBSERVATION_DATA.images[imageId];
    $('observationImage').value = imageId;
    $('observationPhoto').src = image.src;
    $('observationPhoto').alt = image.caption;
    $('imageCaption').textContent = image.caption;
    $('photoCanvas').setAttribute('aria-label', `Mark a feature in ${image.title}`);
    $('photoMetadata').replaceChildren();
    const fields = [
      ['Image ID', image.id],
      ['Captured', image.captured || 'Not established'],
      ['Instrument', `${image.mission} / ${image.instrument}`],
      ['Color / frame', `${image.color}. Full published frame; no crop.`],
      [
        'Camera / target',
        node.id === 'P1'
          ? 'Camera: Octavia E. Butler Landing. Target: delta remnant about 2.3 km west, not at the camera point.'
          : `${node.name} target identity is verified in official material; absolute camera and target coordinates remain unresolved.`,
      ],
      [
        'Direction',
        node.id === 'P1'
          ? 'West (caption); exact azimuth unverified'
          : 'Not established in the adopted caption',
      ],
    ];
    fields.forEach(([title, value]) => {
      const row = document.createElement('div'),
        dt = document.createElement('dt'),
        dd = document.createElement('dd');
      dt.textContent = title;
      dd.textContent = value;
      row.append(dt, dd);
      $('photoMetadata').append(row);
    });
    $('imageCredit').replaceChildren();
    const credit = document.createTextNode(
      `${image.credit} · Published ${image.published} · `,
    );
    const link = document.createElement('a');
    link.href = image.page;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = 'Official source ↗';
    $('imageCredit').append(credit, link);
    $('landingContext').hidden = node.id !== 'P1';
    $('regionalNodeContext').hidden = node.id === 'P1';
    $('comparisonContext').hidden = node.id !== 'N3' || imageId !== 'PIA24926-right';
    document
      .querySelector('.photo-layout')
      .classList.toggle('comparing', node.id === 'N3' && imageId === 'PIA24926-right');
    $('observation').value = activeImageRecord().draft;
    paintReferences();
    $('observationStatus').textContent =
      node.id === 'P1' && !canConfirmNode('P1')
        ? 'Preview and draft saving are available now. To confirm P1, save a marked observation and reach its simulated range during an outbound journey.'
        : 'Each node and image keeps its own draft and saved evidence. Save your observation, then confirm the task yourself.';
    paintMark();
    refreshObservationControls();
    save();
    if ($('photoDialog').open) $('photoDialog').scrollTop = 0;
  }
  function openObservationNode(nodeId) {
    const node = OBSERVATION_DATA.nodes[nodeId];
    if (!node || pickingNote || drawingCustom) return;
    ensureLayer(nodeId === 'P1' ? 'imagery' : 'deltaFront');
    $('photoMarker').classList.toggle('selected-location', nodeId === 'P1');
    $('photoMarker').setAttribute('aria-pressed', String(nodeId === 'P1'));
    if (OBSERVATION_DATA.regions.deltaFront.nodeIds.includes(nodeId))
      beginRegionViewing();
    else highlightRegion(false);
    if (active() && !state.paused) {
      state.paused = true;
      log(
        'control',
        `Journey paused to view observation node ${nodeId}`,
        getSimulatedPosition(),
        observationLogMetadata(nodeId, observationState(nodeId).activeImageId),
      );
    }
    if ($('regionDialog').open) $('regionDialog').close();
    currentObservationNode = nodeId;
    $('showReferences').checked = false;
    $('observationNodeId').textContent = `${nodeId} / ${node.taskId}`;
    $('photoTitle').textContent = node.name;
    $('observationTaskPrompt').textContent = node.instructions;
    $('photoLayerControl').dataset.layerControl =
      nodeId === 'P1' ? 'imagery' : 'deltaFront';
    $('photoLayerControlLabel').textContent =
      nodeId === 'P1' ? 'Landing-site imagery · P1' : 'Delta-front observation area';
    document
      .querySelectorAll('.observation-tabs [data-observation-node]')
      .forEach((button) =>
        button.classList.toggle('active', button.dataset.observationNode === nodeId),
      );
    $('observationImage').replaceChildren();
    node.images.forEach((imageId) => {
      const option = document.createElement('option');
      option.value = imageId;
      option.textContent = OBSERVATION_DATA.images[imageId].title;
      $('observationImage').append(option);
    });
    showObservationImage(observationState(nodeId).activeImageId || node.defaultImageId);
    render();
    if (!$('photoDialog').open) $('photoDialog').showModal();
    render();
    $('photoDialog').scrollTop = 0;
  }
  function openPhoto(preview = false) {
    if (preview !== true && (!state.layers.imagery || (state.mode === 'near' && !near())))
      return;
    openObservationNode('P1');
  }
  $('photoMarker').onclick = openPhoto;
  $('photoMarker').onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPhoto();
    }
  };
  $('closePhoto').onclick = () => $('photoDialog').close();
  $('observationImage').onchange = (e) => showObservationImage(e.target.value);
  document
    .querySelectorAll('[data-observation-node]')
    .forEach(
      (button) =>
        (button.onclick = () => openObservationNode(button.dataset.observationNode)),
    );
  function saveDraftRecord() {
    const record = activeImageRecord();
    record.draft = $('observation').value;
    record.draftUpdatedAt = new Date().toISOString();
    save();
    refreshObservationControls();
  }
  function mark(x, y) {
    if (!$('observationPhoto').complete || !$('observationPhoto').naturalWidth) return;
    activeImageRecord().mark = {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      imageId: currentObservationImage,
    };
    saveDraftRecord();
    paintMark();
  }
  $('photoCanvas').onclick = (e) => {
    const box = $('photoCanvas').getBoundingClientRect();
    mark((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
  };
  $('photoCanvas').onkeydown = (e) => {
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key)
    )
      return;
    e.preventDefault();
    const m = activeImageRecord().mark || { x: 0.5, y: 0.5 };
    mark(
      m.x + (e.key === 'ArrowRight' ? 0.02 : e.key === 'ArrowLeft' ? -0.02 : 0),
      m.y + (e.key === 'ArrowDown' ? 0.02 : e.key === 'ArrowUp' ? -0.02 : 0),
    );
  };
  $('observation').oninput = saveDraftRecord;
  $('saveDraft').onclick = () => {
    saveDraftRecord();
    const record = activeImageRecord();
    log(
      'observation-draft',
      `${OBSERVATION_DATA.nodes[currentObservationNode].name}: unfinished draft saved`,
      getSimulatedPosition(),
      observationLogMetadata(currentObservationNode, currentObservationImage, {
        mark: record.mark,
        text: record.draft,
      }),
    );
    $('observationStatus').textContent =
      'Unfinished draft saved for this node and image. Task completion has not changed.';
  };
  $('saveObservation').onclick = () => {
    saveDraftRecord();
    const record = activeImageRecord();
    const nodeId = currentObservationNode;
    if (
      !$('observationPhoto').complete ||
      !$('observationPhoto').naturalWidth ||
      (nodeId === 'N3' &&
        (!$('comparisonPhoto').complete || !$('comparisonPhoto').naturalWidth))
    ) {
      $('observationStatus').textContent =
        'Wait for the observation images to finish loading. Your draft is preserved.';
      return;
    }
    if (!record.draft.trim() || (nodeId !== 'N3' && !record.mark)) {
      $('observationStatus').textContent =
        nodeId === 'N3'
          ? 'Enter one visible difference.'
          : 'Mark a feature and enter one observation sentence. Your unfinished draft is preserved.';
      return;
    }
    if (nodeId === 'N3' && currentObservationImage !== 'PIA24926-right') {
      $('observationStatus').textContent =
        'Your draft is saved. Select the Wildcat WATSON close-up to compare it with the matching Skinner close-up before saving the task evidence.';
      return;
    }
    const capturedAt = OBSERVATION_DATA.images[currentObservationImage].captured;
    record.saved = {
      nodeId,
      taskId: OBSERVATION_DATA.nodes[nodeId].taskId,
      imageId: currentObservationImage,
      mark: record.mark ? { ...record.mark } : null,
      text: record.draft.trim(),
      capturedAt,
      savedAt: new Date().toISOString(),
      comparedImageIds: nodeId === 'N3' ? ['PIA24926-left', 'PIA24926-right'] : [],
    };
    observationState(nodeId).done = false;
    observationState(nodeId).completedAt = null;
    log(
      'observation',
      `${OBSERVATION_DATA.nodes[nodeId].name}: ${record.saved.text}`,
      getSimulatedPosition(),
      observationLogMetadata(nodeId, currentObservationImage, record.saved),
    );
    render();
    $('observationStatus').textContent =
      'Observation saved. Confirm this node’s task using the checkbox when eligible.';
  };
  function setNodeCompletion(nodeId, checked) {
    if (checked && !canConfirmNode(nodeId)) return;
    const node = observationState(nodeId);
    node.done = checked;
    node.completedAt = checked ? new Date().toISOString() : null;
    const evidence = observationEvidence(nodeId);
    const imageId = evidence?.imageId || OBSERVATION_DATA.nodes[nodeId].defaultImageId;
    log(
      'task',
      `${checked ? 'Confirmed complete' : 'Marked not completed'}: ${OBSERVATION_DATA.nodes[nodeId].task}`,
      getSimulatedPosition(),
      observationLogMetadata(nodeId, imageId, evidence),
    );
    render();
  }
  $('confirmObservation').onchange = (e) =>
    setNodeCompletion(currentObservationNode, e.target.checked);
  function openRegion() {
    if (pickingNote || drawingCustom) return;
    ensureLayer('deltaFront');
    beginRegionViewing();
    if ($('photoDialog').open) $('photoDialog').close();
    if (active() && !state.paused) {
      state.paused = true;
      log('control', 'Journey paused to view delta-front regional materials');
      render();
    }
    if (!$('regionDialog').open) $('regionDialog').showModal();
  }
  $('openRegion').onclick = openRegion;
  $('regionFromPhoto').onclick = openRegion;
  $('closeRegion').onclick = () => $('regionDialog').close();
  $('deltaFrontArea').setAttribute(
    'points',
    OBSERVATION_DATA.regions.deltaFront.outline.map((point) => point.join(',')).join(' '),
  );
  $('deltaFrontRegion').onclick = (event) => {
    if (!state.layers.deltaFront || pickingNote || drawingCustom) return;
    event.stopPropagation();
    openRegion();
  };
  $('deltaFrontRegion').onkeydown = (event) => {
    if (!state.layers.deltaFront) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openRegion();
    }
  };
  for (const id of ['photoDialog', 'regionDialog'])
    $(id).addEventListener('close', () => {
      render();
      if (regionMapView && !$('photoDialog').open && !$('regionDialog').open) {
        const previousView = regionMapView;
        regionMapView = null;
        restoreMapView(previousView);
      }
    });

  return {
    paintMark,
    refreshObservationControls,
    canConfirmNode,
    openPhoto,
    setNodeCompletion,
  };
}
