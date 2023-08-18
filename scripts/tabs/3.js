var participantData = [];
var groupedData = [];
let filter = {
  participantId: [1],
  weeks: 5,
  clustered: false,
  cluster: 0,
  selectedId: 0,
};
let filteredData = [];
let participantLocations = [];
let clusterColor = d3.scaleOrdinal(d3.schemeTableau10);
const chartMargins = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 50,
};
const config = {
  lineChart: {
    width: document
      .getElementById("line-chart")
      .getAttribute("viewBox")
      .split(" ")[2],
    height: document
      .getElementById("line-chart")
      .getAttribute("viewBox")
      .split(" ")[3],
  },
  stackedBarChart: {
    width: document
      .getElementById("wages-vs-expense-chart")
      .getAttribute("viewBox")
      .split(" ")[2],
    height: document
      .getElementById("wages-vs-expense-chart")
      .getAttribute("viewBox")
      .split(" ")[3],
  },
};
const lineChart = d3.select("#line-chart");
const stackedBarChart = d3.select("#wages-vs-expense-chart");
const keys = ["wages"];
const invKeys = [
  "food",
  "recreation",
  "rent_adjustment",
  "shelter",
  "education",
];
const color = d3.scaleOrdinal(d3.schemeTableau10).domain([...keys, ...invKeys]);
function initialize() {}

function initializeLineChart() {
  const { width, height } = config.lineChart;
  lineChart
    .append("g")
    .attr("id", "line-chart-x-axis")
    .attr(
      "transform",
      `translate(0, ${height - chartMargins.top - chartMargins.bottom})`
    )
    .attr("opacity", 0);

  lineChart
    .append("g")
    .attr("id", "line-chart-y-axis")
    .attr("transform", `translate(${chartMargins.left}, 0)`)
    .attr("opacity", 0);

  // add legend
  lineChart
    .append("g")
    .attr("transform", `translate(${width - chartMargins.right - 100}, 0)`)
    .attr("id", "line-chart-legend");
}

function initializeStackedBarChart() {
  const { width, height } = config.stackedBarChart;
  // show x-axis in the middle
  stackedBarChart
    .append("g")
    .attr("id", "stacked-bar-chart-x-axis")
    .attr(
      "transform",
      `translate(0, ${(height - chartMargins.top - chartMargins.bottom) / 2})`
    )
    .attr("opacity", 0);

  stackedBarChart
    .append("g")
    .attr("id", "stacked-bar-chart-wages-y-axis")
    .attr("transform", `translate(${chartMargins.left}, 0)`)
    .attr("opacity", 0);

  stackedBarChart
    .append("g")
    .attr("id", "stacked-bar-chart-expenses-y-axis")
    .attr("transform", `translate(${chartMargins.left}, 0)`)
    .attr("opacity", 0);

  // show legend
  const legend = stackedBarChart
    .append("g")
    .attr("transform", `translate(${width - chartMargins.right - 100}, 0)`)
    .attr("opacity", 1);

  legend
    .selectAll("rect")
    .data(keys)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", (d) => color(d));

  legend
    .selectAll("text")
    .data(keys)
    .join("text")
    .attr("x", 15)
    .attr("y", (d, i) => i * 20 + 10)
    .attr("font-size", 10)
    .text((d) => d);

  // show legend
  const invLegend = stackedBarChart
    .append("g")
    .attr(
      "transform",
      `translate(${width - chartMargins.right - 100}, ${
        height - chartMargins.bottom - 100
      })`
    )
    .attr("opacity", 1);

  invLegend
    .selectAll("rect")
    .data(invKeys)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", (d) => color(d));

  invLegend
    .selectAll("text")
    .data(invKeys)
    .join("text")
    .attr("x", 15)
    .attr("y", (d, i) => i * 20 + 10)
    .attr("font-size", 10)
    .text((d) => d);
}

