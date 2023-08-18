// Get width and height
var bp_margin = { top: 20, right: 10, bottom: 50, left: 50 };
pubs = []
kmeans_pub = []
selected_pubs = []
const bp_config = {
    pub_line_chart: {
        width: document
            .getElementById("pub_line_chart")
            .getAttribute("viewBox")
            .split(" ")[2],
        height: document
            .getElementById("pub_line_chart")
            .getAttribute("viewBox")
            .split(" ")[3],
    },
    candle_chart: {
        width: document
            .getElementById("candle_chart")
            .getAttribute("viewBox")
            .split(" ")[2],
        height: document
            .getElementById("candle_chart")
            .getAttribute("viewBox")
            .split(" ")[3],
    },
};



document.addEventListener("DOMContentLoaded", function () {
    /**
     * Calls page setup functions
     *
     */
    const lineGraphMargin = { top: 20, right: 20, bottom: 50, left: 50 };

    sliderListen(lineGraphMargin)
    // createBizLineCharts(lineGraphMargin);
    // createWaterfall(lineGraphMargin);

    Promise.all([
        d3.csv("./Data/kmeans_pubs.csv")
    ]).then((data) => {
        new_data = data[0]
        selectedColumns = {}
        new_data.forEach(({ Pub_RestaurantId, Cluster }) => {
            selectedColumns[Pub_RestaurantId] = Cluster;
        });
        kmeans_pub = selectedColumns
    });

    Promise.all([
        d3.csv("./Data/Pub_Restaurant_location.csv", function (data) {
            let coords = data["location"].match(/([-+]?[\d.]+)\s([-+]?[\d.]+)/);
            pubs.push({ x: +coords[1], y: +coords[2], id: +data["Pub_RestaurantId"] });
        })
    ]).then((data) => {

        createPubLineCharts(lineGraphMargin)
        createCandleChart(lineGraphMargin)
        mapDataVisibility()
        addPubViewClick();
    });





});



function mapDataVisibility() {
    /**
     * This makes it so that the network map only shows on the relevant tab
     * Sets up listeners for tab buttons
     * Show on tab 1
     */
    document.addEventListener("tab1", (e) => {
        console.log("tab1 Selected")
        d3.selectAll(".show-on-pubTab").style("visibility", "visible");
    });

}

function getSliderValue() {
    var slider = document.getElementById("weeks");
    return +slider.value;
}

function getClusterValue() {
    var filter = document.getElementById("filter");
    return +filter.value;
}




document.addEventListener("week-change", (e) => {

    const slider = document.getElementById("weeks");
    const filter = document.getElementById("filter");

    if (window.currentTab == 1) {
        const svg_line = d3.select("#publineGraph");
        if (filter.value == "cluster") {
            clear_pub_lines()
            pubViewKmeans()
        }
        else {
            if (selected_pubs.length > 0) {
                clear_pub_lines()
                //console.log(selected_pubs)
                for (var pub of selected_pubs) {
                    draw_pub_charts(svg_line, false, pub, bp_margin)
                }
            }
        }

    }
});

document.addEventListener("cluster-change", (e) => {

    const filter = document.getElementById("filter");
    if (window.currentTab == 1) {
        const svg_line = d3.select("#publineGraph");
        //console.log(filter.value)
        if (filter.value == "cluster") {
            clear_pub_lines()
            selected_pubs = []
            pubViewKmeans()
        }
        else {

            removeKmeansView()
            addPubViewClick()

        }
    }
});






//*********************************************************************************************************** */

