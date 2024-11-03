// Set dimensions for the SVG
const widthChange = 800;
const heightChange = 600;

// Select the SVG element for the population change map
const svgChange = d3.select("#mapChange")
                    .attr("width", widthChange)
                    .attr("height", heightChange);

const colorScaleChange = d3.scaleDiverging(d3.interpolateRdYlGn);

// Create a tooltip div for this map
const tooltipChange = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("position", "absolute")
                        .style("background-color", "white")
                        .style("border", "1px solid #333")
                        .style("padding", "5px")
                        .style("border-radius", "5px")
                        .style("display", "none")
                        .style("pointer-events", "none");

// Load the GeoJSON data
d3.json("data/towns.geojson").then(geoData => {
  
  // Calculate population change and set color scale domain
  geoData.features.forEach(d => {
      d.properties.POP_CHANGE_80_10 = d.properties.POP2010 - d.properties.POP1980;
  });
  colorScaleChange.domain([
    d3.min(geoData.features, d => d.properties.POP_CHANGE_80_10),
    0,
    d3.max(geoData.features, d => d.properties.POP_CHANGE_80_10)
  ]);
  
  // Define a projection and path generator
  const projectionChange = d3.geoMercator().fitSize([widthChange, heightChange], geoData);
  const pathChange = d3.geoPath().projection(projectionChange);
  
  // Draw each town with color based on population change
  svgChange.selectAll("path")
     .data(geoData.features)
     .enter().append("path")
     .attr("d", pathChange)
     .attr("fill", d => colorScaleChange(d.properties.POP_CHANGE_80_10))
     .attr("stroke", "#333")
     .attr("stroke-width", 1)
     // Add hover events
     .on("mouseover", function(event, d) {
         d3.select(this)
           .attr("fill", "orange")  // Highlight on hover
           .attr("stroke", "#222")
           .attr("stroke-width", 2);

         tooltipChange.style("display", "block")
                      .html(`
                          <strong>${d.properties.TOWN}</strong><br>
                          Population 1980: ${d.properties.POP1980}<br>
                          Population 2010: ${d.properties.POP2010}<br>
                          Change: ${d.properties.POP_CHANGE_80_10}
                      `);
     })
     .on("mousemove", function(event) {
         tooltipChange.style("left", (event.pageX + 10) + "px")
                      .style("top", (event.pageY - 20) + "px");
     })
     .on("mouseout", function(event, d) {
         d3.select(this)
           .attr("fill", colorScaleChange(d.properties.POP_CHANGE_80_10))  // Revert to original color
           .attr("stroke", "#333")
           .attr("stroke-width", 1);

         tooltipChange.style("display", "none");
     });

}).catch(error => {
    console.error("Error loading the GeoJSON data:", error);
});

