# Bundled image provenance

Retrieved or rechecked on 2026-11-15. Credits are repeated in the page. Images are retained as published, without adding a claimed real camera coordinate to the regional map.

The delta-front map entrance uses a broad visual envelope cross-checked against the HRSC regional map, PIA24483 landing-site inset and PIA24923 orbital context. It is not a surveyed boundary or a fitted image registration; no quantified accuracy or individual rock coordinate is claimed. PIA24924 Figure A remains ground context, not a georeferenced overhead map. The shared area does not participate in proximity filtering.

| File | Source / product | Download |
| --- | --- | --- |
| `jezero-regional.jpg` | [NASA JPL regional Jezero map](https://www.jpl.nasa.gov/images/map-of-mars-jezero-crater/), published 2025-09-10. Credit: ESA/DLR/FU Berlin/HRSC. | https://d2pn8kiwq2w21t.cloudfront.net/original_images/Katie_1_-_DLR_Jezero_hi_v2.jpg |
| `landing-site.jpg` | [NASA JPL PIA24483](https://www.jpl.nasa.gov/images/pia24483-welcome-to-octavia-e-butler-landing/), published 2021-03-05; [NASA Science mirror](https://science.nasa.gov/photojournal/welcome-to-octavia-e-butler-landing/). Credit: NASA/JPL-Caltech/University of Arizona. Official yellow star identifies Octavia E. Butler Landing. Orbital acquisition date not established in this iteration. | https://assets.science.nasa.gov/dynamicimage/assets/science/psd/photojournal/pia/pia24/pia24483/PIA24483.jpg?fit=clip&w=1600 |
| `delta.jpg` | [NASA Science PIA24485](https://science.nasa.gov/resource/perseverance-view-of-the-delta-in-jezero-crater/), Mastcam-Z surface image acquired 2021-02-22; page published 2021-03-05. Credit: NASA/JPL-Caltech/ASU/MSSS. | https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/downloadable_items/4/5/45791_PIA24485_K4_ZCAM_main_sol004_Delta_Remnant_unannotated.jpg?fit=clip&w=1648 |
| `orbital.png` (legacy, not displayed in the current photo card) | [NASA Science PIA24922 route to the delta](https://science.nasa.gov/resource/perseverances-route-to-the-delta-2/). Its red star represents a later rover location, not the landing site. Credit: NASA/JPL-Caltech/University of Arizona/USGS/JHU-APL. | https://assets.science.nasa.gov/dynamicimage/assets/science/psd/mars/downloadable_items/4/47564_PIA24922.png?fit=clip&w=1920 |

Only the named landing site is supported by the surface-photo caption and the star-marked inset. The current P1 estimate is approximately (300,359), adopted from the preserved review's graticule interpolation. It is not a fitted camera coordinate. The dashed uncertainty symbol has no quantified metric radius; the separate 120-map-unit nearby radius is only for simulation.

## Observation-data integration

The six new files and the retained P1 surface image are inventoried in `observation-manifest.json`: source pages, actual download URLs, capture vs publication dates, color treatment, dimensions, byte counts and SHA-256 hashes. The raw review files are preserved with their original hashes in that manifest. `observation-data.js` is the file-safe runtime catalog, not a direct execution of the review proposal.

- `delta-front-context.jpg`: PIA24923, MRO/HiRISE annotated overhead context. NASA/JPL-Caltech/University of Arizona/USGS. Its September 2022 red star is not a June camera pose.
- `delta-targets-annotated.png`: PIA24924 Figure A, enhanced-color Mastcam-Z ground panorama, August 4, 2022. NASA/JPL-Caltech/ASU/MSSS. Ground labels identify the two rock targets; this is not an orbital map.
- `skinner-workspace-preview.jpg`: PIA24925, enhanced-color Mastcam-Z multi-day workspace mosaic, June 30?July 8, 2022 (PDT), sols 484?492. NASA/JPL-Caltech/ASU/MSSS. Official 1600px full-frame rendition was visually compared with the original; the original hash and dimensions are retained in the manifest.
- `wildcat-workspace.jpg`: PIA24928, enhanced-color Mastcam-Z mosaic, August 4, 2022. NASA/JPL-Caltech/ASU/MSSS.
- `skinner-closeup.png` / `wildcat-closeup.png`: the official left/right PIA24926 WATSON renditions, captured June 29 / July 21, 2022. NASA/JPL-Caltech/MSSS, following the adopted NASA Science split-image page. The caption does not establish natural/enhanced processing; no such claim is added. Both original labels and 5 mm scales remain intact.

All images retain their published full frame, including black mosaic gaps. No local cropping, recoloring, AI reconstruction or geographic target pixel placement was performed. Individual camera headings, absolute coordinates of the two rocks, the delta-front boundary and orbital acquisition dates remain unresolved.
