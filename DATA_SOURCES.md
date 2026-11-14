# Data sources and acquisition plan

| Source | Data type | How to access | MVP status |
| --- | --- | --- | --- |
| [NASA JPL Jezero map](https://www.jpl.nasa.gov/images/map-of-mars-jezero-crater/) | Regional elevation/color visualization based on ESA Mars Express HRSC | Public downloadable JPG via JPL page | Referenced as remote URL in CSS (real imagery) |
| [Mars Trek](https://trek.nasa.gov/mars/) | Mars basemaps and remote sensing | Select layers in web portal | Not yet connected |
| [Mars Trek WMTS](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars) | Raster tiles, multiple instruments/products | Inspect chosen layer GetCapabilities; use Style, TileMatrixSet, TileMatrix, Row and Column according to API | Next integration |
| [USGS Jezero geology](https://www.usgs.gov/media/images/interactive-map-jezero-crater-mars-perseverance-rover-landing) | Standardized geologic mapping | USGS map and linked scientific source, check geospatial services | Next integration |
| [Perseverance raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/) | Surface photography | Find appropriate image and metadata; link photo to validated location | Later |

## Important design rule

Don't present the hardcoded hazard spots or fake times as measured facts. The current overlay is a storyboarding visualization laid over published imagery; it is **not registered to Martian latitude/longitude**. Additional NASA science datasets must be integrated to meet the multiple-mission aim of the challenge.
