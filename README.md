# Menlo Park Collision Dashboard

An interactive Web GIS dashboard for exploring traffic collisions, injury severity, and roadway safety patterns in Menlo Park, California.

Built with **MapLibre GL JS** and **Chart.js**, the application combines interactive web mapping with linked data visualizations that allow users to explore collision patterns by year, transportation mode, and injury severity.

`web-gis`, `maplibre-gl`, `chartjs`, `javascript`, `geospatial`, `data-visualization`, `traffic-safety`, `geojson`

<img width="1506" height="714" alt="image" src="https://github.com/user-attachments/assets/b8b1c6f5-c7f0-4cfa-ae16-fb37577ded46" />

## Live Demo

**[Launch the Interactive Dashboard](https://pcppalmer.github.io/menlo-park-collision-dashboard/)**

> The live application is hosted with GitHub Pages.

## Overview

The Menlo Park Collision Dashboard was developed to provide an interactive way to explore traffic collision patterns throughout Menlo Park, California. Collision records from 2017–2021 are displayed alongside the city's Youth High Injury Network (HIN), allowing users to examine where collisions occur, how severe they are, and how patterns vary across different roadway locations.

The application links an interactive map with statistical charts so that selections made in the visualizations can dynamically filter the collision data displayed on the map.

## Key Features

* **Interactive collision heatmap** showing the spatial concentration of reported collisions.
* **Severity-based collision points** that appear at larger map scales for detailed exploration.
* **Youth High Injury Network visualization** symbolized according to collision counts.
* **Linked chart-to-map filtering** by year, pedestrian/bicycle involvement, and injury type.
* **Interactive popups** displaying roadway and collision attributes.
* **Layer controls** for independently toggling map overlays.
* **Dynamic map symbology** that changes with zoom level and collision severity.
* **Reset controls** for quickly returning to the complete collision dataset.

## Technologies

* **JavaScript**
* **HTML5 / CSS3**
* **MapLibre GL JS**
* **Chart.js**
* **GeoJSON**
* **CARTO basemaps**
* **AWS S3 raster tiles**
* **GitHub Pages**

## Application Structure

```text
menlo-park-collision-dashboard/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   ├── collisions.js
│   └── youth-high-injury-network.js
├── README.md
├── LICENSE
└── .gitignore
```

The application is entirely client-side. Collision and roadway data are loaded as JavaScript-hosted GeoJSON objects, while MapLibre GL JS handles interactive mapping and Chart.js provides the linked statistical visualizations.

## Visualization Design

The dashboard uses multiple representations of collision data to support exploration at different spatial scales.

At broader map scales, collisions are represented using a **heatmap** to highlight areas with greater concentrations of incidents. Collision severity contributes to heatmap weighting, giving more severe incidents greater visual influence.

As users zoom in, **individual collision points** become visible and are symbolized according to injury severity. Interactive popups provide additional information about individual incidents.

The **Youth High Injury Network** is represented as a line layer whose color and width vary according to the number of collisions associated with each roadway segment.

Charts complement the spatial view by summarizing collisions by:

* Year
* Pedestrian and bicycle involvement
* Injury type

Selecting categories within these charts dynamically filters the collision layers displayed on the map.

## Data

Collision and roadway-safety data were obtained from the **City of Menlo Park Open Data Portal**.

The dashboard includes collision records covering **2017–2021** and Youth High Injury Network roadway data.

Data included in this repository are provided for demonstration and educational purposes. Original datasets remain subject to the terms and policies of their respective data providers.

## Running Locally

Clone the repository:

```bash
git clone https://github.com/pcppalmer/menlo-park-collision-dashboard.git
cd menlo-park-collision-dashboard
```

Start a local web server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

in a web browser.

## Project Context

This project was originally developed as the final project for **GEOG 585: Open Web Mapping** in Penn State's Master of Geographic Information Systems / Spatial Data Science curriculum.

The repository has been reorganized for portfolio presentation while preserving the original application functionality and visualization approach.

## Author

**Patrick Palmer**

Spatial data professional focused on geospatial analytics, data visualization, transportation data, and spatial data science.

## License

Application source code is available under the [MIT License](LICENSE).

Third-party datasets, basemaps, libraries, and other external resources remain subject to their respective licenses and terms of use.
