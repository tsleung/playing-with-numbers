import React from 'react';
import logo from './logo.svg';
import './App.css';
import * as d3 from 'd3';
import {BaseType} from 'd3-selection';



const App: React.FC = () => {
  console.log('d3', d3);
  graph(new Array(10).fill(0).map((v,i) => ([i/10,Math.random()])));
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;


function graph(dataset: [number, number][]){

  // 2. Use the margin convention practice 
  var margin = {top: 50, right: 50, bottom: 50, left: 50}
  , width = window.innerWidth - margin.left - margin.right // Use the window's width 
  , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

  // 5. X scale will use the index of our data
  var x = d3.scaleLinear()
  .domain([Math.min(...dataset.map(v => v[0])), Math.max(...dataset.map(v => v[0]))]) // input 
  .range([0, width]); // output

  // 6. Y scale will use the randomly generate number 
  
  var y = d3.scaleLinear()
  .domain([Math.min(...dataset.map(v => v[1])), Math.max(...dataset.map(v => v[1]))]) // input 
  .range([height, 0]); // output 

  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const points = svg
    .selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('cx', (d) => {
      return x(d[0]);
    })
    .attr('cy', (d) => {
      return y(d[1]);
    })
    .attr('r', 1);


  const labels = svg
    .selectAll('text')
    .data(dataset)
    .enter()
    .append('text')
    .attr('x', (d) => {
      return x(d[0]);
    })
    .attr('y', (d) => {
      return y(d[1]);
    })
    .text((d,i) => {
      return i;
    });
    
  var line = d3.line()
    .x(function(d, i) { return x(d[0]); }) // set the x values for the line generator
    .y(function(d) { return y(d[1]); }) // set the y values for the line generator 
    .curve(d3.curveMonotoneX) // a
  
  svg.append("path")
    .datum(dataset) // 10. Binds data to the line 
    .attr('stroke', '#ffab00')
    .attr("class", "line") // Assign a class for styling 
    .attr("d", line); // 11. Calls the line generator 
    
  

    var mouseG = svg.append("g")
      .attr("class", "mouse-over-effects");

    mouseG.append("path") // this is the black vertical line to follow mouse
      .attr("class", "mouse-line")
      .style("stroke", "black")
      .style("stroke-width", "1px")
      .style("opacity", "0");
      
    let lines = Array.from(document.getElementsByClassName('line')).map(x => x as SVGPathElement) ;

    var color = d3.scaleOrdinal(d3.schemeCategory10);

    var mousePerLine = mouseG.selectAll('.mouse-per-line')
      .data(dataset)
      .enter()
      .append("g")
      .attr("class", "mouse-per-line");


    mousePerLine.append("text")
      .attr("transform", "translate(10,3)");
      mouseG.append('svg:rect') // append a rect to catch mouse movements on canvas
      .attr('width', width) // can't catch mouse events on a g element
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', function() { // on mouse out hide line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "0");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "0");
      })
      .on('mouseover', function() { // on mouse in show line, circles and text
        d3.select(".mouse-line")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line circle")
          .style("opacity", "1");
        d3.selectAll(".mouse-per-line text")
          .style("opacity", "1");
      })
      .on('mousemove', function () {        
        const mouse = d3.mouse(document.getElementsByTagName('rect')[0]);
        console.log('moving', mouse);
        d3.select(".mouse-line")
        .attr("d", function() {
          var d = "M" + mouse[0] + "," + height;
          d += " " + mouse[0] + "," + 0;
          return d;
        });

        d3.selectAll(".mouse-per-line")
          .attr("transform", function(d, i) {
            console.log(width/mouse[0])
            var xDate = x.invert(mouse[0]),
                bisect = d3.bisector(function(d) { return Date.now(); }).right,
                idx = bisect([], xDate);
            
            let pos: DOMPoint = new DOMPoint();
            
            if(lines[i] instanceof SVGPathElement) {
              var beginning = 0,
                end = lines[i].getTotalLength(),
                target = null;

            
            while (true){
              target = Math.floor((beginning + end) / 2);
              pos = lines[i].getPointAtLength(target);
              if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                  break;
              }
              if (pos.x > mouse[0])      end = target;
              else if (pos.x < mouse[0]) beginning = target;
              else break; //position found
            }
            
            d3.select(this).select('text')
              .text(y.invert(pos!.y).toFixed(2));
              
            }
            
            return "translate(" + mouse[0] + "," + pos.y +")";
          });

      });

}