function createPubLineCharts(margin) {
    /*
          Creates base line graph and svg. Does not add data
      */

    // Define the width and height of the graph
    const { width, height } = bp_config.pub_line_chart;

    // Calculate the inner width and height of the graph
    const innerWidth = width - bp_margin.left - bp_margin.right;
    const innerHeight = height - bp_margin.top - bp_margin.bottom;

    const publineChart = d3.select("#pub_line_chart");
    // Create a group element for the graph

    const lineGraph = publineChart
        .append("g")
        .attr("transform", `translate(${bp_margin.left},${bp_margin.top})`)
        .attr("id", "publineGraph");

    var max_week = getSliderValue()
    // Define the scales for the x and y axes
    //console.log(innerWidth)

    const x = d3.scaleLinear().domain([1, max_week]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

    // Create the x and y axes
    const xAxis = d3.axisBottom(x).ticks(max_week).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y);

    // Add the x and y axes to the graph
    lineGraph
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis);

    lineGraph.append("g").attr("class", "y-axis").call(yAxis);


    // Add the y-axis label
    lineGraph
        .append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - bp_margin.left)
        .attr("x", 0 - innerHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Revenue"); // update this based on the current selection

    // Add x-axis label
    lineGraph
        .append("text")
        .attr(
            "transform",
            "translate(" + innerWidth / 2 + " ," + (innerHeight + 40) + ")"
        )
        .style("text-anchor", "middle")
        .text("Week Number");

}


function addPubViewClick() {
    var map = d3.select('#map');
    var { width, height } = bp_config.pub_line_chart;

    // Select Line Graph
    const svg_line = d3.select("#publineGraph");

    map.selectAll("circle.show-on-pubTab")
        .data(pubs)
        .join(
            enter => enter.append("circle")
                .attr("class", (d) => { return `Pub_RestaurantId${d.id} show-on-pubTab` })
                .attr("cx", (d) => mapXScale(d.x))
                .attr("cy", (d) => mapYScale(d.y))
                .attr("r", 3)
                .style("visibility", "hidden")
                .attr("fill", "red")
                .on("click", (event, d) => {
                    //console.log("Clicked datapoint: ", d);
                    const circ = d3.select(event.currentTarget);
                    if (circ.attr("r") == 3) {
                        circ.attr("fill", "red")
                            .attr("r", 5);
                        // Circle selected
                        selected_pubs.push(d.id)
                        draw_pub_charts(svg_line, false, d.id, bp_margin)
                    }
                }),
            update => update
                .attr("cx", (d) => mapXScale(d.x))
                .attr("cy", (d) => mapYScale(d.y))
                .attr("fill", (d) => d.selected ? "green" : "red")
                .attr("r", (d) => d.selected ? 5 : 3),
            exit => exit.remove()
        );


    map.selectAll("circle.show-on-pubTab").raise();


    /**
     * Adding clear button
     */

    // map.style('position', 'relative');

    let button = d3.select('#clearBtnTab1')

    button
        .on("click", (event, d) => {
            clear_pub_lines()
            selected_pubs = [];
            map.selectAll("circle.show-on-pubTab")
                .data(pubs)
                .join(
                    enter => enter.append("circle")
                        .attr("class", (d) => { return `Pub_RestaurantId${d.id} show-on-pubTab` })
                        .attr("cx", (d) => mapXScale(d.x))
                        .attr("cy", (d) => mapYScale(d.y))
                        .attr("r", 3)
                        .style("visibility", "hidden")
                        .attr("fill", "red")
                        .on("click", (event, d) => {
                            //console.log("Clicked datapoint: ", d);
                            const circ = d3.select(event.currentTarget);
                            if (circ.attr("r") == 3) {
                                circ.attr("fill", "red")
                                    .attr("r", 5);
                                // Circle selected
                                selected_pubs.push(d.id)
                                draw_pub_charts(svg_line, false, d.id, bp_margin)
                            }
                            else if (circ.attr("r") == 5) {
                                circ.attr("fill", "red")
                                    .attr("r", 3);
                                // Circle unselected
                                selected_pubs.push(d.id)
                                draw_pub_charts(svg_line, false, d.id, bp_margin)
                            }
                        }),
                    update => update
                        .attr("cx", (d) => mapXScale(d.x))
                        .attr("cy", (d) => mapYScale(d.y))
                        .attr("fill", (d) => "red")
                        .attr("r", (d) => 3),
                    exit => exit.remove()
                );

        }
        );

}