function updateLineChart() {
  // create multiline chart
  const t = d3.transition().duration(1000);
  const { width, height } = config.lineChart;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(groupedData[0].data, (d) => d.weeks))
    .range([chartMargins.left, width - chartMargins.right - chartMargins.left]);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(
        groupedData.flatMap((d) => d.data),
        (d) => d.savings
      ) + 500,
    ])
    .range([height - chartMargins.top - chartMargins.bottom, chartMargins.top])
    .nice();

  const line = d3
    .line()
    .curve(d3.curveMonotoneX)
    .x((d) => xScale(d.weeks))
    .y((d) => {
      if (d.savings === undefined) {
        return yScale(0);
      }
      return yScale(d.savings);
    });

  clusterColor = d3
    .scaleOrdinal(d3.schemeTableau10)
    .domain(groupedData.map((d) => d.group));

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  lineChart
    .select("#line-chart-x-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(xAxis);

  lineChart
    .select("#line-chart-y-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(yAxis);

  // draw savings line for each group - d.group is the group name and d.data.savings is the savings value, d.weeks is the week number
  const lines = lineChart.selectAll(".line").data(groupedData, (d) => d.group);

  lines.join(
    (enter) => {
      enter
        .append("path")
        .attr("class", (d) => `line group-${d.group}`)
        .attr("fill", "none")
        .attr("stroke", (d) => clusterColor(d.group))
        .attr("stroke-width", 2)
        .attr("d", (d) => line(d.data))
        .attr("opacity", 0)
        .on("mouseover", (e, d) => {
          d3.select(e.target).attr("stroke-width", 3);
        })
        .on("mouseout", (e, d) => {
          d3.select(e.target).attr("stroke-width", 2);
        })
        .on("click", (e, d) => {
          filter.selectedId = d.group;
          updateStackedBarChart();
        })
        .call((enter) => enter.transition(t).attr("opacity", 1));
    },
    (update) => {
      update
        .attr("d", (d) => line(d.data))
        .attr("opacity", 1)
        .attr("stroke", (d) => clusterColor(d.group))
        .on("click", (e, d) => {
          filter.selectedId = d.group;
          updateStackedBarChart();
        })
        .call((update) => update.transition(t));
    },
    (exit) => {
      exit.transition(t).attr("opacity", 0).remove();
    }
  );

  // update legend
  const legend = lineChart.select("#line-chart-legend");

  // remove all legend items
  legend.selectAll("*").remove();

  // add legend items
  legend
    .selectAll("rect")
    .data(groupedData)
    .join("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", (d) => clusterColor(d.group));

  legend
    .selectAll("text")
    .data(groupedData)
    .join("text")
    .attr("x", 15)
    .attr("y", (d, i) => i * 20 + 10)
    .attr("font-size", 10)
    .text((d) => d.group);
}

function updateStackedBarChart() {
  const t = d3.transition().duration(1000);
  const { width, height } = config.stackedBarChart;
  const { weeks, selectedId, clustered } = filter;
  let filteredData = [];
  if (clustered) {
    filteredData = groupedData.filter((d) => d.group == selectedId)[0].data;
    d3.select("#stacked-bar-chart-title").text(`Cluster ${selectedId}`);
  } else {
    filteredData = participantData.filter(
      (d) => d.participantId == selectedId && d.weeks <= weeks
    );
    d3.select("#stacked-bar-chart-title").text(`Participant ${selectedId}`);
  }

  const xScale = d3
    .scaleBand()
    .domain(filteredData.map((d) => d.weeks))
    .range([chartMargins.left, width - chartMargins.right - chartMargins.left])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(filteredData, (d) => d.wages)])
    .range([
      (height - chartMargins.top - chartMargins.bottom) / 2,
      chartMargins.top,
    ])
    .nice();

  const invYScale = yScale
    .copy()
    .range([
      (height - chartMargins.top - chartMargins.bottom) / 2,
      height - chartMargins.bottom,
    ]);

  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);
  const invYAxis = d3.axisLeft(invYScale);

  stackedBarChart
    .select("#stacked-bar-chart-wages-y-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(yAxis);

  stackedBarChart
    .select("#stacked-bar-chart-expenses-y-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(invYAxis);

  const series = d3
    .stack()
    .keys(keys)
    .value((d, key) => d[key])(filteredData);

  const invSeries = d3
    .stack()
    .keys(invKeys)
    .value((d, key) => d[key])(filteredData);

  stackedBarChart
    .selectAll(".series")
    .data(series)
    .join(
      (enter) =>
        enter
          .append("g")
          .attr("class", "series")
          .attr("fill", (d) => color(d.key))
          .call((enter) =>
            enter
              .selectAll(".bar")
              .data((d) => d)
              .join("rect")
              .attr("class", "bar")
              .attr("x", (d) => xScale(d.data.weeks))
              .attr("y", yScale(0))
              .attr("width", xScale.bandwidth())
              .attr("height", 0)
              .call((enter) =>
                enter
                  .transition(t)
                  .attr("height", (d) => {
                    let height = yScale(d[0]) - yScale(d[1]);
                    if (isNaN(height)) return 0;
                    return height;
                  })
                  .attr("y", (d) => yScale(d[1]))
              )
          ),
      (update) =>
        update
          .attr("fill", (d) => color(d.key))
          .call((update) =>
            update
              .selectAll(".bar")
              .data((d) => d)
              .join("rect")
              .attr("class", "bar")
              .attr("x", (d) => xScale(d.data.weeks))
              .attr("y", yScale(0))
              .attr("width", xScale.bandwidth())
              .attr("height", 0)
              .call((update) =>
                update
                  .transition(t)
                  .attr("height", (d) => {
                    let height = yScale(d[0]) - yScale(d[1]);
                    if (isNaN(height)) return 0;
                    return height;
                  })
                  // .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
                  .attr("y", (d) => yScale(d[1]))
              )
          ),
      (exit) => exit.transition(t).remove()
    );

  stackedBarChart
    .selectAll(".invseries")
    .data(invSeries)
    .join(
      (enter) =>
        enter
          .append("g")
          .attr("class", "invseries")
          .attr("fill", (d) => color(d.key))
          .call((enter) =>
            enter
              .selectAll(".invBar")
              .data((d) => d)
              .join("rect")
              .attr("class", "invBar")
              .attr("x", (d) => xScale(d.data.weeks))
              .attr("y", invYScale(0))
              .attr("width", xScale.bandwidth())
              .attr("height", 0)
              .call((enter) =>
                enter
                  .transition(t)
                  .attr("height", (d) => {
                    let height = invYScale(d[1]) - invYScale(d[0]);
                    if (isNaN(height)) return 0;
                    return height;
                  })
                  .attr("y", (d) => invYScale(d[0]))
              )
          ),
      (update) =>
        update
          .attr("fill", (d) => color(d.key))
          .call((update) =>
            update
              .selectAll(".invBar")
              .data((d) => d)
              .join("rect")
              .attr("class", "invBar")
              .attr("x", (d) => xScale(d.data.weeks))
              .attr("y", invYScale(0))
              .attr("width", xScale.bandwidth())
              .attr("height", 0)
              .call((update) =>
                update
                  .transition(t)
                  .attr("height", (d) => {
                    let height = invYScale(d[1]) - invYScale(d[0]);
                    if (isNaN(height)) return 0;
                    return height;
                  })
                  .attr("y", (d) => invYScale(d[0]))
              )
          ),
      (exit) => exit.transition(t).remove()
    );

  stackedBarChart
    .select("#stacked-bar-chart-x-axis")
    .transition(t)
    .attr("opacity", 1)
    .call(xAxis);
}

function drawParticipantsOnMap() {
  const t = d3.transition().duration(1000);
  map
    .selectAll(".participants")
    .data(participantLocations)
    .join(
      (enter) =>
        enter
          .append("circle")
          .attr("class", "participants")
          .attr("cx", (d) => xScale(d.x))
          .attr("cy", (d) => yScale(d.y))
          .attr("r", 3)
          .attr("data-participant-id", (d) => d.participantId)
          .attr("opacity", 0)
          .attr("fill", (d) => clusterColor(d.group))
          .on("mouseover", (event, d) => {
            d3.select(event.target).attr("r", 5);
          })
          .on("mouseout", (event, d) => {
            d3.select(event.target).attr("r", 3);
          })
          .on("click", (event, d) => {
            if (filter.clustered) return;
            filter.participantId.push(
              +event.target.getAttribute("data-participant-id")
            );
            filter.selectedId = +event.target.getAttribute(
              "data-participant-id"
            );
            updateData();
            updateLineChart();
            updateStackedBarChart();
          }),
      (update) =>
        update
          .attr("fill", (d) => clusterColor(d.group))
          .attr("data-participant-id", (d) => d.participantId)
          .attr("opacity", 1)
          .attr("class", (d) => `participants ${d.group}`),
      (exit) => exit.transition(t).remove()
    );
}

function updateData() {
  const filteredParticipantData = participantData.filter(
    (d) => d.weeks <= filter.weeks
  );
  if (filter.clustered) {
    const kdata = filteredParticipantData.map((d) => [
      d.wages,
      d.food,
      d.recreation,
      d.shelter,
      d.rent_adjustment,
      d.education,
      d.savings,
    ]);

    const k = 5;
    const maxIterations = 200;

    const result = kmeans(kdata, k, maxIterations);
    const labels = result.labels;

    // based on the labels, assign the group to each participant
    filteredParticipantData.forEach((d, i) => {
      d.group = labels[i];
      let participant = participantLocations.findIndex(
        (p) => p.participantId === d.participantId
      );
      if (participant !== -1) {
        participantLocations[participant].group = labels[i];
      }
    });

    groupedData = d3.group(filteredParticipantData, (d) => d.group);
    const weeks = Array.from({ length: filter.weeks }, (_, i) => i + 1);
    groupedData = Array.from(groupedData, ([key, value]) => {
      const group = key;
      const data = weeks.map((week) => {
        const filtered = value.filter((d) => d.weeks === week);
        const wages = d3.median(filtered, (d) => d.wages);
        const food = d3.median(filtered, (d) => d.food);
        const recreation = d3.median(filtered, (d) => d.recreation);
        const shelter = d3.median(filtered, (d) => d.shelter);
        const rent_adjustment = d3.median(filtered, (d) => d.rent_adjustment);
        const education = d3.median(filtered, (d) => d.education);
        const savings = d3.median(filtered, (d) => d.savings);
        return {
          weeks: week,
          wages,
          food,
          recreation,
          shelter,
          rent_adjustment,
          education,
          savings,
        };
      });
      return { group, data };
    });
  } else {
    // check if the first element of graphData is of type string
    // check if groupedData is empty
    if (groupedData.length > 0 && typeof groupedData[0].group === "number") {
      groupedData = [];
    }
    filter.participantId.forEach((id) => {
      const participant = filteredParticipantData.filter(
        (d) => d.participantId == id
      );
      groupedData.push({
        group: id,
        data: participant,
      });
    });
  }
}

document.addEventListener("tab3", (e) => {
  map.selectAll(".participants").transition().duration(1000).attr("opacity", 1);
  updateData();
  drawParticipantsOnMap();
  updateLineChart();
  updateStackedBarChart();
});

document.addEventListener("week-change", (e) => {
  filter.weeks = e.detail;
  if (window.currentTab == 3) {
    updateData();
    drawParticipantsOnMap();
    updateLineChart();
    updateStackedBarChart();
  }
});

document.addEventListener("cluster-change", (e) => {
  if (e.detail == "cluster") {
    filter.clustered = true;
    if (window.currentTab == 3) {
      updateData();
      drawParticipantsOnMap();
      updateLineChart();
      updateStackedBarChart();
    }
  } else {
    filter.clustered = false;
    resetTab3Graph();
  }
});

function resetTab3Graph() {
  groupedData = [];
  filter.participantId = [];
  lineChart.selectAll(".line").remove();
  stackedBarChart.selectAll(".series").remove();
  stackedBarChart.selectAll(".invseries").remove();
}

const tab3ClearSelection = document.querySelector("#clearBtnTab3");
tab3ClearSelection.addEventListener("click", (e) => {
  if (!filter.clustered) {
    resetTab3Graph();
  }
});

Promise.all([
  d3.csv("../Data/WagesExpenses.csv", (d) => {
    return {
      participantId: +d.participantId,
      weeks: +d.weeks,
      wages: +d.wages,
      food: +d.food,
      recreation: +d.recreation,
      shelter: +d.shelter,
      rent_adjustment: +d.rent_adjustment,
      education: +d.education,
      savings: +d.savings,
    };
  }),
  d3.csv("../Data/ParticipantLocations.csv", (d) => {
    let coords = d.participant_location.match(/([-+]?[\d.]+)\s([-+]?[\d.]+)/);
    return {
      participantId: +d.participantId,
      x: +coords[1],
      y: +coords[2],
    };
  }),
]).then(([participant, location]) => {
  participantData = participant;
  participantLocations = location;
  drawParticipantsOnMap();
  initializeLineChart();
  initializeStackedBarChart();
});
