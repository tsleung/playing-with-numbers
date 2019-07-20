define([
  'jquery',
  'd3',
  'tf',
  'utils/mean',
  '../invest/ispy/fetch_single_stock_history',
  'utils/pct_change',
], function($,d3,tf,mean,fetch_single_stock_history,pct_change) {

  console.log('d3',d3)
  return async () => {

    const dataset = new Array(10).fill(0).map(() => {
      return [Math.random(), Math.random()];
    });
    graph(dataset);

    console.log('rling',tf);
    const spy = await fetch_single_stock_history('SPY');
    const vix = await fetch_single_stock_history('VIX');
    const qqq = await fetch_single_stock_history('QQQ');
    const dia = await fetch_single_stock_history('DIA');
    const iwm = await fetch_single_stock_history('DIA');
    console.log('spy', spy);
    console.log('vix', vix);
    console.log('qqq', qqq);


    function create_trial(options) {
      const num_periods = 90;
      const period_length = 1;
      const leverage = options.leverage || 1;
      const series = options.series || spy;
      
      const backtest = new Array(num_periods) // create 50 trading periods
        .fill(convert_series_to_pct_change(series, period_length)) // make each period use weekly return
        .map((weekly_returns) => { // randomly select one of the weekly returns
          return weekly_returns[Math.floor(Math.random() * weekly_returns.length)];
        });
      const result = backtest.reduce((accum, period) => {
          return accum * (period.close_change*leverage + 1);
        }, 1); // reduce by multiplying return, starting at 

      return {result, backtest}
    }

    function exponential_mean(series) {
      const product = series.reduce((a,b) => a*b)
      return Math.pow(product, 1/series.length);
    }


    function series_analysis(series) {
      return [1,1.1,1.2,1.4,1.5,1.6,1.7,1.8,1.9,2,2.1,2.2,2.3,2.4,2.5,2.6,2.7,2.8,2.9,3].filter((n,i) => i % 2).map(leverage => {
        // make n sample runs for p period (in create trial it's 50 weeks)
        // make series shorter to be recent (3000 trading days)
        const trials = new Array(1000).fill({leverage, series}).map(create_trial);
        const exponential_mean_return = exponential_mean(trials.map(t => t.result));
        const mean_return = mean(trials.map(t => t.result));
        console.log('trial',leverage,exponential_mean_return, mean_return,trials);
      });  
    }
    
    console.log('spy');
    series_analysis(spy.slice(0,4000));
    console.log('dia');
    series_analysis(dia.slice(0,4000));
    console.log('qqq');
    series_analysis(qqq.slice(0,4000));
    console.log('iwm');
    series_analysis(iwm.slice(0,4000));

    const spy_day_vix = to_vix_combo(convert_series_to_pct_change(spy,5).slice(0,5000), vix,5);
    console.log(spy_day_vix);

    const model = tf.sequential();
    model.add(tf.layers.dense({units:2, inputShape:2, activation: 'relu'}));
    model.add(tf.layers.dense({units:2, activation: 'relu'}));
    model.compile({loss: loss, optimizer: 'sgd'});

    return;
    console.log('below/up 15')
    console.log(analyze(spy_day_vix.filter(combo => combo.vix < 15)));
    console.log(analyze(spy_day_vix.filter(combo => combo.vix > 15)));
    graph(spy_day_vix);
  };

  function value(vix_combo) {
    if(vix_combo.inputs.length > 0) {
      throw new Error('inputs lengths should be greater than 0')
    }

    window.internal_cache = window.internal_cache || {};
    vix_combo.inputs
  }
  
  function policy() {

  }

  function analyze(vix_combo) {
    const change = vix_combo.map(combo => combo.change).sort();
    return {
      mean: mean(change),
      q1: change[Math.round(vix_combo.length * .25)],
      q2: change[Math.round(vix_combo.length * .5)],
      q3: change[Math.round(vix_combo.length * .75)],
      change,
    };
  }

  function to_vix_combo(series,vix, period) {
    if(!period) {
      throw new Error(`period must be defined`)
    }
    return series.map((e,i) => {
      return {
        inputs: [vix[i+period].close],
        change: e.close_change,
        vix: vix[i+period].close,
      };
    });
  }

  function convert_series_to_pct_change(series, period) {
    period = period || 1;
    if(series.length + period < 2000 + period) {
      throw new Error(`Series needs to be at least ${2000+period} length`)
    }
    
    return series.map((e, i, arr) => {
      e.close_change = arr[i+period] ? pct_change(arr[i+period].close, arr[i].close) : undefined;
      return e;
    }).slice(0, series.length - period);
  }

  function graph(dataset){



    // 2. Use the margin convention practice 
    var margin = {top: 50, right: 50, bottom: 50, left: 50}
    , width = window.innerWidth - margin.left - margin.right // Use the window's width 
    , height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

    // 5. X scale will use the index of our data
    var xScale = d3.scaleLinear()
    .domain([0, 1]) // input
    .range([0, width]); // output

    // 6. Y scale will use the randomly generate number 
    var yScale = d3.scaleLinear()
    .domain([0, 1]) // input 
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
        return xScale(d[0]);
      })
      .attr('cy', (d) => {
        return yScale(d[1]);
      })
      .attr('r', 1);


    const labels = svg
      .selectAll('text')
      .data(dataset)
      .enter()
      .append('text')
      .attr('x', (d) => {
        return xScale(d[0]);
      })
      .attr('y', (d) => {
        return yScale(d[1]);
      })
      .text((d,i) => {
        return i;
      });
      
    var line = d3.line()
      .x(function(d, i) { return xScale(d[0]); }) // set the x values for the line generator
      .y(function(d) { return yScale(d[1]); }) // set the y values for the line generator 
      .curve(d3.curveMonotoneX) // a
      
    svg.append("path")
    .datum(dataset) // 10. Binds data to the line 
    .attr('stroke', '#ffab00')
    .attr("class", "line") // Assign a class for styling 
    .attr("d", line); // 11. Calls the line generator 
      

  }
});



function loss(pred, label){
  console.log('pred', pred.data());
  console.log('label', label.data());
  const loss = pred.sub(label).square().mean();
  console.log('loss', loss);
  return loss;
}