function draw_pub_charts(svg, by_region, pub_id, margin) {
    Promise.all([d3.csv("./Data/PubRes(RevFoot).csv")]).then(function (d) {
        d = d[0];
        week = getSliderValue()
        //console.log(week)
        d = d.filter(d => d.Week_number <= week);
        //console.log(d)
        drawPubLineChart(svg, false, d, pub_id, bp_margin);
        return d;
    });
}

function drawPubLineChart(svg, by_region, data, selected_pub_id, margin) {

    //console.log("margin: ", margin.top)
    var { width, height } = bp_config.pub_line_chart;
    var innerHeight = height - bp_margin.top - bp_margin.bottom;
    var innerWidth = width - bp_margin.left - bp_margin.right

    max_week = d3.max(data, function (d) { return +d.Week_number })
    var x = d3
        .scaleLinear()
        .domain([1, max_week,])
        .range([0, innerWidth])

    if (max_week > 10) {
        max_week = 10
    }

    // change x axis
    svg.select(".x-axis")
        .transition()
        .duration(1000)
        .call(d3.axisBottom(x).ticks(max_week));

    var y = d3
        .scaleLinear()
        .domain([
            0, d3.max(data, function (d) { return +d.Revenue }),
        ])
        .range([innerHeight, 0])

    // change y axis
    svg.select(".y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y).ticks(10));


    var unique_pubs = Array.from(d3.group(data, (d) => d.Pub_RestaurantId).keys());
    var unique_regions = Array.from(d3.group(data, (d) => d.region).keys());
    var pub_id_range = d3.extent(unique_pubs, d => +d);

    var myColor = d3
        .scaleSequential()
        .domain(pub_id_range)
        .interpolator(d3.interpolateViridis);
    var color;

    if (by_region == true) {
        for (region of unique_regions) {
            let newArray = data.filter(function (d) {
                return d.region == region
            })
            color = myColor(region)
            var avg_by_week_data = d3
                .nest()
                .key(function (d) {
                    return +d.Week_number
                })
                .rollup(function (v) {
                    return {
                        avg_rev: d3.mean(v, function (d) {
                            return d.Revenue
                        }),
                    }
                })
                .entries(newArray)
            avg_by_week_data.sort(function (a, b) {
                return d3.ascending(Number(a.key), Number(b.key))
            })
            addLineChart(svg, avg_by_week_data, x, y, color, region, by_region, data)
        }
    } else {
        for (pub_id of unique_pubs) {
            if (pub_id == selected_pub_id) {
                let newArray = data.filter(function (d) {
                    return d.Pub_RestaurantId == pub_id
                })
                color = myColor(pub_id)

                // get average Revenue by week for pub
                var avg_by_week_data = d3.rollup(
                    newArray,
                    (v) => ({ avg_rev: d3.mean(v, (d) => d.Revenue) }),
                    (d) => +d.Week_number
                );

                // turn weekly average into array
                const avg_by_week_array = Array.from(
                    avg_by_week_data,
                    ([Week_number, { avg_rev }]) => ({ Week_number, avg_rev })
                );

                // Sort array by week, for line chart
                avg_by_week_array.sort(function (a, b) {
                    return d3.ascending(Number(a.Week_number), Number(b.Week_number));
                });

                addLineChart(svg, avg_by_week_array, x, y, color, pub_id, by_region, data);
            }
        }
    }
}

function addLineChart(svg, avg_by_week_data, x, y, color, pub_id, by_region, all_data) {
    //console.log(avg_by_week_data)
    // Define the div for the tooltip
    var { width_bp, height_bp } = bp_config.pub_line_chart;
    const innerHeight = height_bp - bp_margin.top - bp_margin.bottom;
    const innerWidth = width_bp - bp_margin.left - bp_margin.right;
    var div = d3
        .select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('fill', 'blue')
        .style('opacity', 0)
        .style('font', '16px sans-serif')
        .style('position', 'absolute')


    svg.append('path')
        .datum(avg_by_week_data)
        .attr("class", "line")
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 1.5)
        .attr(
            'd',
            d3.line()
                .x(function (d) {
                    return x(Number(d.Week_number))
                })
                .y(function (d) {
                    return y(+d.avg_rev)
                })
        )
        .on('mouseover', function (event, d) {
            d3.select(this)
                .transition()
                .duration(50)
                .attr('opacity', '.55')
                .attr('stroke-width', 4.5);

            div.transition().duration(200).style('opacity', 0.7);
            if (by_region == true) {
                div.html('<b>Cluster: ' + (+pub_id + 1) + '</b>')
                    .style('left', event.pageX + 'px')
                    .style('top', event.pageY - 30 + 'px');
            } else {
                div.html('<b>Pub Id: ' + pub_id + '</b>')
                    .style('left', event.pageX + 'px')
                    .style('top', event.pageY - 30 + 'px');
            }
        })
        .on('mouseout', function (event, d) {
            div.transition().duration(500).style('opacity', 0)
            d3.select(this)
                .transition()
                .duration('50')
                .attr('opacity', '1')
                .attr('stroke-width', 1.5)
        })
        .on('click', function () {
            drawCandleChart(pub_id, by_region, all_data)

        })


}

