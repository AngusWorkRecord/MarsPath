# Marswalk mission experience

Open `mission.html` in Chrome. This standalone static page needs no server or account. `index.html`, `app.js`, and `styles.css` retain the original homepage. The mission UI is in English.

## Shortest experience

1. Leave **Photo locations** on, choose **All markers**, and click **P1** to preview the surface photo and NASA's annotated landing-site inset.
2. Select **Custom** under Route Strategy. Add coordinates `(300, 330)`, `(600, 330)`, `(900, 330)` and optionally give the middle and last points tasks. Confirm the route. The photo-layer switch and All/Nearby selection retain your choices.
3. Choose **Nearby markers** and start. P1 becomes visible as the explorer approaches the middle point, not because the route is ending. Pause to open it. Complete a reached custom task to see the next task in the compact objective strip.
4. Expand **Add Marker**, choose a map point, enter content in **Field Notes**, and save. Click its **N** marker to read, edit, move or delete it. This works before departure, while moving, while paused, during return and after arriving home.
5. Choose **Return now** at any point. The explorer retraces the already traveled route from its current position, including partway through a segment. Completed and unfinished task states remain visible after arrival. **Plan a new journey** prepares the next journey.

## Sidebar and current objective

Task Overview, Marswalk, Field Notes and Mission Log form an accordion. Opening one closes the others; clicking its title again closes it, so all four may be closed. Folding preserves draft inputs, route settings and task progress. The compact current-objective strip sits outside the accordion and stays visible while scrolling through notes or logs. It includes the simulated position, task completion count and pause/return controls.

## Imagery and simulated range

- **Photo locations** is controlled only by the user. Changing strategy, starting, preparing another journey or refreshing does not force the photo layer on or off.
- **All markers** and **Nearby markers** may be switched before departure, outbound, paused, returning and after arrival. The selected mode is persisted.
- Nearby filtering uses Euclidean distance in the schematic map coordinate system, separately for every photo anchor. The current radius is **120 map units**. It is independent of zoom, route length, current segment number and task completion.
- P1's schematic access anchor is `(600, 330)`. It is **not the camera's geographic location**. The real named site is shown in the official local inset. No real-world distance is inferred from the simulation.
- There is one verified surface-photo node. Its camera location, westward viewing direction, capture date, observation target, credit and source link appear in the photo card. The custom C markers are user-created task locations; they are not photographic evidence.

## Verified imagery and precision limits

The surface photo is PIA24485, acquired on February 22, 2021 with Perseverance's Mastcam-Z. NASA's caption identifies the camera's named site as Octavia E. Butler Landing and the target as the delta remnant to the west. Source: https://science.nasa.gov/resource/perseverance-view-of-the-delta-in-jezero-crater/

The card now uses **PIA24483** as its local HiRISE inset. NASA explicitly identifies the star as the landing location. Source: https://www.jpl.nasa.gov/images/pia24483-welcome-to-octavia-e-butler-landing/ . It was published March 5, 2021; this publication date is not presented as the acquisition date.

This cross-check supports the named landing site, not an independently measured camera pose. The precise camera coordinate, heading in degrees, local orbital acquisition date and registration from the regional map to the inset remain unverified. We do not turn the inset's scale bar into a walking-distance conversion. The older `assets/orbital.png` has a different historical rover-location star and is retained as a legacy asset, not used to locate this photo.

The regional HRSC map is an official image from ESA/DLR/FU Berlin, distributed by NASA JPL. It is bundled locally for reliable loading. Its mission overlays remain schematic, not registered Martian latitude/longitude. Source: https://www.jpl.nasa.gov/images/map-of-mars-jezero-crater/ . File provenance is recorded in `assets/SOURCES.md`.

## Custom routes and tasks

1. Select **Custom** under Route Strategy, or **Custom Route** under Marswalk. The editor expands and the page scrolls to it. Orbital terrain and Custom Map Layer turn on; standard hazards, simulated science targets and the standard route turn off. **Photo locations** and **Environmental records** retain the user's choices.
2. Use **Add points on map**, click in travel order and choose **Stop placing points**, or enter X/Y coordinates and choose **Add coordinate point**. Dragging pans the map without placing a point.
3. First point = start; last point = destination; other points = waypoints. Use Edit, Delete, Move up and Move down to manage them. Consecutive points must differ.
4. Before departure, click a C marker to edit its name, coordinates and optional task. Save point updates shared data, the sidebar list, route, marker and Task Overview. Cancel, Close and Escape discard the popup draft. The sidebar editor uses the same data. Editing invalidates route confirmation; confirm again to start. Editing the route is disabled during a journey.
5. Enabled waypoint tasks pause the explorer on arrival. Complete the task and resume, or choose Return now without completing it. Returning never auto-completes tasks or requires visiting the destination. Return remains available even at an unfinished task stop.

X ranges from 0 to 1000 (left to right), Y from 0 to 773 (top to bottom), in schematic map units, not meters or geographic coordinates. Each simulated segment takes approximately eight visible seconds, regardless of drawn length. The simulation does not move while the page is hidden or a map-information dialog is open.

**Custom Map Layer** controls the custom route and C markers independently from the standard **Traverse route** layer. Hiding a layer never deletes its underlying data. Layer states survive refresh.

## Environmental records

**Environmental records** controls N markers and the selected-point indicator. Hiding it preserves every note, position and timestamp; reopening restores them. Choosing Add note marker or Move marker explicitly shows the records layer so the selected position can be seen.

Notes store the selected map position, save time, content, journey phase, route, route progress and simulated explorer position. Choosing a point never moves the explorer. Editing or deleting an N marker retains historical mission-log entries. The Add Marker panel is collapsible; collapsing it exits placement mode. Note placement and custom-route drawing are mutually exclusive.

## Mission Log

**Export TXT** downloads all saved log entries in chronological order as UTF-8, with their original timestamps, content, route, phase and schematic position. The on-screen log remains newest first. Refresh restores the current journey, layer/filter choices, tasks and notes. Starting a new journey resets its tasks while preserving historical records and map notes.

## Browser validation

Use Node.js, Playwright and installed Chrome. Set `PLAYWRIGHT_MODULE` to an existing Playwright package path if it is not installed locally. Run:

```text
node tests/map-experience.cjs
node tests/point-editor.cjs
node tests/map-editing.cjs
```

`map-experience.cjs` opens the actual local page without stubbing images or network requests. It checks image decoding, user-controlled imagery, geometric nearby filtering, notes in the four requested phases, the persistent objective, fractional early return, incomplete task retention, refresh recovery, and normal endpoint return. Simulation tests use a controlled accelerated clock; they do not establish real travel time, geographic accuracy or EVA safety. The checks were performed in desktop Chrome; touch/mobile browsers and other engines have not been verified in this iteration.
