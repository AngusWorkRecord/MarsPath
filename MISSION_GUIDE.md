# Marswalk mission experience

Open `mission.html` in a desktop browser. The mission is a standalone static page and works from a local file; no server or account is required. The English UI uses `observation-data.js`, `observation-viewer.js`, `mission.js` and `mission.css`. The original `index.html`, `app.js` and `styles.css` are retained.

## Shortest observation experience

1. With Landing-site imagery · P1 on and All markers selected, click **P1**. Its card separates the camera at Octavia E. Butler Landing from the delta remnant about 2.3 km to the west. The official yellow-star landing-site inset is retained.
2. Click the turquoise **Delta-front observation area / Approximate observation area** northwest of P1 on the map. The selected area highlights in amber and opens official overhead context and a separately labeled ground panorama. Choose **Skinner Ridge**, mark one layer or abrasion patch, write a sentence and Save observation. Confirm completion yourself. Closing the cards restores your map zoom, pan and page position. The corresponding Task Overview cards open the same materials and highlight the same area.
3. Open **Wildcat Ridge**. The default WATSON image is paired with Skinner's matching close-up. Write one visible difference, save and confirm. Choose the workspace image to inspect the larger scene; each image keeps its own unfinished draft.
4. Choose any preset route and Start journey. In Nearby mode, pause when P1 enters simulated range. Open the photo, mark the distant remnant, save one visible feature and confirm. All three presets can reach the corrected P1 range before their destination; P1 is not the route endpoint.
5. At any stage, use **Add Marker** to select a map point and save an environment note in Field Notes. Reopen it through its N marker. Return now may be chosen partway along a route, even with unfinished tasks.

Skinner and Wildcat cards include brief image-specific beginner tips. **Show reference annotations** is off whenever a card opens; enabling it draws cyan dashed teaching boxes, distinct from the user's yellow cross. The Skinner workspace boxes identify visible layers and its pale abrasion patch; close-up boxes suggest texture samples in both WATSON views. They are local teaching overlays, not NASA annotations, and are never saved as user evidence or used to complete tasks. Ordinary-language notes are accepted without geological terminology. Switching images updates the hints and boxes; closing/reopening keeps user evidence but resets reference visibility.

## Locations, sources and uncertainty

P1's approximate regional display position is **(300,359)** in the full regional image's 1000×773 SVG frame. The preserved review estimates this from printed map graticules and a published landing-site reference. The dashed circle represents unquantified location uncertainty; its drawn size is not a measured error bound. Exact camera pose, regional projection fitting and metric accuracy remain unverified.

The P1 camera is at the landing site. The raised target in PIA24485 is a distant delta remnant, not a second camera location and not an automatically identified named hill. Its approximate 2.3 km westward separation is a caption fact, not a route length. PIA24485 is estimated natural color, captured February 22, 2021. PIA24483 supplies the official landing-site star; its March 5, 2021 date is publication, not an established orbital acquisition date.

The **Hogwallow Flats / delta-front entry** provides a regional context for the nearby Skinner and Wildcat targets. PIA24923 is an annotated MRO/HiRISE overhead image; its red star identifies the rover in September 2022, not a June camera pose or P1. PIA24924 Figure A is a Mastcam-Z **ground** panorama identifying both rocks. The caption's approximate 20 m separation does not establish a walking route. The exact individual rock coordinates, camera poses and region boundary remain unresolved.

The shared map polygon is a broad visual envelope of the delta's eastern/southeastern margin, cross-checked against the regional HRSC image, official landing-site inset and PIA24923. Its vertices are schematic display coordinates in `observation-data.js`, not a surveyed boundary or a fitted image registration. Accuracy is unquantified. No individual Skinner or Wildcat map anchors are assigned. The polygon belongs to the Delta-front observation area layer and is excluded from Nearby filtering and navigation triggers. Its fill and dashed boundary communicate approximate coverage, while its label shrinks on zoom without moving the area. Clicking it during note placement or custom-route drawing selects the map position rather than opening materials; dragging it pans the map. Closing the final materials dialog restores the original view without auto-centering.

The Skinner workspace mosaic (PIA24925) spans June 30–July 8, 2022 (PDT), not one invented camera instant. It and the Wildcat workspace (PIA24928, August 4, 2022) are enhanced color. The paired WATSON views (PIA24926) were captured on June 29 and July 21, 2022. Their adopted caption does not establish natural/enhanced processing, so the UI does not claim it. Original labels, full frames, scale bars and mosaic gaps are preserved. Photographs alone do not identify mineral composition or demonstrate life.

Source pages, adopted download URLs, instrument/mission, credit, capture/publication dates, image dimensions and SHA-256 hashes are recorded in `assets/observation-manifest.json` and `assets/SOURCES.md`. Both original review inputs are preserved verbatim. Their broader proposed evidence checklist is not claimed as implemented: this iteration uses the two simpler tasks explicitly requested, with Hogwallow as contextual material rather than an extra task.

## Independent node and image records

