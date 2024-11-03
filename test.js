Promise.all([
  d3.json('data/towns.geojson'),
  d3.json('data/fips_mapping.json'), 
  d3.csv('data/gini_index.csv') 
]).then(([towns, fipsMapping, giniData]) => {
  // Create a mapping of FIPS code to county name
  const fipsToCounty = {};
  fipsMapping.forEach(entry => {
      fipsToCounty[entry.fips_code] = entry.county;
  });

  // Create a mapping of county names to Gini index values (as arrays)
  const countyGiniIndex = {};
  giniData.forEach(row => {
      const countyName = row['Geographic Area Name'];
      const giniValue = parseFloat(row['Estimate!!Gini Index']);
      const fipsCode = row.id.slice(-5); // Get the last 5 digits for FIPS

      // Initialize the county array if not already done
      if (!countyGiniIndex[fipsCode]) {
          countyGiniIndex[fipsCode] = [];
      }

      // Add the Gini index value to the corresponding county
      countyGiniIndex[fipsCode].push({
          year: row.year,
          giniIndex: giniValue
      });
  });

  console.log(countyGiniIndex)

  // Initialize counties object
  const counties = {};

  towns.features.forEach(town => {
      const fips = town.properties.FIPS_STCO.toString();
      const countyName = fipsToCounty[fips];

      // Initialize county if not already done
      if (!counties[countyName]) {
          counties[countyName] = {
              type: 'Feature',
              properties: {
                  county: countyName,
                  population: 0,
                  giniIndex: countyGiniIndex[fips] || [], // Store array of Gini indices
                  town_names: []
              },
              geometry: {
                  type: 'MultiPolygon',
                  coordinates: []
              }
          };
      }

      // Use POP2010 for population aggregation
      counties[countyName].properties.population += town.properties.POP2010 || 0;
      counties[countyName].properties.town_names.push(town.properties.TOWN || "Unknown");

      // Append town geometry to county without extra brackets
      if (town.geometry.type === "Polygon") {
          counties[countyName].geometry.coordinates.push(town.geometry.coordinates);
      } else if (town.geometry.type === "MultiPolygon") {
          counties[countyName].geometry.coordinates.push(...town.geometry.coordinates);
      }
  });

  // Convert counties object to an array
  const countiesGeoJSON = {
      type: 'FeatureCollection',
      features: Object.values(counties)
  };
  
  console.log(countiesGeoJSON)
  // Set dimensions for the SVG
  const width = 800;
  const height = 600;

  // Select the SVG element and set width/height
  const giniSvg = d3.select("#giniMap")
                    .attr("width", width)
                    .attr("height", height);

  const giniColorScale = d3.scaleSequential(d3.interpolateReds)
  .domain(d3.extent(countiesGeoJSON.features, d => d.properties.giniIndex.length > 0 ? d.properties.giniIndex[0].giniIndex : 0)); // Color by the first Gini index

  // Create a tooltip div that is hidden by default
  const tooltip = d3.select("body").append("div")
                  .attr("class", "tooltip")
                  .style("position", "absolute")
                  .style("background-color", "white")
                  .style("border", "1px solid #333")
                  .style("padding", "5px")
                  .style("border-radius", "5px")
                  .style("display", "none")
                  .style("pointer-events", "none");

  // Define a projection and path generator
  const giniProjection = d3.geoMercator().fitSize([width, height], countiesGeoJSON);
  const giniPath = d3.geoPath().projection(giniProjection);

  // Draw counties with color based on population

  // Set up color scale for Gini index

  // Draw counties
  giniSvg.selectAll("path")
      .data(countiesGeoJSON.features)
      .enter()
      .append("path")
      .attr("d", giniPath)
      .attr("fill", d => giniColorScale(d.properties.giniIndex.length > 0 ? d.properties.giniIndex[0].giniIndex : 0)) // Color by Gini index
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
          d3.select(this)
            .attr("fill", "orange"); // Highlight on hover

          // Create tooltip content
          const giniInfo = d.properties.giniIndex.map(g => `<div>${g.year}: ${g.giniIndex.toFixed(4)}</div>`).join('');
          tooltip.style("display", "block")
                 .html(`<strong>${d.properties.county}</strong><br>Gini Index:<br>${giniInfo}<br>Population: ${d.properties.population}`);
      })
      .on("mousemove", function(event) {
          tooltip.style("left", (event.pageX + 10) + "px")
                 .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", function(event, d) {
          d3.select(this)
            .attr("fill", giniColorScale(d.properties.giniIndex.length > 0 ? d.properties.giniIndex[0].giniIndex : 0)); // Revert to original color

          tooltip.style("display", "none");
      });

});
