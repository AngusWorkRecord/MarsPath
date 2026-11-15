'use strict';
const routes = {
  custom: { name: 'Custom Route', risk: null, stops: 0, points: '' },
  balanced: {
    name: 'Balanced exploration',
    risk: 25,
    stops: 2,
    points: '250,580 300,510 355,350 470,345 610,412 690,480',
  },
  shortest: {
    name: 'Shortest path',
    risk: 65,
    stops: 1,
    points: '250,580 330,520 455,465 570,435 690,480',
  },
  science: {
    name: 'Science priority',
    risk: 48,
    stops: 3,
    points: '250,580 300,475 355,350 470,345 610,412 510,565 690,480',
  },
};
const $ = (id) => document.getElementById(id),
  KEY = 'marspath-mission-v1';
// These are schematic access anchors, not georeferenced camera coordinates.
const photoLocations = [{ id: 'P1', markerId: 'photoMarker', x: 600, y: 330 }];
const nearbyRadius = 120; // Schematic map units only; never converted to real meters.
const sidebarSections = [...document.querySelectorAll('#taskSidebar > .sidebar-section')];
function openSidebarSection(selected) {
  sidebarSections.forEach((section) => {
    section.open = section === selected;
  });
}
sidebarSections.forEach((section) => {
  section.querySelector(':scope > summary').addEventListener('click', (event) => {
    event.preventDefault();
    openSidebarSection(section.open ? null : section);
  });
});
const initial = () => ({
  version: 1,
  route: 'balanced',
  phase: 'planning',
  progress: 0,
  paused: false,
  extra: false,
  done: false,
  mark: null,
  draft: '',
  environment: '',
  observation: null,
  records: [],
  mapNotes: [],
  notePosition: null,
  journeyStart: 0,
  layers: {
    terrain: true,
    hazards: true,
    science: true,
    route: true,
    imagery: true,
    customMap: false,
    notes: true,
  },
  mode: 'all',
  customPoints: [],
  customConfirmed: false,
  customReached: [],
  customCompleted: [],
});
let state = initial(),
  storageOK = true;
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved) {
    if (
      saved.version !== 1 ||
      !routes[saved.route] ||
      !['planning', 'outbound', 'returning', 'finished'].includes(saved.phase) ||
      !Number.isFinite(saved.progress) ||
      !Array.isArray(saved.records)
    )
      throw Error('Invalid saved mission');
    state = { ...state, ...saved, layers: { ...state.layers, ...saved.layers } };
    state.progress = Math.max(0, Math.min(last(), state.progress));
  }
} catch (e) {
  $('persistStatus').textContent =
    'Unable to read the saved journey. A new journey is shown.';
}
function points() {
  if (state.route === 'custom') {
    const coords = state.customPoints.map((p) => [p.x, p.y]);
    if (coords.length > 1) return coords;
    const start = coords[0] || [250, 580];
    return [start, start];
  }
  return routes[state.route].points.split(' ').map((p) => p.split(',').map(Number));
}
function last() {
  return points().length - 1;
}
function active() {
  return state.phase === 'outbound' || state.phase === 'returning';
}
function isPhotoNearby(photo) {
  const pos = getSimulatedPosition();
  return Math.hypot(pos.x - photo.x, pos.y - photo.y) <= nearbyRadius;
}
function near() {
  return isPhotoNearby(photoLocations[0]);
}
function environmentTaskDone() {
  return state.records
    .slice(state.journeyStart)
    .some((record) => record.kind === 'environment');
}
function getSimulatedPosition() {
  const p = points(),
    i = Math.min(Math.floor(state.progress), p.length - 2),
    t = state.progress - i;
  return {
    x: p[i][0] + (p[i + 1][0] - p[i][0]) * t,
    y: p[i][1] + (p[i + 1][1] - p[i][1]) * t,
  };
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOK = true;
  } catch (e) {
    storageOK = false;
    $('persistStatus').textContent =
      'Browser storage is unavailable. Keep this page open; reloading will lose this journey.';
  }
}
function log(kind, content, position = getSimulatedPosition()) {
  state.records.push({
    kind,
    content,
    phase: state.phase,
    time: new Date().toISOString(),
    route: state.route,
    progress: state.progress,
    position,
  });
  save();
  renderLogs();
}
function positionText(p = state.progress) {
  return `Simulated segment ${Math.min(Math.floor(p) + 1, last())}/${last()} · Route progress ${Math.round((p / last()) * 100)}%`;
}
function renderLogs() {
  const filter = $('logFilter').value;
  const rows = state.records.filter((r) => filter === 'all' || r.phase === filter);
  $('records').replaceChildren();
  if (!rows.length) {
    const li = document.createElement('li');
    li.textContent = 'No records yet';
    $('records').append(li);
  }
  for (const r of rows.slice().reverse()) {
    const li = document.createElement('li'),
      small = document.createElement('small'),
      text = document.createElement('p');
    const phaseLabel =
      r.phase === 'planning'
        ? 'Map note'
        : r.phase === 'returning'
          ? 'Return'
          : 'Outbound';
    const positionLabel =
      r.kind === 'environment' ? 'Selected map position' : 'Simulated position';
    small.textContent = `${new Date(r.time).toLocaleString('en-GB')} · ${phaseLabel} · ${routes[r.route].name} · Segment progress ${r.progress.toFixed(2)} · ${positionLabel} (${r.position.x.toFixed(0)}, ${r.position.y.toFixed(0)})`;
    text.textContent = r.content;
    li.append(small, text);
    $('records').append(li);
  }
}
function render() {
  const r = routes[state.route],
    planning = state.phase === 'planning';
  $('routeName').textContent = r.name;
  $('missionRoute').value = state.route;
  $('missionRoute').disabled = !planning;
  $('mainTask').disabled = !planning;
  $('extraTask').checked = state.extra;
  $('extraTask').disabled = !planning;
  $('distance').textContent = last() + ' segments';
  if (state.route === 'custom')
    $('distance').textContent = Math.max(0, state.customPoints.length - 1) + ' segments';
  $('duration').textContent = {
    planning: 'Ready',
    outbound: state.paused ? 'Outbound paused' : 'Outbound',
    returning: state.paused ? 'Return paused' : 'Returning',
    finished: 'Returned',
  }[state.phase];
  $('risk').textContent = state.route === 'custom' ? 'Not assessed' : r.risk + ' / 100';
  $('stops').textContent =
    state.route === 'custom'
      ? state.customPoints.filter((p) => p.hasTask).length + ' tasks'
      : r.stops + ' SIM';
  const customRoutePoints = state.customPoints.map((p) => `${p.x},${p.y}`).join(' ');
  for (const id of ['routeLine', 'routeGlow']) $(id).setAttribute('points', r.points);
  for (const id of ['customRouteLine', 'customRouteGlow'])
    $(id).setAttribute('points', customRoutePoints);
  document.querySelectorAll('.route-choice').forEach((b) => {
    b.classList.toggle('active', b.dataset.route === state.route);
    b.disabled = !planning;
  });
  const pos = getSimulatedPosition();
  $('walker').setAttribute('transform', `translate(${pos.x} ${pos.y})`);
  $('start').hidden = !planning;
  $('start').disabled = state.route === 'custom' && !state.customConfirmed;
  $('pause').hidden = !active();
  $('pause').textContent = state.paused ? 'Resume' : 'Pause';
  $('pause').disabled = state.phase === 'outbound' && state.progress === last();
  $('newJourney').hidden = state.phase !== 'finished';
  $('return').hidden = state.phase !== 'outbound';
  $('return').disabled = state.phase !== 'outbound';
  $('complete').checked = state.done;
  $('complete').disabled = state.phase !== 'outbound' || !state.observation;
  $('objective').textContent = planning
    ? 'Confirm your route and tasks, then start the journey'
    : state.phase === 'finished'
      ? `Back at the starting point · ${state.done ? 'Observation complete' : 'Observation not completed'}`
      : state.phase === 'returning'
        ? 'Retrace your route to the simulated landing point'
        : state.done
          ? state.extra && !environmentTaskDone()
            ? 'Optional task: record an environmental change, or return now.'
            : 'Observation complete. Continue exploring or return now.'
          : near()
            ? 'Pause and open P1. Mark the ancient delta and save your observation'
            : 'Find P1 imagery along your route, or return at any time.';
  $('position').textContent = positionText();
  $('taskHelp').textContent = state.observation
    ? state.phase === 'outbound'
      ? 'Observation saved. Check the box to confirm completion.'
      : `Observation saved · ${state.done ? 'Completed' : 'Not completed'}.`
    : state.phase === 'finished'
      ? 'This journey ended with the delta observation not completed.'
      : 'Near P1, mark the feature and save notes, then check the box to complete the task. You may return without completing it.';
  $('markerMode').value = state.mode;
  $('markerMode').disabled = false;
  for (const [k, v] of Object.entries(state.layers)) {
    $(k).checked = v;
    if (k === 'terrain')
      document.querySelector('.map-image').style.opacity = v ? '1' : '.1';
    else
      $(
        {
          hazards: 'hazardLayer',
          science: 'scienceLayer',
          route: 'routeLayer',
          imagery: 'imageryLayer',
          customMap: 'customMapLayer',
          notes: 'fieldNoteLayer',
        }[k],
      ).style.display = v ? '' : 'none';
  }
  photoLocations.forEach((photo) => {
    $(photo.markerId).setAttribute('transform', `translate(${photo.x} ${photo.y})`);
    $(photo.markerId).style.display =
      state.mode === 'all' || isPhotoNearby(photo) ? '' : 'none';
  });
  const nearbyCount = photoLocations.filter(isPhotoNearby).length;
  $('nearbySummary').textContent =
    `Nearby: ${nearbyCount}/${photoLocations.length}. Simulated radius: ${nearbyRadius} map units; not real meters.`;
  $('saveEnvironment').disabled = !state.notePosition;
  $('environment').disabled = false;
  $('saveObservation').disabled = !(state.phase === 'outbound' && near() && state.paused);
  renderCustomMission();
  updateCurrentObjective();
  if (storageOK)
    $('persistStatus').textContent =
      'Saved in this browser · Reload to restore; no movement while away';
}
function changeRoute(route) {
  if (state.phase !== 'planning') return;
  const changed = state.route !== route;
  state.route = route;
  drawingCustom = false;
  $('mapWrap').classList.remove('drawing-custom');
  if (changed) resetWaypointForm();
  save();
  render();
  renderCustomEditor();
  if (route === 'custom') {
    state.layers = {
      ...state.layers,
      terrain: true,
      hazards: false,
      science: false,
      route: false,
      customMap: true,
    };
    save();
    render();
    openSidebarSection($('customRouteEditor').closest('.mission-panel'));
    $('customRouteEditor').open = true;
    $('customRouteEditor').scrollIntoView({ block: 'start', behavior: 'instant' });
  } else {
    state.layers.route = true;
    save();
    render();
  }
}
document
  .querySelectorAll('.route-choice')
  .forEach((b) => (b.onclick = () => changeRoute(b.dataset.route)));