function createCandleChart(margin) {
    /*
          Creates base line graph and svg. Does not add data
      */

    // Define the width and height of the graph

    const { width, height } = bp_config.candle_chart;

    // Calculate the inner width and height of the graph
    const innerWidth = width - bp_margin.left - bp_margin.right;
    const innerHeight = height - bp_margin.top - bp_margin.bottom;

    const pubCandleChart = d3.select("#candle_chart");
    // Create a group element for the graph

    const candleGraph = pubCandleChart
        .append("g")
        .attr("transform", `translate(${bp_margin.left},${bp_margin.top})`)
        .attr("id", "pubCandleGraph");

    // Define the scales for the x and y axes
    const x = d3.scaleLinear().domain([0, 1]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, 1]).range([innerHeight, 0]);

    // Create the x and y axes
    const xAxis = d3.axisBottom(x).tickValues([0, 1]).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(y);

    // Add the x and y axes to the graph
    candleGraph
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis);
    candleGraph.append("g").attr("class", "y-axis").call(yAxis);


    // Add the y-axis label
    candleGraph
        .append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - bp_margin.left)
        .attr("x", 0 - innerHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Footfall of Restaurant or Pub");

    // Add x-axis label
    candleGraph
        .append("text")
        .attr(
            "transform",
            "translate(" + innerWidth / 2 + " ," + (innerHeight + 40) + ")"
        )
        .style("text-anchor", "middle")
        .text("Week Number");

}


