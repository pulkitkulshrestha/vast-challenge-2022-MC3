const viewBox = [0, 0, 800, 600];
const width = viewBox[2];
const height = viewBox[3];
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
var mapXScale;
var mapYScale;
var mapPubXScale;
var mapPubYScale;
let xScale;
let yScale;
let map;
let employeesTab2;
pubs = []
/**
 * employees data structure
 * {
 * week1 {
 *    empoyer1{employee list}
 *    empoyern{employee list}
 * }
 * weekn {
 *    empoyer1{employee list}
 *    empoyern{employee list}
 * }
 */
function init() {
  let employers = [];
  let buildings = [];
  employeesTab2 = {};
  Promise.all([
    d3.csv("./Data/Buildings.csv", function (data) {
      let coords = data["location"].match(/([-+]?[\d.]+)\s([-+]?[\d.]+)/g);
      var polygon = {
        coordinates: [
          coords.map(function (d) {
            return { x: +d.split(" ")[0], y: +d.split(" ")[1] };
          }),
        ],
        minY: d3.min(coords, function (d) {
          return +d.split(" ")[1];
        }),
        maxY: d3.max(coords, function (d) {
          return +d.split(" ")[1];
        }),
        minX: d3.min(coords, function (d) {
          return +d.split(" ")[0];
        }),
        maxX: d3.max(coords, function (d) {
          return +d.split(" ")[0];
        }),
      };
      buildings.push(polygon);
    }),
    // d3.csv("./Data/Pub_Restaurant_location.csv", function (data) {
    //   let coords = data["location"].match(/([-+]?[\d.]+)\s([-+]?[\d.]+)/);
    //   pubs.push({ x: +coords[1], y: +coords[2], id: +data["Pub_RestaurantId"] });
    // }),
  ]).then((data) => {
    xScale = d3
      .scaleLinear()
      .domain([
        d3.min([
          d3.min(employers, (d) => d.x),
          d3.min(buildings, (d) => d.minX),
        ]),
        d3.max([
          d3.max(employers, (d) => d.x),
          d3.max(buildings, (d) => d.maxX),
        ]),
      ])
      .range([margin.left, width - margin.right]);

    yScale = d3
      .scaleLinear()
      .domain([
        d3.min([
          d3.min(employers, (d) => d.y),
          d3.min(buildings, (d) => d.minY),
        ]),
        d3.max([
          d3.max(employers, (d) => d.y),
          d3.max(buildings, (d) => d.maxY),
        ]),
      ])
      .range([height - margin.bottom, margin.top]);

    let x_scale_pub = d3.scaleLinear().domain([
      d3.min([
        d3.min(pubs, (d) => d.x),
        d3.min(buildings, (d) => d.minX),
      ]),
      d3.max([
        d3.max(pubs, (d) => d.x),
        d3.max(buildings, (d) => d.maxX),
      ]),
    ]).range([margin.left, width - margin.right]);
    let y_scale_pub = d3.scaleLinear().domain([
      d3.min([
        d3.min(pubs, (d) => d.y),
        d3.min(buildings, (d) => d.minY),
      ]),
      d3.max([
        d3.max(pubs, (d) => d.y),
        d3.max(buildings, (d) => d.maxY),
      ]),
    ]).range([height - margin.bottom, margin.top]);


    map = d3
      .select("#map");

    buildings.forEach((building) => drawPoly(building));
    mapXScale = xScale;
    mapYScale = yScale;
    mapXScale = x_scale_pub;
    mapPubYScale = y_scale_pub;
  });

  Promise.all([
    d3.csv("./Data/emp_emp_location&p2.csv", function (data) {
      let participentCoords = data["participant_location"].match(/([-+]?[\d.]+)\s([-+]?[\d.]+)/);
      data.week = +data.week
      data.participantId = +data.participantId
      data.employerId = +data.employerId
      // data.forEach(record => {
      if (!employeesTab2[data.week]) {
        employeesTab2[data.week] = { week: data.week }
      }
      if (!employeesTab2[data.week][data.employerId]) {
        employeesTab2[data.week][data.employerId] = [];
      }
      employeesTab2[data.week][data.employerId].push({
        employeeId: data.participantId,
        x: +participentCoords[1],
        y: +participentCoords[2],

      })
    }),
    d3.csv("./Data/Employers.csv", function (data) {
      let coords = data["location"].match(/([-+]?[\d.]+)\s([-+]?[\d.]+)/);
      employers.push({ x: +coords[1], y: +coords[2], id: +data["employerId"] });
    }),
  ]).then((data) => {
    // console.log("employees from map")
    // console.log(employeesTab2)
  });
}


// Moved to main.js
// function drawEmployees(d) {
// }

function drawPoly(polygon) {
  // console.log(polygon.coordinates);
  // polygon.coordinates[0].map((d) => console.log(d));
  var points = polygon.coordinates[0].map((d) => {
    return [xScale(d.x), yScale(d.y)];
  });
  const line = d3
    .line()
    .x((d) => d[0])
    .y((d) => d[1]);
  map
    .append("path")
    .attr("d", line(points))
    .attr("stroke", "black")
    .attr("stroke-opacity", ".5")
    .attr("fill", "none");
}


init();
// init_pub();