$('missionRoute').onchange = (e) => changeRoute(e.target.value);
$('extraTask').onchange = (e) => {
  state.extra = e.target.checked;
  save();
};
for (const k of Object.keys(state.layers))
  $(k).onchange = (e) => {
    state.layers[k] = e.target.checked;
    save();
    render();
  };
$('markerMode').onchange = (e) => {
  state.mode = e.target.value;
  save();
  render();
};
$('start').onclick = () => {
  if (state.phase !== 'planning' || (state.route === 'custom' && !state.customConfirmed))
    return;
  drawingCustom = false;
  state.phase = 'outbound';
  log(
    'start',
    (state.route === 'custom'
      ? 'Journey started: custom route'
      : 'Journey started: identify the ancient delta') +
      (state.extra ? '; optional environmental-change note' : ''),
  );
  render();
  if (state.route === 'custom') reachCustomWaypoint(0);
  renderCustomEditor();
};
$('newJourney').onclick = () => {
  if (state.phase !== 'finished') return;
  state = {
    ...initial(),
    route: state.route,
    layers: { ...state.layers },
    records: state.records,
    mapNotes: state.mapNotes,
    journeyStart: state.records.length,
    customPoints: state.customPoints,
    customConfirmed: state.customConfirmed,
    mode: state.mode,
  };
  $('environment').value = '';
  $('noteStatus').textContent = '';
  $('observation').value = '';
  $('logFilter').value = 'all';
  paintMark();
  renderNotePosition();
  save();
  render();
  renderLogs();
  renderCustomEditor();
};
$('pause').onclick = () => {
  if (!active()) return;
  state.paused = !state.paused;
  log('control', state.paused ? 'Journey paused' : 'Journey resumed');
  render();
};
$('quickPause').onclick = () => $('pause').click();
$('quickReturn').onclick = () => $('return').click();
$('return').onclick = () => {
  if (state.phase !== 'outbound') return;
  state.phase = 'returning';
  state.paused = false;
  log(
    'return',
    'Return started at the current simulated position: retracing only the traveled segments. Unfinished tasks are retained.',
  );
  render();
};
$('complete').onchange = (e) => {
  if (!state.observation || state.phase !== 'outbound') return;
  state.done = e.target.checked;
  log(
    'task',
    state.done
      ? 'Confirmed by explorer: delta observation complete'
      : 'Task completion unchecked',
  );
  render();
};
$('environment').value = state.environment;
$('environment').oninput = (e) => {
  state.environment = e.target.value;
  save();
};
$('saveEnvironment').onclick = () => {
  const text = $('environment').value.trim();
  if (!state.notePosition || !text) {
    $('noteStatus').textContent = 'Select a map point and enter your observation first.';
    return;
  }
  state.mapNotes.push({
    position: { ...state.notePosition },
    content: text,
    time: new Date().toISOString(),
    phase: state.phase,
    route: state.route,
    progress: state.progress,
    simulationPosition: getSimulatedPosition(),
  });
  log('environment', text, { ...state.notePosition });
  state.environment = '';
  $('environment').value = '';
  save();
  $('noteStatus').textContent =
    'Field note saved. Click its N marker on the map to read it again.';
  renderMapNotes();
  render();
};
$('logFilter').onchange = renderLogs;
function paintMark() {
  const m = state.mark;
  $('annotation').hidden = !m;
  if (m) {
    $('annotation').style.left = m.x * 100 + '%';
    $('annotation').style.top = m.y * 100 + '%';
  }
}
function openPhoto(preview = false) {
  if (pickingNote || drawingCustom) return;
  if (preview !== true && (!state.layers.imagery || (state.mode === 'near' && !near())))
    return;
  if (active() && !state.paused) {
    state.paused = true;
    log('control', 'Journey paused automatically to view imagery');
  }
  $('observation').value = state.draft;
  paintMark();
  render();
  $('observationStatus').textContent =
    state.phase === 'planning'
      ? 'Preview: mark the photo and keep a draft. Save the observation after reaching this waypoint.'
      : state.observation
        ? 'Observation saved. You can review or edit it.'
        : 'Mark the photo, add notes and save your observation.';
  $('photoDialog').showModal();
}
$('photoMarker').onclick = openPhoto;
$('photoMarker').onkeydown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openPhoto();
  }
};
$('closePhoto').onclick = () => $('photoDialog').close();
function mark(x, y) {
  state.mark = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  save();
  paintMark();
}
$('photoCanvas').onclick = (e) => {
  const box = $('photoCanvas').getBoundingClientRect();
  mark((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height);
};
$('photoCanvas').onkeydown = (e) => {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key))
    return;
  e.preventDefault();
  const m = state.mark || { x: 0.5, y: 0.5 };
  mark(
    m.x + (e.key === 'ArrowRight' ? 0.02 : e.key === 'ArrowLeft' ? -0.02 : 0),
    m.y + (e.key === 'ArrowDown' ? 0.02 : e.key === 'ArrowUp' ? -0.02 : 0),
  );
};
$('observation').oninput = (e) => {
  state.draft = e.target.value;
  save();
};
$('saveObservation').onclick = () => {
  if (state.phase !== 'outbound' || !near() || !state.paused) return;
  if (!state.mark || !state.draft.trim()) {
    $('observationStatus').textContent =
      'Mark a feature in the photo and enter your notes first.';
    return;
  }
  state.observation = {
    mark: { ...state.mark },
    text: state.draft.trim(),
    time: new Date().toISOString(),
  };
  state.done = false;
  log(
    'observation',
    `P1 ancient delta observation: ${state.observation.text} (photo marker ${Math.round(state.mark.x * 100)}%, ${Math.round(state.mark.y * 100)}%)`,
  );
  $('observationStatus').textContent =
    'Observation saved. Close the photo and check the task-completion box.';
  render();
};
document.querySelectorAll('#scienceLayer .marker').forEach((m, i) => {
  m.querySelector('text').textContent = `S${i + 1} SIM`;
  m.onclick = () => {
    if (pickingNote || drawingCustom) return;
    const tip = $('mapTooltip');
    tip.hidden = false;
    tip.textContent = `S${i + 1} simulated target: ${m.dataset.name}. No real imagery is available.`;
  };
});
$('mapWrap').onclick = (e) => {
  if (!pickingNote && !drawingCustom) return;
  if (!e.target.closest('svg')) return;
  const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(
    $('mapSvg').getScreenCTM().inverse(),
  );
  const selectedPosition = {
    x: Math.max(0, Math.min(1000, point.x)),
    y: Math.max(0, Math.min(773, point.y)),
  };
  if (drawingCustom) {
    addCustomPoint(selectedPosition);
    return;
  }
  if (movingNote) {
    movingNote.position = selectedPosition;
    movingNote.updatedAt = new Date().toISOString();
    movingNote = null;
    state.notePosition = null;
    $('noteStatus').textContent = 'Marker moved and saved.';
  } else state.notePosition = selectedPosition;
  pickingNote = false;
  $('mapWrap').classList.remove('picking-note');
  renderNoteTools();
  if (state.notePosition) {
    openSidebarSection($('environment').closest('.sidebar-section'));
    $('mapNoteMode').textContent = 'Point selected · Write in Field Notes';
    $('environment').focus({ preventScroll: true });
  }
  save();
  renderNotePosition();
  render();
  if (!e.target.closest('.marker')) $('mapTooltip').hidden = true;
};
let pickingNote = false;
let movingNote = null;
let selectedNote = null;
const svgNS = 'http://www.w3.org/2000/svg';
const noteLayer = document.createElementNS(svgNS, 'g');
noteLayer.id = 'fieldNoteLayer';
$('mapSvg').append(noteLayer);
function renderNotePosition() {
  const p = state.notePosition;
  $('notePosition').textContent = p
    ? `Selected map point (${p.x.toFixed(0)}, ${p.y.toFixed(0)}) · schematic coordinates, not geographic coordinates`
    : 'Select any map point, then write and save a field note.';
  renderMapNotes();
}
function renderMapNotes() {
  noteLayer.replaceChildren();
  const draw = (position, label, savedNote) => {
    const marker = document.createElementNS(svgNS, 'g');
    marker.setAttribute('transform', `translate(${position.x} ${position.y})`);
    marker.classList.add('marker', 'field-note-marker');
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', '23');
    circle.setAttribute('fill', savedNote ? '#345eaa' : '#423c24');
    circle.setAttribute('stroke', '#fff0a5');
    circle.setAttribute('stroke-width', '3');
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('y', '6');
    text.setAttribute('style', 'font-size:16px');
    text.textContent = label;
    marker.append(circle, text);
    if (savedNote) {
      marker.setAttribute('role', 'button');
      marker.setAttribute('tabindex', '0');
      marker.setAttribute('aria-label', `Open field note ${label}`);
      const open = () => {
        selectedNote = savedNote;
        $('fieldNoteTitle').textContent = `Field note ${label}`;
        $('fieldNoteMeta').textContent =
          `${new Date(savedNote.time).toLocaleString('en-GB')} · Map point (${position.x.toFixed(0)}, ${position.y.toFixed(0)}) · Schematic coordinates`;
        $('fieldNoteContent').textContent = savedNote.content;
        $('editFieldNote').value = savedNote.content;
        $('fieldNoteFeedback').textContent = '';
        $('fieldNoteDialog').showModal();
      };
      marker.onclick = (e) => {
        if (pickingNote || drawingCustom) return;
        e.stopPropagation();
        open();
      };
      marker.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      };
    } else marker.style.pointerEvents = 'none';
    noteLayer.append(marker);
  };
  if (state.notePosition) draw(state.notePosition, '+', null);
  state.mapNotes.forEach((note, i) => draw(note.position, `N${i + 1}`, note));
  updateMarkerSizes();
}
function renderNoteTools() {
  $('pickNotePosition').setAttribute('aria-pressed', String(pickingNote));
  $('cancelNotePosition').disabled = !pickingNote;
  $('cancelNotePosition').textContent = movingNote ? 'Cancel moving' : 'Cancel adding';
  $('mapNoteMode').textContent = pickingNote
    ? movingNote
      ? 'Click a new location'
      : 'Click the map to place a note'
    : 'Browse map';
}
$('pickNotePosition').onclick = () => {
  drawingCustom = false;
  $('mapWrap').classList.remove('drawing-custom');
  renderCustomEditor();
  $('markerTools').open = true;
  movingNote = null;
  pickingNote = true;
  state.layers.notes = true;
  save();
  render();
  renderNoteTools();
  $('mapWrap').classList.add('picking-note');
  $('notePosition').textContent = 'Click anywhere on the map to choose a point.';
  $('mapWrap').scrollIntoView({ block: 'center', behavior: 'instant' });
};
$('cancelNotePosition').onclick = () => {
  pickingNote = false;
  movingNote = null;
  $('mapWrap').classList.remove('picking-note');
  renderNoteTools();
  renderNotePosition();
};
$('closeFieldNote').onclick = () => $('fieldNoteDialog').close();
$('updateFieldNote').onclick = () => {
  const content = $('editFieldNote').value.trim();
  if (!selectedNote || !content) {
    $('fieldNoteFeedback').textContent = 'Enter an observation before saving.';
    return;
  }
  selectedNote.content = content;
  selectedNote.updatedAt = new Date().toISOString();
  $('fieldNoteContent').textContent = content;
  $('fieldNoteFeedback').textContent = 'Changes saved.';
  save();
};
$('moveFieldNote').onclick = () => {
  drawingCustom = false;
  $('mapWrap').classList.remove('drawing-custom');
  renderCustomEditor();
  $('markerTools').open = true;
  movingNote = selectedNote;
  pickingNote = true;
  state.layers.notes = true;
  save();
  render();
  renderNoteTools();
  $('fieldNoteDialog').close();
  $('mapWrap').classList.add('picking-note');
  $('notePosition').textContent = 'Moving marker: click its new position on the map.';
  $('mapWrap').scrollIntoView({ block: 'center' });
};
$('deleteFieldNote').onclick = () => {
  state.mapNotes = state.mapNotes.filter((note) => note !== selectedNote);
  selectedNote = null;
  state.notePosition = null;
  $('fieldNoteDialog').close();
  save();
  renderNotePosition();
  render();
  $('noteStatus').textContent =
    'Marker deleted. Historical mission log entries are retained.';
};
let zoom = 1;
let panX = 0;
let panY = 0;
function updateMarkerSizes() {
  const matrix = $('mapSvg').getScreenCTM();
  if (!matrix) return;
  const screenScale = Math.min(Math.abs(matrix.a), Math.abs(matrix.d));
  document
    .querySelectorAll('#mapSvg .marker, #mapSvg .home-marker, #walker')
    .forEach((marker) => {
      let glyph = marker.querySelector(':scope > .marker-glyph');
      if (!glyph) {
        glyph = document.createElementNS(svgNS, 'g');
        glyph.classList.add('marker-glyph');
        glyph.append(...marker.childNodes);
        marker.append(glyph);
      }
      // Keep the geographic anchor unchanged; at 4× zoom the visible glyph is ~66% of its original screen size.
      glyph.setAttribute('transform', `scale(${Math.pow(zoom, -1.3)})`);
      if (marker.classList.contains('marker') && marker.style.pointerEvents !== 'none') {
        let hit = marker.querySelector(':scope > .marker-hit');
        if (!hit) {
          hit = document.createElementNS(svgNS, 'circle');
          hit.classList.add('marker-hit');
          hit.setAttribute('fill', 'transparent');
          hit.setAttribute('pointer-events', 'all');
          marker.prepend(hit);
        }
        hit.setAttribute('r', String(24 / screenScale));
      }
    });
}
function applyMapView() {
  const viewport = $('mapWrap');
  panX = Math.max(viewport.clientWidth * (1 - zoom), Math.min(0, panX));
  panY = Math.max(viewport.clientHeight * (1 - zoom), Math.min(0, panY));
  $('mapScene').style.width = `${zoom * 100}%`;
  $('mapScene').style.height = `${zoom * 100}%`;
  $('mapScene').style.transform = `translate(${panX}px, ${panY}px)`;
  $('zoomLevel').textContent = `${Math.round(zoom * 100)}%`;
  $('zoomOut').disabled = zoom === 1;
  $('zoomIn').disabled = zoom === 4;
  const lineScale = Math.pow(zoom, -1.3);
  for (const id of ['routeLine', 'customRouteLine']) {
    $(id).style.strokeWidth = `${5 * lineScale}`;
    $(id).style.strokeDasharray = `${13 * lineScale} ${8 * lineScale}`;
  }
  for (const id of ['routeGlow', 'customRouteGlow'])
    $(id).style.strokeWidth = `${13 * lineScale}`;
  updateMarkerSizes();
}
function setZoom(
  value,
  anchorX = $('mapWrap').clientWidth / 2,
  anchorY = $('mapWrap').clientHeight / 2,
) {
  const nextZoom = Math.max(1, Math.min(4, value));
  const ratio = nextZoom / zoom;
  panX = anchorX - (anchorX - panX) * ratio;
  panY = anchorY - (anchorY - panY) * ratio;
  zoom = nextZoom;
  applyMapView();
}
$('zoomIn').onclick = () => setZoom(zoom + 0.5);
$('zoomOut').onclick = () => setZoom(zoom - 0.5);
$('resetZoom').onclick = () => setZoom(1);
const viewport = $('mapWrap');
let drag = null;
let suppressMapClick = false;
viewport.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const bounds = viewport.getBoundingClientRect();
    const delta =
      e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport.clientHeight : 1);
    setZoom(
      zoom * Math.exp(-delta * 0.0015),
      e.clientX - bounds.left,
      e.clientY - bounds.top,
    );
  },
  { passive: false },
);
viewport.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !e.target.closest('#mapScene')) return;
  suppressMapClick = false;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, panX, panY, moved: false };
});
viewport.addEventListener('pointermove', (e) => {
  if (!drag || drag.id !== e.pointerId) return;
  const dx = e.clientX - drag.x,
    dy = e.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 5) return;
  drag.moved = true;
  suppressMapClick = true;
  viewport.setPointerCapture(e.pointerId);
  viewport.classList.add('dragging-map');
  panX = drag.panX + dx;
  panY = drag.panY + dy;
  applyMapView();
});
function endMapDrag(e) {
  if (!drag || drag.id !== e.pointerId) return;
  drag = null;
  viewport.classList.remove('dragging-map');
  if (viewport.hasPointerCapture(e.pointerId))
    viewport.releasePointerCapture(e.pointerId);
}
viewport.addEventListener('pointerup', endMapDrag);
viewport.addEventListener('pointercancel', endMapDrag);
viewport.addEventListener(
  'click',
  (e) => {
    if (!suppressMapClick) return;
    suppressMapClick = false;
    e.preventDefault();
    e.stopImmediatePropagation();
  },
  true,
);
viewport.addEventListener('dragstart', (e) => e.preventDefault());
new ResizeObserver(applyMapView).observe(viewport);
$('previewDelta').onclick = () => openPhoto(true);
$('previewEnvironment').onclick = () => $('environmentTaskDialog').showModal();
$('closeEnvironmentTask').onclick = () => $('environmentTaskDialog').close();
$('startEnvironmentTask').onclick = () => {
  $('environmentTaskDialog').close();
  $('pickNotePosition').click();
};
// Custom-route editing and waypoint tasks share the same map coordinate system.
let drawingCustom = false;
let editingWaypoint = null;
let viewedCustomTask = null;
let customMarkerSignature = '';
function customTasksDone() {
  return state.customPoints.every(
    (p, i) => !p.hasTask || state.customCompleted.includes(i),
  );
}
function updateCurrentObjective() {
  const objective = $('objective').textContent;
  if ($('activeObjective').textContent !== objective)
    $('activeObjective').textContent = objective;
  const custom = state.route === 'custom';
  const total = custom ? state.customPoints.filter((point) => point.hasTask).length : 1;
  const completed = custom ? state.customCompleted.length : Number(state.done);
  const pos = getSimulatedPosition();
  $('activePosition').textContent =
    `${routes[state.route].name} · ${$('duration').textContent} · X ${pos.x.toFixed(0)}, Y ${pos.y.toFixed(0)} (SIM) · Tasks ${completed}/${total} complete`;
  $('deltaTaskStatus').textContent =
    `P1 · ${state.done ? 'Complete' : 'Not completed'} · View details`;
  const extraDone = state.records
    .slice(state.journeyStart)
    .some((r) => r.kind === 'environment');
  $('extraTaskStatus').textContent = state.extra
    ? `Optional task · ${extraDone ? 'Complete' : 'Not completed'}`
    : 'Choose any map point · Available at any stage';
  $('quickPause').hidden = !active();
  $('quickPause').textContent = $('pause').textContent;
  $('quickPause').disabled = $('pause').disabled;
  $('quickReturn').hidden = state.phase !== 'outbound';
  $('quickReturn').disabled = $('return').disabled;
}
function renderCustomMission() {
  const custom = state.route === 'custom';
  $('customRouteEditor').hidden = !custom;
  $('customTaskGroup').hidden = !custom;
  $('previewDelta').closest('details').hidden = custom;
  $('mainTask').innerHTML = custom
    ? '<option>Optional waypoint tasks</option>'
    : '<option value="delta">Identify the ancient delta</option>';
  $('complete').parentElement.hidden = custom;
  if (custom) {
    const pending = state.customPoints.findIndex(
      (p, i) =>
        p.hasTask &&
        state.customReached.includes(i) &&
        !state.customCompleted.includes(i),
    );
    $('return').disabled = state.phase !== 'outbound';
    $('pause').disabled =
      state.phase === 'outbound' && (state.progress === last() || pending >= 0);
    $('taskHelp').textContent =
      'Enabled tasks pause on arrival. Complete a task and resume, or return now from any point. Unfinished task states are retained.';
    if (state.phase === 'planning')
      $('objective').textContent = state.customConfirmed
        ? 'Custom route confirmed. Ready to start.'
        : 'Add and confirm your custom route before departure.';
    else if (state.phase === 'outbound') {
      const next = state.customPoints.findIndex(
        (point, index) =>
          point.hasTask &&
          !state.customCompleted.includes(index) &&
          index > state.progress,
      );
      $('objective').textContent =
        pending >= 0
          ? `Complete waypoint task: ${state.customPoints[pending].title}`
          : next >= 0
            ? `Next task: ${state.customPoints[next].title} (C${next + 1}). You may return now.`
            : state.extra && !environmentTaskDone()
              ? 'Optional task: record an environmental change, or return now.'
              : state.progress === last()
                ? 'Destination reached. Return when ready.'
                : 'Continue to the destination or return now.';
    } else if (state.phase === 'finished')
      $('objective').textContent =
        'Back at the starting point · Journey ended; task states retained.';
  }
  const signature = JSON.stringify([custom, state.customPoints, state.customCompleted]);
  if (signature !== customMarkerSignature) {
    customMarkerSignature = signature;
    renderCustomMarkers();
    renderCustomTaskCards();
  }
}
function renderCustomMarkers() {
  const layer = $('customWaypointLayer');
  layer.replaceChildren();
  document.querySelector('.home-marker').setAttribute('transform', 'translate(250 580)');
  state.customPoints.forEach((point, index) => {
    const marker = document.createElementNS(svgNS, 'g');
    marker.classList.add('marker', 'custom-waypoint');
    marker.setAttribute('transform', `translate(${point.x} ${point.y})`);
    marker.setAttribute('role', 'button');
    marker.setAttribute('tabindex', '0');
    marker.setAttribute('aria-label', `Custom waypoint ${index + 1}`);
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', '23');
    circle.setAttribute(
      'fill',
      state.customCompleted.includes(index) ? '#286354' : '#52426d',
    );
    circle.setAttribute('stroke', '#ecb8ff');
    circle.setAttribute('stroke-width', '3');
    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('y', '6');
    text.setAttribute('style', 'font-size:16px');
    text.textContent = `C${index + 1}`;
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('y', '-33');
    label.setAttribute('style', 'font-size:15px');
    label.textContent =
      point.name ||
      (index === 0
        ? 'Start'
        : index === state.customPoints.length - 1
          ? 'Destination'
          : `Waypoint ${index + 1}`);
    marker.append(circle, text, label);
    marker.onclick = (e) => {
      if (pickingNote || drawingCustom) return;
      e.stopPropagation();
      openCustomTask(index);
    };
    marker.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openCustomTask(index);
      }
    };
    layer.append(marker);
  });
  const home = document.querySelector('.home-marker');
  if (state.route === 'custom' && state.customPoints[0])
    home.setAttribute(
      'transform',
      `translate(${state.customPoints[0].x} ${state.customPoints[0].y})`,
    );
  updateMarkerSizes();
}
function renderCustomTaskCards() {
  $('customTaskCards').replaceChildren();
  const tasks = state.customPoints
    .map((p, i) => ({ ...p, index: i }))
    .filter((p) => p.hasTask);
  if (!tasks.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'No waypoint tasks set. You may travel without tasks.';
    $('customTaskCards').append(p);
  }
  tasks.forEach((point) => {
    const button = document.createElement('button');
    button.className = 'task-card';
    const strong = document.createElement('strong');
    strong.textContent = point.title;
    const small = document.createElement('small');
    small.textContent = `C${point.index + 1}${point.name ? ' · ' + point.name : ''} · ${state.customCompleted.includes(point.index) ? 'Complete' : 'Not completed'}`;
    button.append(strong, small);
    button.onclick = () => openCustomTask(point.index);
    $('customTaskCards').append(button);
  });
}
function openCustomTask(index) {
  const point = state.customPoints[index];
  if (!point) return;
  viewedCustomTask = index;
  $('customTaskTitle').textContent = point.hasTask
    ? point.title
    : point.name || `Waypoint C${index + 1}`;
  $('customTaskDescription').textContent = point.hasTask
    ? point.description || 'No additional description.'
    : 'No task is set at this point.';
  $('customTaskLocation').textContent =
    `C${index + 1}${point.name ? ' · ' + point.name : ''} · X ${point.x}, Y ${point.y} · Schematic map units`;
  const editable = state.phase === 'planning';
  $('pointEditForm').hidden = !editable;
  $('customTaskDescription').hidden = editable;
  $('pointName').value = point.name || '';
  $('pointX').value = point.x;
  $('pointY').value = point.y;
  $('pointHasTask').checked = point.hasTask;
  $('pointTitle').value = point.title;
  $('pointTitle').required = point.hasTask;
  $('pointDescription').value = point.description;
  $('pointEditStatus').textContent = '';
  $('customTaskStatus').textContent = !point.hasTask
    ? 'This waypoint has no task. The explorer passes through automatically.'
    : state.customCompleted.includes(index)
      ? 'Task completed.'
      : state.phase === 'returning' || state.phase === 'finished'
        ? 'Not completed. This status is retained after returning.'
        : state.customReached.includes(index)
          ? 'Waypoint reached. Complete the task to continue.'
          : 'Preview available. Reach this waypoint during the journey to complete its task.';
  $('completeCustomTask').hidden = !point.hasTask;
  $('completeCustomTask').disabled =
    state.route !== 'custom' ||
    state.phase !== 'outbound' ||
    !state.customReached.includes(index) ||
    state.customCompleted.includes(index);
  if (!$('customTaskDialog').open) $('customTaskDialog').showModal();
}
$('closeCustomTask').onclick = () => $('customTaskDialog').close();
$('completeCustomTask').onclick = () => {
  const index = viewedCustomTask;
  if (
    state.route !== 'custom' ||
    state.phase !== 'outbound' ||
    !state.customReached.includes(index) ||
    state.customCompleted.includes(index) ||
    !state.customPoints[index]?.hasTask
  )
    return;
  state.customCompleted.push(index);
  log('task', `Completed C${index + 1}: ${state.customPoints[index].title}`);
  render();
  save();
  openCustomTask(index);
};
function reachCustomWaypoint(index) {
  if (state.customReached.includes(index)) return;
  state.customReached.push(index);
  const point = state.customPoints[index];
  log(
    'arrival',
    `Reached custom waypoint C${index + 1}${point.hasTask ? ': ' + point.title : ' (no task)'}`,
  );
  if (point.hasTask && !state.customCompleted.includes(index)) {
    state.paused = true;
    openCustomTask(index);
  }
  if (index === state.customPoints.length - 1) state.paused = true;
  render();
  save();
}
function resetWaypointForm() {
  editingWaypoint = null;
  $('waypointForm').reset();
  $('waypointTitle').required = false;
  $('saveWaypoint').textContent = 'Add coordinate point';
  $('cancelWaypointEdit').hidden = true;
}
function editCustomWaypoint(index) {
  if (state.phase !== 'planning') return;
  editingWaypoint = index;
  const point = state.customPoints[index];
  $('waypointName').value = point.name || '';
  $('waypointX').value = point.x;
  $('waypointY').value = point.y;
  $('waypointHasTask').checked = point.hasTask;
  $('waypointTitle').value = point.title;
  $('waypointTitle').required = point.hasTask;
  $('waypointDescription').value = point.description;
  $('saveWaypoint').textContent = 'Save waypoint changes';
  $('cancelWaypointEdit').hidden = false;
}
function customRouteChanged() {
  state.customConfirmed = false;
  state.progress = 0;
  state.customReached = [];
  state.customCompleted = [];
  save();
  render();
  renderCustomEditor();
}
function addCustomPoint(position) {
  if (state.phase !== 'planning' || state.route !== 'custom') return;
  state.customPoints.push({
    name: '',
    x: Math.round(position.x * 100) / 100,
    y: Math.round(position.y * 100) / 100,
    hasTask: false,
    title: '',
    description: '',
  });
  customRouteChanged();
}
function renderCustomEditor() {
  const planning = state.phase === 'planning';
  $('customRouteEditor').open = !state.customConfirmed && planning;
  $('customRouteEditor')
    .querySelectorAll('input, textarea, button')
    .forEach((el) => (el.disabled = !planning));
  $('drawCustomRoute').setAttribute('aria-pressed', String(drawingCustom));
  $('stopCustomDrawing').hidden = !drawingCustom;
  $('customWaypointList').replaceChildren();
  state.customPoints.forEach((point, index) => {
    const li = document.createElement('li');
    const title = document.createElement('p');
    title.textContent = `C${index + 1} · ${index === 0 ? 'Start' : index === state.customPoints.length - 1 ? 'Destination' : 'Waypoint'}${point.name ? ' · ' + point.name : ''} · (${point.x}, ${point.y})${point.hasTask ? ' · ' + point.title : ' · No task'}`;
    li.append(title);
    for (const [label, action, disabled] of [
      ['Edit', () => editCustomWaypoint(index), false],
      [
        'Move up',
        () => {
          [state.customPoints[index - 1], state.customPoints[index]] = [
            state.customPoints[index],
            state.customPoints[index - 1],
          ];
          resetWaypointForm();
          customRouteChanged();
        },
        index === 0,
      ],
      [
        'Move down',
        () => {
          [state.customPoints[index + 1], state.customPoints[index]] = [
            state.customPoints[index],
            state.customPoints[index + 1],
          ];
          resetWaypointForm();
          customRouteChanged();
        },
        index === state.customPoints.length - 1,
      ],
      [
        'Delete',
        () => {
          state.customPoints.splice(index, 1);
          resetWaypointForm();
          customRouteChanged();
        },
        false,
      ],
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.disabled = !planning || disabled;
      button.onclick = action;
      li.append(button);
    }
    $('customWaypointList').append(li);
  });
  $('customRouteStatus').textContent = state.customConfirmed
    ? 'Route confirmed. Ready to start.'
    : 'Unconfirmed route: add at least two distinct consecutive points, then confirm.';
}
$('waypointHasTask').onchange = () => {
  $('waypointTitle').required = $('waypointHasTask').checked;
};
$('waypointForm').onsubmit = (e) => {
  e.preventDefault();
  if (state.phase !== 'planning' || state.route !== 'custom') return;
  const point = {
    name: $('waypointName').value.trim(),
    x: Number($('waypointX').value),
    y: Number($('waypointY').value),
    hasTask: $('waypointHasTask').checked,
    title: $('waypointTitle').value.trim(),
    description: $('waypointDescription').value.trim(),
  };
  if (!storeCustomWaypoint(editingWaypoint, point)) return;
  resetWaypointForm();
};
// Both editors commit to the same route data; form fields remain drafts until saved.
function storeCustomWaypoint(index, point) {
  if (
    state.phase !== 'planning' ||
    !Number.isFinite(point.x) ||
    point.x < 0 ||
    point.x > 1000 ||
    !Number.isFinite(point.y) ||
    point.y < 0 ||
    point.y > 773 ||
    (point.hasTask && !point.title)
  )
    return false;
  if (index === null) state.customPoints.push(point);
  else if (state.customPoints[index])
    state.customPoints[index] = { ...state.customPoints[index], ...point };
  else return false;
  customRouteChanged();
  return true;
}
$('pointHasTask').onchange = () => {
  $('pointTitle').required = $('pointHasTask').checked;
};
$('cancelPointEdit').onclick = () => $('customTaskDialog').close();
$('pointEditForm').onsubmit = (e) => {
  e.preventDefault();
  const point = {
    name: $('pointName').value.trim(),
    x: Number($('pointX').value),
    y: Number($('pointY').value),
    hasTask: $('pointHasTask').checked,
    title: $('pointTitle').value.trim(),
    description: $('pointDescription').value.trim(),
  };
  const index = viewedCustomTask;
  if (!storeCustomWaypoint(index, point)) {
    $('pointEditStatus').textContent =
      'Enter valid map coordinates and a title for an enabled task.';
    return;
  }
  if (editingWaypoint === index) editCustomWaypoint(index);
  $('customTaskDialog').close();
};
$('cancelWaypointEdit').onclick = resetWaypointForm;
$('drawCustomRoute').onclick = () => {
  if (state.phase !== 'planning' || state.route !== 'custom') return;
  $('cancelNotePosition').click();
  drawingCustom = true;
  renderCustomEditor();
  $('mapWrap').classList.add('drawing-custom');
  $('mapWrap').scrollIntoView({ block: 'center' });
  $('customRouteStatus').textContent =
    'Click map points in travel order. Use Stop placing points when finished.';
};
$('stopCustomDrawing').onclick = () => {
  drawingCustom = false;
  $('mapWrap').classList.remove('drawing-custom');
  renderCustomEditor();
};
$('confirmCustomRoute').onclick = () => {
  const pts = state.customPoints;
  if (
    state.phase !== 'planning' ||
    pts.length < 2 ||
    pts.some(
      (p, i) =>
        (i && p.x === pts[i - 1].x && p.y === pts[i - 1].y) ||
        (p.hasTask && !p.title.trim()),
    )
  ) {
    $('customRouteStatus').textContent =
      'Use at least two points. Consecutive points must differ; enabled tasks need titles.';
    return;
  }
  state.customConfirmed = true;
  drawingCustom = false;
  $('mapWrap').classList.remove('drawing-custom');
  log(
    'route',
    'Confirmed custom route: ' +
      pts
        .map((p, i) => `C${i + 1} (${p.x}, ${p.y})${p.hasTask ? ': ' + p.title : ''}`)
        .join(' → '),
  );
  render();
  renderCustomEditor();
};
$('markerTools').addEventListener('toggle', () => {
  if (!$('markerTools').open && pickingNote) $('cancelNotePosition').click();
});
$('exportLog').onclick = () => {
  const records = state.records
    .map((record, index) => ({ ...record, index }))
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time) || a.index - b.index);
  const content = [
    'MarsPath Mission Log',
    'Chronological order · All saved journeys',
    'Coordinates are schematic map units, not meters or latitude/longitude.',
    '',
    ...records.map(
      (r) =>
        `${r.time} | ${routes[r.route]?.name || r.route} | ${r.phase} | (${r.position.x}, ${r.position.y})\n${r.content}\n`,
    ),
  ].join('\r\n');
  const url = URL.createObjectURL(
    new Blob([content], { type: 'text/plain;charset=utf-8' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = `marspath-log-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $('exportStatus').textContent =
    `Exported ${records.length} log entries in chronological order (UTF-8).`;
};

// One synthetic segment takes eight visible seconds. No physical scale is inferred.
setInterval(() => {
  if (
    !active() ||
    state.paused ||
    document.hidden ||
    $('photoDialog').open ||
    $('fieldNoteDialog').open ||
    $('customTaskDialog').open ||
    $('environmentTaskDialog').open
  )
    return;
  state.progress = Math.max(
    0,
    Math.min(last(), state.progress + (state.phase === 'returning' ? -1 : 1) / 16),
  );
  if (state.route === 'custom' && state.phase === 'outbound') {
    if (Number.isInteger(state.progress)) reachCustomWaypoint(state.progress);
  } else if (state.phase === 'outbound' && state.progress === last()) {
    state.paused = true;
    log('arrival', 'Arrived at simulated waypoint P1. Awaiting observation');
  } else if (state.phase === 'returning' && state.progress === 0) {
    log('arrival', 'Returned to the simulated landing point. Round trip complete');
    state.phase = 'finished';
    state.paused = true;
  }
  save();
  render();
}, 500);
// Keep the user's imagery filter and layer choices across routes and reloads.
renderNotePosition();
render();
renderLogs();
paintMark();
renderCustomEditor();