function drawCandleChart(pub_id, by_region, data) {

    var { width, height } = bp_config.candle_chart;
    var innerHeight = height - bp_margin.top - bp_margin.bottom;
    var innerWidth = width - bp_margin.left - bp_margin.right - 30


    const svg = d3.select("#pubCandleGraph");

    // select all existing rects and lines
    var rects = svg.selectAll('#pubCandleGraph.rect.candle')
    var stems = svg.selectAll('#pubCandleGraph.line.stem')

    // remove the data associated with the rects and lines
    rects.data([]).exit().remove()
    stems.data([]).exit().remove()

    var newArray = data
    if (by_region == false) {
        newArray = data.filter(function (d) {
            return d.Pub_RestaurantId == pub_id
        })
    }

    if (by_region == true) {

        var x = d3
            .scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.Week_number }),])
            .range([0, innerWidth])

        // change x axis
        svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x).ticks(d3.max(newArray, function (d) { return +d.Week_number })));

        var y = d3
            .scaleLinear()
            .domain([0, d3.max(newArray, function (d) { return +d.avg_high }),])
            .range([innerHeight, 0])

        // change y axis
        svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y).ticks(10));

        // get average candlestick data by week for pub
        var avg_by_week_data = d3.rollup(
            newArray,
            (v) => ({ avg_high: d3.mean(v, (d) => d["avg_high"]), avg_low: d3.mean(v, (d) => d["avg_low"]), avg_open: d3.mean(v, (d) => d["avg_open"]), avg_close: d3.mean(v, (d) => d["avg_close"]) }),
            (d) => +d.Week_number
        );

        // turn weekly average into array

        var avg_by_week_array = Array.from(
            avg_by_week_data,
            ([Week, { avg_high, avg_low, avg_open, avg_close }]) => ({ Week, avg_high, avg_low, avg_open, avg_close })
        );
        //console.log("before candle", avg_by_week_array)

        drawCandles(svg, avg_by_week_array, x, y, true)
    }

    if (by_region == false) {
        var x = d3
            .scaleLinear()
            .domain([0, d3.max(data, function (d) { return +d.Week_number }),])
            .range([0, innerWidth])

        // change x axis
        svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x).ticks(max_week));

        var y = d3
            .scaleLinear()
            .domain([0, d3.max(newArray, function (d) { return +d.High }),])
            .range([innerHeight, 0])

        // change y axis
        svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y).ticks(10));


        // get average candlestick data by week for pub
        var avg_by_week_data = d3.rollup(
            newArray,
            (v) => ({ avg_high: d3.mean(v, (d) => d["High"]), avg_low: d3.mean(v, (d) => d["Low"]), avg_open: d3.mean(v, (d) => d["Open"]), avg_close: d3.mean(v, (d) => d["Close"]) }),
            (d) => +d.Week_number
        );

        // turn weekly average into array
        var avg_by_week_array = Array.from(
            avg_by_week_data,
            ([Week, { avg_high, avg_low, avg_open, avg_close }]) => ({ Week, avg_high, avg_low, avg_open, avg_close })
        );

        // Sort Array by week
        avg_by_week_array.sort(function (a, b) {
            return d3.ascending(Number(a.Week_number), Number(b.Week_number))
        })

        drawCandles(svg, avg_by_week_array, x, y, by_region)

    }

}

function drawCandles(svg, avg_by_week_data, x, y, by_region) {

    svg.selectAll('rect.candle')
        .data(avg_by_week_data)
        .join(
            enter => enter.append('rect')
                .attr("class", "candle")
                .attr('x', function (d) {
                    if (by_region == true) {
                        console.log("data at x", x(Number(d.Week)))
                        return (
                            x(Number(d.Week)) - ((0.5 * (width + 3 * bp_margin.left)) / avg_by_week_data.length)/ 2
                        )
                    }
                    else {
                        return (
                            x(Number(d.Week)) - ((0.5 * (width + 3 * bp_margin.left)) / avg_by_week_data.length) / 2
                        )
                    }

                })
                .attr('y', function (d) {
                    var y_val = y(d3.max([+d.avg_open, +d.avg_close]))
                    return y_val
                })
                .attr('height', function (d) {
                    var min_val = y(d3.min([+d.avg_open, +d.avg_close]))
                    var max_val = y(d3.max([+d.avg_open, +d.avg_close]))
                    return min_val - max_val
                })
                .attr('width', function (d) {
                    return (
                        (0.5 * (width + 3 * bp_margin.left)) / avg_by_week_data.length
                    )
                })
                .attr('fill', function (d) {
                    return d.avg_open > d.avg_close ? 'red' : 'green'
                })
                .attr('opacity', 0)
                .transition()
                .duration(500)
                .attr('opacity', 1),
            update => update
                .attr('y', function (d) {
                    var y_val = y(d3.max([+d.avg_open, +d.avg_close]))
                    return y_val
                })
                .attr('fill', function (d) {
                    return d.avg_open > d.avg_close ? 'red' : 'green'
                })
                .attr('height', function (d) {
                    var min_val = y(d3.min([+d.avg_open, +d.avg_close]))
                    var max_val = y(d3.max([+d.avg_open, +d.avg_close]))
                    return min_val - max_val
                })
                .transition()
                .duration(10000),
            exit => exit
                .transition()
                .duration(1000)
                .attr('opacity', 0)
                .remove()
        );

    svg.selectAll('line.stem')
        .data(avg_by_week_data)
        .join('line')
        .attr('class', 'stem')
        .attr('x1', function (d) {
            if (by_region == true) {
                console.log("data at x1", x(Number(d.Week)) )
                return (
                    x(Number(d.Week))
                )
            }
            else {
                return (
                    x(Number(d.Week) )
                )
            }
        })
        .attr('x2', function (d) {
            if (by_region == true) {
                return (
                    x(Number(d.Week) )
                )
            }
            else {
                return (
                    x(Number(d.Week))
                )
            }
        })
        .attr('y1', d => y(d.avg_high))
        .attr('y2', d => y(d.avg_low))
        .attr('stroke', d => d.avg_open > d.avg_close ? 'red' : 'green');
}

