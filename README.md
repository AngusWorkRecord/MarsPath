# MarsPath AI — Visual Prototype (NASA Space Apps 2026)

An independent, **visual-only** concept for the *Interplanetary Survival Guide: Martian Map* challenge.

## Start in 30 seconds

1. Unzip the folder.
2. Open `index.html` with Chrome, Edge or Firefox.
3. Select one of three example routes and switch map layers on/off.

There is no Node.js, backend, database or API key needed for this version.

**Internet access is required to load the published regional Jezero image.** The app has a basic colored terrain fallback if external images are unavailable. If the background doesn't load, get the original JPG from the JPL link below and save it under `assets/jezero-hrsc.jpg`; then change the URL in `styles.css` under `.map-image` to `url('assets/jezero-hrsc.jpg')`.

## What's real and what's simulated?

- **REAL SOURCE:** Jezero Crater regional map (HRSC; ESA/DLR/FU Berlin), linked from NASA JPL. The image is shown as an image, **not georeferenced in the prototype**.
- **SIMULATED:** Overlay route lines, hazard ellipses, science marker positions, route lengths, times, risk indices and science scores.
- Not a real route-planning engine. Not suitable for actual Marswalk safety planning. No live environmental conditions.

## Project layout

```
MarsPath-AI/
├── index.html      # Interface markup
├── styles.css      # Mission Control visual system
├── app.js          # Interactive layer and route switching
├── assets/         # Optional locally saved Mars map image
├── DATA_SOURCES.md # Exact sources and integration roadmap
└── README.md
```

## Next steps

1. Integrate Mars Trek WMTS layers with their documented GetCapabilities endpoint. Respect the tile matrix/projection, not Earth Web Mercator by default.
2. Add a second actual data source (e.g. a USGS Jezero geology map) and show provenance for every layer.
3. Replace synthetic annotations with coordinates calculated from registered spatial data.
4. Prepare a 60–90s screen-recorded demo and clearly identify concept features.

## Credits

Jezero map: ESA/DLR/FU Berlin/HRSC, via NASA JPL (September 10, 2025): https://www.jpl.nasa.gov/images/map-of-mars-jezero-crater/

NASA Mars Trek: https://trek.nasa.gov/mars/
NASA Mars Trek WMTS API documentation: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars
USGS Jezero geologic map: https://www.usgs.gov/media/images/interactive-map-jezero-crater-mars-perseverance-rover-landing

NASA does not endorse this independent project.
