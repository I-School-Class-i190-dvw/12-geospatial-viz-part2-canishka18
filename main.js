console.log('hello world!');

//svg dimensions
var width = Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight);

//math variables
var pi = Math.PI,
    tau = 2 * pi;

//use the d3 geoMercator projection for the map
var projection = d3.geoMercator()
  .scale(1 / tau)
  .translate([0, 0]);

//create the paths using the projection
var path = d3.geoPath()
  .projection(projection);

//use to render the map tiles
var tile = d3.tile()
  .size([width, height]);

//d3 zoom function to change the scales 
//when zoomed in/out
var zoom = d3.zoom()
  .scaleExtent([
    1 << 11,
    1 << 24
  ])
  .on('zoom', zoomed);

//set the scale for the radius of the earthquakes
var radius = d3.scaleSqrt().range([0, 10]);

//append the svg
var svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

//append the raster layer
var raster = svg.append('g');

// render to a single path:
// var vector = svg.append('path');
// render to multiple paths:
var vector = svg.selectAll('path');

//load the earthquake data for california
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
  if (error) throw error;
  
  console.log(geojson);
  
  //set the domain for the radius using the magnitude values from data
  radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);
  

  path.pointRadius(function(d) {
    return radius(d.properties.mag);
  });
  
  // render to a single path:
  // vector = vector.datum(geojson);
  // render to multiple paths:
  vector = vector
    .data(geojson.features)
    .enter().append('path')
    .attr('d', path)
    .on('mouseover', function(d) { console.log(d); });
  
  //set the center of the projection
  var center = projection([-119.665, 37.414]);
  
  //call the zoom function
  svg.call(zoom)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1 << 14)
        .translate(-center[0], -center[1])
    );
});

//changes made in zoomed version
function zoomed() {
  var transform = d3.event.transform;
  
  //adapt the tiles for the zoomed projection
  var tiles = tile
    .scale(transform.k)
    .translate([transform.x, transform.y])
    ();
  
  console.log(transform.x, transform.y, transform.k);
  
  projection
    .scale(transform.k / tau)
    .translate([transform.x, transform.y]);
  
  vector.attr('d', path);
  
  //raster layer
  var image = raster
    .attr('transform', stringify(tiles.scale, tiles.translate))
    .selectAll('image')
    .data(tiles, function(d) { return d; });
  
  image.exit().remove();
  
  image.enter().append('image')
    .attr('xlink:href', function(d) {
      return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' +
        d[2] + "/" + d[0] + "/" + d[1] + ".png";
    })
    .attr('x', function(d) { return d[0] * 256; })
    .attr('y', function(d) { return d[1] * 256; })
    .attr('width', 256)
    .attr('height', 256);
}

function stringify(scale, translate) {
  var k = scale / 256,
      r = scale % 1 ? Number : Math.round;
  return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}