function clear_pub_lines() {
    d3.selectAll('#publineGraph path.line').remove()
    d3.selectAll('#pubCandleGraph rect.candle').remove()
    d3.selectAll('#pubCandleGraph line.stem').remove()
}

function pubViewKmeans() {

    Promise.all([d3.csv("./Data/PubRes(RevFoot).csv")]).then(function (d) {
        d = d[0];
        week = getSliderValue()
        //console.log(week)
        d = d.filter(d => d.Week_number <= week);
        allData = d
        var avg_by_week_data = d3.rollup(
            allData,
            (v) => ({ avg_rev: d3.mean(v, (d) => d["Revenue"]), avg_high: d3.mean(v, (d) => d["High"]), avg_low: d3.mean(v, (d) => d["Low"]), avg_open: d3.mean(v, (d) => d["Open"]), avg_close: d3.mean(v, (d) => d["Close"]) }),
            (d) => +d.Pub_RestaurantId
        );
        // turn weekly average into array
        var avg_by_week_array = Array.from(
            avg_by_week_data,
            ([Pub_RestaurantId, { avg_rev, avg_high, avg_low, avg_open, avg_close }]) => ([Pub_RestaurantId, avg_rev, avg_high, avg_low, avg_open, avg_close])
        );
        // Call K Means
        const k = 5;
        const maxIterations = 300;
        console.log(avg_by_week_array)

        var unique_pubs = Array.from(d3.group(allData, (d) => d.Pub_RestaurantId).keys());

        var pub_cluster = {}
        unique_pubs.forEach((key, i) => pub_cluster[key] = kmeans_pub[i]);


        // Calculate average by cluster and week
        const cluster_week_data = d3.rollup(
            allData,
            v => ({
                avg_rev: d3.mean(v, d => d["Revenue"]),
                avg_high: d3.mean(v, d => d["High"]),
                avg_low: d3.mean(v, d => d["Low"]),
                avg_open: d3.mean(v, d => d["Open"]),
                avg_close: d3.mean(v, d => d["Close"])
            }),
            d => [pub_cluster[d.Pub_RestaurantId], d.Week_number]
        );


        // Turn the rollup data into an array
        const data = Array.from(
            cluster_week_data,
            ([cluster_week, { avg_rev, avg_high, avg_low, avg_open, avg_close }]) => ({
                Cluster: cluster_week[0],
                Week_number: cluster_week[1],
                avg_rev: avg_rev,
                avg_high: avg_high,
                avg_low: avg_low,
                avg_open: avg_open,
                avg_close: avg_close
            })
        );
        // console.log(cluster_week_array);

        const svg_line = d3.select("#publineGraph");
        const svg_candle = d3.select("#pubCandleGraph");

        var { width, height } = bp_config.pub_line_chart;
        var innerHeight = height - bp_margin.top - bp_margin.bottom;
        var innerWidth = width - bp_margin.left - bp_margin.right

        max_week = d3.max(data, function (d) { return +d.Week_number })
        var x_line = d3
            .scaleLinear()
            .domain([1, max_week,])
            .range([0, innerWidth])

        if (max_week > 10) {
            max_week = 10
        }

        // change x axis
        svg_line.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x_line).ticks(max_week));

        //console.log("Data y Domain ", data)
        var y_line = d3
            .scaleLinear()
            .domain([
                0, d3.max(data, function (d) { return +d.avg_rev }),
            ])
            .range([innerHeight, 0])

        // change y axis
        svg_line.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y_line).ticks(10));



        // console.log(pub_cluster)
        var cluster_color = d3
            .scaleOrdinal()
            .domain([0, 1, 2, 3, 4])
            .range(["red", "yellow", "green", "blue", "purple"]);
        let map = d3.select('#map');
        map
            .selectAll("circle.show-on-pubTab")
            .style("fill", (d, i) => {
                const rect = d3.select(d.currentTarget);
                return cluster_color(pub_cluster[d.id])
            })
            .on("click", function (event, d) {

                //console.log("clicked in cluster")
                //console.log("Clicked datapoint: ", d);
                const circ = d3.select(event.currentTarget);
                if (circ.attr("r") == 3 & getClusterValue() != "cluster") {
                    circ.attr("fill", "red")
                        .attr("r", 5);
                    // Circle selected
                    selected_pubs.push(d.id)
                    draw_pub_charts(svg_line, false, d.id, bp_margin)
                }

            });


        //console.log("Data:", data)
        var filterdata = []
        for (label in [0, 1, 2, 3, 4]) {
            filterdata = data.filter(d => d.Cluster == label);


            const avg_by_cluster_data = d3.rollup(
                filterdata,
                (v) => ({
                    avg_rev: d3.mean(v, (d) => d.avg_rev),
                    avg_high: d3.mean(v, (d) => d.avg_high),
                    avg_low: d3.mean(v, (d) => d.avg_low),
                    avg_open: d3.mean(v, (d) => d.avg_open),
                    avg_close: d3.mean(v, (d) => d.avg_close),
                }),
                (d) => d.Week_number + "-" + d.Cluster
            );

            // Convert the result to an array of objects
            const avg_by_cluster_array = Array.from(
                avg_by_cluster_data,
                ([cluster_week, { avg_rev, avg_high, avg_low, avg_open, avg_close }]) => ({
                    Cluster: parseInt(cluster_week.split("-")[1]),
                    Week_number: cluster_week.split("-")[0],
                    avg_rev,
                    avg_high,
                    avg_low,
                    avg_open,
                    avg_close,
                })
            );

            var y_line = d3
                .scaleLinear()
                .domain([
                    0, d3.max(avg_by_cluster_array, function (d) { return +d.avg_rev }),
                ])
                .range([innerHeight, 0])

            // change y axis
            svg_line.select(".y-axis")
                .transition()
                .duration(1000)
                .call(d3.axisLeft(y_line).ticks(10));

            addLineChart(svg_line, avg_by_cluster_array, x_line, y_line, cluster_color(label), label, true, filterdata)
        }






        return d;
    });




}

function removeKmeansView() {
    let map = d3.select('#map');
    map
        .selectAll("circle.show-on-pubTab")
        .style("fill", (d, i) => {
            clear_pub_lines()
            return "red"
        })
        .style("r", 3)
        .on("click", function (event, d) {
            const circ = d3.select(event.currentTarget);
            if (circ.attr("r") == 3 & getClusterValue() != "cluster") {
                circ.attr("fill", "red")
                    .attr("r", 5);
                // Circle selected
                const svg_line = d3.select("#publineGraph");
                selected_pubs.push(d.id)
                draw_pub_charts(svg_line, false, d.id, bp_margin)
            }
        })

    map.selectAll("circle.show-on-pubTab").raise();

}
