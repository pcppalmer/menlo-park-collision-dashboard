// Initialize the MapLibre map
      const map = new maplibregl.Map({
        container: 'map', // The ID of the HTML element to initialize the map in
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', // Carto Positron basemap
        center: [-122.17822441478936, 37.45188600521876], // Menlo Park, CA
        zoom: 12 // Initial zoom level
      });
      // Add navigation controls (zoom and rotation)
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      // Check if customAttribution is initialized
      if (!map._controls[0].options.customAttribution) {
        map._controls[0].options.customAttribution = ""; 
      }
      // Add attribution
      map._controls[0].options.customAttribution += " Data Sourced from <a href='https://data.menlopark.gov/search' target='_blank' rel='noopener noreferrer'>City of Menlo Park Open Data Portal</a>";
      map._controls[0]._updateAttributions();
      map.on('load', () => {
        // Add custom tile layer from Amazon S3 bucket
        map.addSource('custom-tiles', {
          type: 'raster',
          tiles: ['https://geog585-palmer.s3.us-east-1.amazonaws.com/MPBasemapNoHIN/{z}/{x}/{y}.png'],
          tileSize: 256
        });
        map.addLayer({
          id: 'custom-tiles-layer',
          type: 'raster',
          source: 'custom-tiles'
        });
        // Add YouthHIN GeoJSON source
        map.addSource('youth-hin', {
          type: 'geojson',
          data: YouthHIN 
        });
        // Add a line layer to symbolize the street centerlines
        map.addLayer({
          id: 'youth-hin-layer',
          type: 'line',
          source: 'youth-hin',
          paint: {
              'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'all_collis'], // Get the collision count
              0, '#fde0dd', // Light pink for low collisions
              10, '#fa9fb5', // Soft pink
              20, '#f768a1', // Medium pink
              30, '#dd3497', // Bright purple
              50, '#7a0177' // Dark purple for high collisions
            ],
            // Line width grows with collision counts
            'line-width': [
              'interpolate',
              ['linear'],
              ['get', 'all_collis'], // Get the collision count
              0, 2, 
              10, 4, 
              30, 6, 
              50, 14 
            ],
            'line-opacity': 0.8 
          }
        });
        // Layer toggle functionality
        const togglePanel = document.getElementById('layerTogglePanel');
        togglePanel.addEventListener('change', (event) => {
          const checkbox = event.target;
          const layerId = checkbox.dataset.layer;
          if (checkbox.checked) {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
          } else {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
        // Add a pop-up when clicking on a line
        map.on('click', 'youth-hin-layer', (e) => {
          const properties = e.features[0].properties; 
          const coordinates = e.lngLat; 
          // Display a popup with information from the GeoJSON properties
          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
            <strong>Street Name:</strong> ${properties.full_name || 'N/A'}<br>
            <strong>Total Collisions:</strong> ${properties.all_collis || 'N/A'}
          `)
            .addTo(map);
        });
        // Change cursor to pointer when hovering over lines
        map.on('mouseenter', 'youth-hin-layer', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        // Reset cursor
        map.on('mouseleave', 'youth-hin-layer', () => {
          map.getCanvas().style.cursor = '';
        });
        // Add GeoJSON source for collision data
        map.addSource('collisions', {
          type: 'geojson',
          data: MPCollisions 
        });
        // Add a heatmap layer
        map.addLayer({
          id: 'collision-heatmap',
          type: 'heatmap',
          source: 'collisions',
          maxzoom: 16, 
          paint: {
            'heatmap-weight': [
              'case',
              ['==', ['get', 'severity'], 'Fatal'], 2,
              ['==', ['get', 'severity'], 'Injury (Severe)'], 1.5,
              1 // Default
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)', // Transparent
              0.2, 'rgba(103,169,207,0.5)', // Light blue
              0.4, 'rgba(209,229,240,0.8)', // Pale grey-blue
              0.6, 'rgba(253,219,199,0.9)', // Light orange
              0.9, 'rgba(239,138,98,1)', // Red
              1, 'rgba(178,24,43,1)' // Deep red
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              16, 3
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              9, 8,
              20, 20
            ],
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              10, 1,
              20, .25 
            ]
          }
        });
        // Add a circle layer for individual points at high zoom levels
        map.addLayer({
          id: 'collision-points',
          type: 'circle',
          source: 'collisions',
          minzoom: 14, 
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              14, 4, // Smaller circles at zoom level 14
              22, 12 // Larger circles at zoom level 22
            ],
            'circle-color': [
              'match',
              ['get', 'severity'], 
              'Fatal', '#8B0000', // Dark red for fatal injuries
              'Injury (Severe)', '#FF0000', // Red for severe injuries
              'Injury (Minor)', '#ff8c00', // Orange for minor injuries
              '#FFDBBB' // Grey for other
            ],
            'circle-opacity': 0.8
          }
        });
        const legendContent = document.getElementById('legend-content');
        // Define complex legend entries
        const legendEntries = [{
            name: 'Youth HIN',
            type: 'gradient',
            colors: [{
                stop: 0,
                color: '#fde0dd'
              }, 
              {
                stop: 10,
                color: '#fa9fb5'
              },
              {
                stop: 20,
                color: '#f768a1'
              }, 
              {
                stop: 30,
                color: '#dd3497'
              }, 
              {
                stop: 50,
                color: '#7a0177'
              } 
            ]
          },
          {
            name: 'Collision Heatmap',
            type: 'gradient',
            colors: [{
                stop: 0,
                color: 'rgba(33,102,172,0)'
              }, 
              {
                stop: 0.2,
                color: 'rgba(103,169,207,0.5)'
              }, 
              {
                stop: 0.4,
                color: 'rgba(209,229,240,0.8)'
              }, 
              {
                stop: 0.6,
                color: 'rgba(253,219,199,0.9)'
              }, 
              {
                stop: 0.9,
                color: 'rgba(239,138,98,1)'
              }, 
              {
                stop: 1,
                color: 'rgba(178,24,43,1)'
              } 
            ]
          },
          {
            name: 'Collision Points',
            type: 'circle',
            color: [{
                label: 'Fatal',
                color: '#8B0000'
              },
              {
                label: 'Severe Injury',
                color: '#FF0000'
              },
              {
                label: 'Minor Injury',
                color: '#ff8c00'
              },
              {
                label: 'Other',
                color: '#FFDBBB'
              }
            ]
          }
        ];
        // Create legend HTML
        legendEntries.forEach((entry) => {
          const legendItem = document.createElement('div');
          legendItem.style.marginBottom = '10px';
          // Add title
          const title = document.createElement('div');
          title.innerText = entry.name;
          title.style.fontWeight = 'bold';
          legendItem.appendChild(title);
          // Add symbology
          if (entry.type === 'line') {
            const line = document.createElement('div');
            line.style.width = '100px';
            line.style.height = `${entry.width}px`;
            line.style.backgroundColor = entry.color;
            legendItem.appendChild(line);
          } else if (entry.type === 'gradient') {
            const gradient = document.createElement('div');
            gradient.style.width = '100px';
            gradient.style.height = '10px';
            gradient.style.background = `linear-gradient(to right, ${entry.colors
        .map((c) => c.color)
        .join(', ')})`;
            legendItem.appendChild(gradient);
          } else if (entry.type === 'circle') {
            entry.color.forEach((c) => {
              const circleContainer = document.createElement('div');
              circleContainer.style.display = 'flex';
              circleContainer.style.alignItems = 'center';
              circleContainer.style.marginBottom = '5px';
              const circle = document.createElement('div');
              circle.style.width = '15px';
              circle.style.height = '15px';
              circle.style.borderRadius = '50%';
              circle.style.backgroundColor = c.color;
              circle.style.marginRight = '5px';
              const label = document.createElement('span');
              label.innerText = c.label;
              circleContainer.appendChild(circle);
              circleContainer.appendChild(label);
              legendItem.appendChild(circleContainer);
            });
          }
          legendContent.appendChild(legendItem);
        });
        // Add a pop-up when clicking on a point
        map.on('click', 'collision-points', (e) => {
          const properties = e.features[0].properties; 
          const coordinates = e.features[0].geometry.coordinates.slice(); 
          const formattedDate = new Date(properties.COLLISION_).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          new maplibregl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
            <strong>Street Name:</strong> ${properties.street_nam || 'N/A'}<br>
            <strong>Collision Date:</strong> ${formattedDate || 'N/A'}<br>
            <strong>Severity:</strong> ${properties.Collisio_1 || 'N/A'}
          `)
            .addTo(map);
        });
        // Change cursor to pointer when hovering over points
        map.on('mouseenter', 'collision-points', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        // Reset cursor
        map.on('mouseleave', 'collision-points', () => {
          map.getCanvas().style.cursor = '';
        });
        // Process Collision Data to Count Accidents Per Year
        const yearCounts = {
          2017: 0,
          2018: 0,
          2019: 0,
          2020: 0,
          2021: 0
        };
        MPCollisions.features.forEach((feature) => {
          const year = feature.properties.ACCIDENT_Y; 
          if (yearCounts[year] !== undefined) {
            yearCounts[year] += 1; // Add count for the respective year
          }
        });
        const labels = Object.keys(yearCounts); // Years (2017-2021)
        const data = Object.values(yearCounts); // Number of accidents per year
        // Get the canvas context
        const ctxCollision = document.getElementById('collisionChart').getContext('2d');
        // Create the Chart variable
        const collisionChart = new Chart(ctxCollision, {
          type: 'bar', // Bar chart
          data: {
            labels: labels,
            datasets: [{
              label: 'Total Number of Collisions',
              data: data, 
              backgroundColor: [
                'rgba(75, 192, 192, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'top' 
              }
            },
            scales: {
              y: {
                beginAtZero: true, 
                title: {
                  display: true,
                  text: 'Total Number of Collisions' 
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'Year'
                }
              }
            },
            onClick: (event, elements) => {
              // Check if an element was clicked
              if (elements.length > 0) {
                // Get clicked year
                const selectedYear = collisionChart.data.labels[elements[0].index];
                const index = elements[0].index;
                // Apply filters
                if (selectedYear) {
                  map.setFilter('collision-points', ['==', ['get', 'ACCIDENT_Y'], parseInt(selectedYear)]);
                  map.setFilter('collision-heatmap', ['==', ['get', 'ACCIDENT_Y'], parseInt(selectedYear)]);
                  // Highlight chart
                  collisionChart.data.datasets[0].backgroundColor = [
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                  ]; // Reset to default
                  collisionChart.data.datasets[0].backgroundColor[index] = '#FFD700'; // Highlight
                  collisionChart.update(); 
                }
              }
            }
          }
        });
        // Process Collision Data
        let pedestrianCount = 0;
        let bicycleCount = 0;
        const injuryTypeCounts = {
          Fatal: 0,
          "Non-Incapacitating": 0,
          "Possible Injury": 0
        };
        MPCollisions.features.forEach((feature) => {
          const properties = feature.properties;
          if (properties.PEDESTRIAN === "Yes") {
            pedestrianCount += 1;
          }
          if (properties.BICYCLE_AC === "Yes") {
            bicycleCount += 1;
          }
          if (injuryTypeCounts[properties.severity] !== undefined) {
            injuryTypeCounts[properties.severity] += 1;
          }
        });
        // Total other collisions
        const totalCollisions = MPCollisions.features.length;
        const otherCollisions = totalCollisions - (pedestrianCount + bicycleCount);
        
        // Chart 2: Get canvas context
        const ctxPedestrianBicycle = document.getElementById('pedestrianBicycleChart').getContext('2d');
        // Create the Chart variable
        const pedestrianBicycleChart = new Chart(ctxPedestrianBicycle, {
          type: 'doughnut',
          data: {
            labels: ['Pedestrian Injuries', 'Bicycle Injuries', 'Vehicular Collisions'], 
            datasets: [{
              data: [pedestrianCount, bicycleCount, otherCollisions], 
              backgroundColor: ['#FF6384', '#36A2EB', '#CCCCCC'], 
              hoverOffset: 4 
            }]
          },
          options: {
            plugins: {
              legend: {
                display: true,
                position: 'right'
              }
            },
            onClick: (event, elements) => {
              // Check if an element was clicked
              if (elements.length > 0) {
                const index = elements[0].index;
                const label = pedestrianBicycleChart.data.labels[elements[0].index];
                let filter = ['all']; 
                // Determine the filter based on the clicked label
                if (label === 'Pedestrian Injuries') {
                  filter.push(['==', ['get', 'PEDESTRIAN'], 'Yes']);
                } else if (label === 'Bicycle Injuries') {
                  filter.push(['==', ['get', 'BICYCLE_AC'], 'Yes']);
                } else {
                  filter.push(['!=', ['get', 'PEDESTRIAN'], 'Yes']);
                  filter.push(['!=', ['get', 'BICYCLE_AC'], 'Yes']);
                }
                // Apply filter
                map.setFilter('collision-points', filter);
                map.setFilter('collision-heatmap', filter);
                // Highlight chart data
                pedestrianBicycleChart.data.datasets[0].backgroundColor = ['#FF6384', '#36A2EB', '#CCCCCC'];
                pedestrianBicycleChart.data.datasets[0].backgroundColor[index] = '#FFD700'; 
                pedestrianBicycleChart.update(); 
              }
            }
          }
        });

        // Chart 3
        const ctxInjuryType = document.getElementById('injuryTypeChart').getContext('2d');
        const injuryTypeChart = new Chart(ctxInjuryType, {
          type: 'doughnut', 
          data: {
            labels: Object.keys(injuryTypeCounts), 
            datasets: [{
              data: Object.values(injuryTypeCounts), 
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'], 
              hoverOffset: 4 
            }]
          },
          options: {
            plugins: {
              legend: {
                display: true,
                position: 'right' 
              }
            },
            onClick: (event, elements) => {
              // Check if an element was clicked
              if (elements.length > 0) {
                const label = injuryTypeChart.data.labels[elements[0].index];
                const index = elements[0].index;
                // Apply filters
                map.setFilter('collision-points', ['==', ['get', 'severity'], label]);
                map.setFilter('collision-heatmap', ['==', ['get', 'severity'], label]);
                injuryTypeChart.data.datasets[0].backgroundColor = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']; 
                injuryTypeChart.data.datasets[0].backgroundColor[index] = '#FFD700';
                injuryTypeChart.update(); 
              }
            }
          }
        });
        // Reset Filters Button
        const resetButton = document.createElement('button');
        resetButton.innerText = 'Reset Filters';
        resetButton.style.position = 'absolute';
        resetButton.style.top = '10px';
        resetButton.style.right = '10px';
        resetButton.style.padding = '10px';
        resetButton.style.backgroundColor = '#007BFF';
        resetButton.style.color = 'white';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '5px';
        resetButton.style.cursor = 'pointer';
        resetButton.addEventListener('click', () => {
          map.setFilter('collision-points', null);
          map.setFilter('collision-heatmap', null);
          // Reset the chart colors
          pedestrianBicycleChart.data.datasets[0].backgroundColor = ['#FF6384', '#36A2EB', '#CCCCCC'];
          pedestrianBicycleChart.update();
          injuryTypeChart.data.datasets[0].backgroundColor = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];
          injuryTypeChart.update(); 
          collisionChart.data.datasets[0].backgroundColor = [
            'rgba(75, 192, 192, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
          ];
          collisionChart.update(); 
        });
        document.body.appendChild(resetButton);
      });