- Nodes are `P1` / task `T-P1`, `N2` (Skinner) / `T-N2`, and `N3` (Wildcat) / `T-N3`.
- Every image has its own normalized full-frame marker, note draft, draft operation time and saved evidence. Switching images or nodes does not share or overwrite another image's inputs.
- Drafts save automatically. **Save unfinished draft** explicitly saves without completing the task. Incomplete drafts can contain only text or only a marker.
- P1 and Skinner require a saved marker and non-empty observation. Wildcat requires a saved difference on its WATSON comparison image; a marker is optional. Completion is always a separate user confirmation.
- P1 confirmation additionally requires reaching its simulated range on an outbound journey. Skinner and Wildcat have no verified location trigger and can be previewed, observed and completed through the regional list at any time.
- Editing a draft preserves the last saved evidence and its confirmation. Saving replacement evidence clears only that node's confirmation, so the user can review and confirm the new record.
- Capture dates are material metadata. User draft/save/confirmation times are stored and displayed separately. Observation logs and TXT exports include `nodeId`, `taskId`, `imageId`, capture metadata and saved evidence.
- Schema version 2 is stored under the existing browser key `marspath-mission-v1` for continuity. On first migration, the exact raw v1 value is retained under `marspath-mission-v1-backup-v1`; old P1 draft/marker, saved observation, operation time and completion state are copied to the P1/PIA24485 record. Other node records start empty. Legacy observation logs keep their original content and time and gain P1 identifiers.
- New journeys reset journey-specific custom tasks, while preserving the research observations, map notes and historical logs. Refresh restores all of them.

## Map and sidebar

Task Overview, Marswalk, Field Notes and Mission Log form an accordion. Opening one closes the others; clicking its title again closes it, so all may be closed. Draft inputs and route/task state survive folding. The sticky current-objective strip remains outside the accordion, with route progress, observation completion count and pause/return controls.

All controls now live under **Map Layers**. Their saved keys remain compatible with earlier journeys:

| Control | Owned map elements and dialogs | Saved key |
| --- | --- | --- |
| Regional basemap | Crater overhead image and its shade; no overlay elements | `terrain` |
| Landing-site imagery · P1 | P1 glyph, approximate location circle, location label, photo card including direction information and official landing-site inset | `imagery` |
| Delta-front observation area | Approximate polygon, leader and label; regional chooser; Skinner/Wildcat cards and reference images | `deltaFront` |
| Preset route · SIM | Last selected preset line/glow and fixed start icon | `route` |
| Custom route & waypoints · SIM | Custom line/glow, C markers, waypoint labels/tasks, custom origin and point editor | `customMap` |
| Environmental records | N markers, selected note position and note detail/edit dialog | `notes` |
| Hazard zones · SIM | Illustrative hazard ellipses | `hazards` |
| Simulated sites S1–S3 · SIM | Demo-site glyphs, labels and tooltip; independent from route waypoints | `science` |

The explorer remains visible as the current simulated position, independent of all layers. Basemap off fully hides the raster and shade, leaving all enabled overlays available. Hiding a layer closes only its owned dialog and removes its map content from pointer/keyboard interaction. Each dialog has a matching layer checkbox because the background controls are unavailable while a modal is open. Task Overview cards stay available and re-enable their owning layer before opening/highlighting the location. Switching observation tabs or opening related context is also an explicit request to reveal its owning layer; reference images within a card remain browsable.

Layer changes preserve zoom/pan, journey phase/progress/paused state, observation marks/drafts/evidence/completion, side-editor values and notes. Unsaved note edits are stored separately from saved content; a waypoint popup draft is suspended when its layer is hidden and restored on reopening. Cancel still discards the popup draft; saving commits it. No layer toggle confirms a task or saves an unfinished observation as evidence. The new delta-front switch defaults on for older saved journeys without that key.

P1 All/Nearby may be switched at any stage. Nearby uses Euclidean distance to each reviewed approximate photo anchor with a radius of **120 schematic map units**, not real meters and not a final-segment test. Only P1 currently has a reviewed display estimate. Its uncertainty circle and the simulated nearby radius are different concepts. A P1 task preview temporarily shows its selected location while the card is open, even out of range, without changing the saved range filter or making task completion eligible.

Drag to pan and use the wheel to zoom at the pointer. Route strokes and marker glyphs shrink visually as the map zooms in; their anchors stay unchanged. The Add Marker panel is collapsible; collapsing exits placement mode. Choosing Add note marker or Move marker shows Environmental records so the selected position can be seen. Hiding Environmental records preserves data, and turning it on restores N markers. Notes store selected point, time, content, route/phase/progress and explorer position. Editing/deleting an N marker retains historical log entries.

## Custom routes and return

Select **Custom** in Route Strategy to expand Marswalk and scroll to its editor. Only the custom layer turns on; other layers retain their settings. Selecting a preset similarly reveals its route without changing unrelated layers. Preset and custom routes may be viewed together. Add points through the map or X/Y input; first = start, last = destination. Edit, delete or reorder points and optionally assign tasks. Clicking a C marker opens the shared point editor before departure. Cancel discards the popup draft; saving updates the route, side list, marker and task overview. Confirm again after editing.

Map coordinates are schematic: X 0–1000 left-to-right, Y 0–773 top-to-bottom, not meters or geographic coordinates. Each simulated segment takes about eight visible seconds. Enabled custom tasks pause on arrival, but Return now is always available. Return retraces only traveled segments from the current position, including a fractional segment. Completed and unfinished tasks remain visible on return. The simulation does not move while the page is hidden or a material dialog is open.

## Export and validation

Mission Log → Export TXT downloads saved entries chronologically in UTF-8, retaining original user timestamps and evidence IDs. The on-screen log remains newest first.

Tests use Node.js, Playwright and installed Chrome. Set `PLAYWRIGHT_MODULE` to an existing Playwright package path if required, then run:

```text
node tests/observation-data.cjs
node tests/region-entry.cjs
node tests/observation-tips.cjs
node tests/layers.cjs
node tests/catalog-assets.cjs
node tests/point-editor.cjs
```

The observation test opens the real local page, verifies all three presets, per-node drafts/evidence/completion, migration and backup, regional access, notes, custom routes and early return. The catalog test decodes every adopted image, checks dimensions/hashes and verifies the review documents have not changed. Simulation tests use a controlled accelerated clock. Mobile/touch browsers, other rendering engines, exact geographic registration, rock absolute coordinates and real traversability remain unverified.
