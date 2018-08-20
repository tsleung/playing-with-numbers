define(['d3'], function(d3) {

  return (params) => {
    const data = params.data;
    const y_range = params.y_range;
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 660 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    // set the ranges
    var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the line
    var valueline = d3.line()
        .x(function(d) {
          return x(d.independent);
        })
        .y(function(d) {
          return y(d.dependent);
        });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");

      // Scale the range of the data
      // x.domain([
      //   d3.min(data, function(d) { return d.strike; }),
      //   d3.max(data, function(d) { return d.strike; })
      // ]);
      x.domain(d3.extent(data, function(d) { return d.independent; }));

      if (y_range) {
        y.domain(y_range);
      } else {
        y.domain(d3.extent(data, function(d) { return d.dependent; }));
      }

      /*
      y.domain([
        d3.min(data, function(d) { return d.profit; }),
        d3.max(data, function(d) { return d.profit; })
      ]);
      */
      // Add the valueline path.
      svg.append("path")
          .data([data])
          .attr("class", "line")
          .attr("d", valueline);

      // Add the X Axis
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));

      // Add the Y Axis
      svg.append("g")
          .call(d3.axisLeft(y));
  };
});
