# Data sources and acquisition plan

| Source | Data type | How to access | MVP status |
| --- | --- | --- | --- |
| [NASA JPL Jezero map](https://www.jpl.nasa.gov/images/map-of-mars-jezero-crater/) | Regional elevation/color visualization based on ESA Mars Express HRSC | Public downloadable JPG via JPL page | Original homepage: remote CSS image; mission.html: bundled assets/jezero-regional.jpg (real imagery) |
| [Mars Trek](https://trek.nasa.gov/mars/) | Mars basemaps and remote sensing | Select layers in web portal | Not yet connected |
| [Mars Trek WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) | Raster tiles, multiple instruments/products | Inspect chosen layer GetCapabilities; use Style, TileMatrixSet, TileMatrix, Row and Column according to API | Next integration |
| [USGS Jezero geology](https://www.usgs.gov/media/images/interactive-map-jezero-crater-mars-perseverance-rover-landing) | Standardized geologic mapping | USGS map and linked scientific source, check geospatial services | Next integration |
| [Perseverance raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/) | Surface photography | Find appropriate image and metadata; link photo to validated location | Later |

## Important design rule

Don't present the hardcoded hazard spots or fake times as measured facts. The current overlay is a storyboarding visualization laid over published imagery; it is **not registered to Martian latitude/longitude**. Additional NASA science datasets must be integrated to meet the multiple-mission aim of the challenge.

## Observation-data implementation

The preserved `OBSERVATION_PLAN_REVIEW.md` and `observation-candidates.review.json` supply the reviewed evidence chain. Their contents are unchanged. Runtime data is in `observation-data.js`; image provenance and verification hashes are in `assets/observation-manifest.json`.

P1 is displayed near (300,359) as an approximate camera-site estimate with an uncertainty symbol, not a precise registered location. The official landing-site inset remains separate from the distant target in the photo. Skinner Ridge and Wildcat Ridge have independent observation cards, but no individual map anchors or geographic proximity triggers. A shared approximate delta-front area on the map and Task Overview both open these materials. Its broad visual envelope was cross-checked against the HRSC regional map, official landing-site inset and PIA24923; it is not a surveyed boundary or a fitted image registration, and accuracy is unquantified. Official overhead context and an annotated ground panorama retain the distinction between the approximate shared area and the unverified individual rock locations.
