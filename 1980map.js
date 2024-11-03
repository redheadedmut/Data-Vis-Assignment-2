// Set dimensions for the SVG
const width = 800;
const height = 600;

// Select the SVG element and set width/height
const svg = d3.select("#map")
              .attr("width", width)
              .attr("height", height);

// Define a color scale for the population in 1980

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

// Load the GeoJSON data
d3.json("data/towns.geojson").then(geoData => {
  
  // Set up color scale domain based on population in 1980
  const popExtent = d3.extent(geoData.features, d => d.properties.POP1980);

  const minVal = popExtent[0];
  const cutoff = 50000; // A chosen cutoff for where log scaling starts
  
  const colorScale = d3.scaleSequential()
      .domain([minVal, cutoff, Math.log(popExtent[1])]) // Adjust cutoff and max as needed
      .interpolator(d3.piecewise(d3.interpolateRgb, ["#f0f9e8", "#74a9cf", "#023858"])); // Light to dark blue gradient
  // Define a projection and path generator
  const projection = d3.geoMercator().fitSize([width, height], geoData);
  const path = d3.geoPath().projection(projection);
  
  // Draw each town with color based on 1980 population
  svg.selectAll("path")
     .data(geoData.features)
     .enter().append("path")
     .attr("d", path)
     .attr("fill", d => colorScale(d.properties.POP1980))
     .attr("stroke", "#333")
     .attr("stroke-width", 1)
     // Add hover events
     .on("mouseover", function(event, d) {
         d3.select(this)
           .attr("fill", "orange")  // Highlight on hover
           .attr("stroke", "#222")
           .attr("stroke-width", 2);

         tooltip.style("display", "block")
                .html(`<strong>${d.properties.TOWN}</strong><br>Population 1980: ${d.properties.POP1980}`);
     })
     .on("mousemove", function(event) {
         tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 20) + "px");
     })
     .on("mouseout", function(event, d) {
         d3.select(this)
           .attr("fill", colorScale(d.properties.POP1980))  // Revert to original color
           .attr("stroke", "#333")
           .attr("stroke-width", 1);

         tooltip.style("display", "none");
     });

}).catch(error => {
    console.error("Error loading the GeoJSON data:", error);
});