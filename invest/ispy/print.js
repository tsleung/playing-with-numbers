define([
  'tf','serializeJSON','rxjs','invest/rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change',
  'invest/append_line_graph', 'invest/sharpe_ratio', 'invest/sortino_ratio',

],  (
    tf,serializeJSON,rxjs, rh,pct_change,$,mean,stdev,
    sum, nominal_to_percent_change,
    append_line_graph, sharpe_ratio, sortino_ratio,
  ) => {

  return {
    summary,
    print_details,
    print_summary,
    append_simulation
  }

  function print_summary(append_target, tests) {
    const backtests = tests.map(test=>test.backtest);
    const results = backtests.map(backtest => {
      return pct_change(backtest[0], backtest[backtest.length -1]);
    });

    // histogram
    const result_histogram = results.map(val => {
      return Math.round(val*10) + 1;
    }).reduce((accum, expected_return) => {
      if(accum[expected_return] != undefined) {
        accum[expected_return]++;
      }
      return accum;
    }, new Array(50).fill(0)).map((counts, expected_return) => {
      return {
        dependent: counts,
        independent: (expected_return - 1) / 10
      };
    });
    console.log('histogram', result_histogram)
    append_line_graph({
      data: result_histogram,
      append_target
    });

    // console.log('results', results);
    summary(results, 'results');
  }

  function print_details(tests) {
    const backtests = tests.map(test=>test.backtest);
    const single_period_returns = tests
      .filter((val, i) => Math.random() < .05) // don't take every test
      .map(test => test.calculated_returns.map(bets => mean(bets.map(bet=>Math.max(-1,bet.calculated_return)))))
      .reduce((accum, val) => accum.concat(val),[])
      .sort((a,b) => a-b);
    const sharpe = backtests.map(backtest => {
      return sharpe_ratio(backtest);
    }).sort();

    const drawdown = backtests.map(backtest => {
      return backtest.reduce((accum, val) => {
          const last = accum[accum.length -1];
          const previous_high = last.previous_high > val ? last.previous_high : val;
          const current_drawdown = pct_change(previous_high, val);
          const record = {
            previous_high,
            current_drawdown
          };
          accum.push(record)
          return accum;
        }, [{previous_high: backtest[0], current_drawdown: 0}])
        .map(val => val.current_drawdown);
    });

    const max_drawdown = drawdown.map(backtest => {
      return Math.min.apply(undefined, backtest);
    }).sort();

    const mean_drawdown = drawdown.map(backtest => {
      return mean(backtest);
    }).sort();



    //console.log('backtests', backtests);
    summary(single_period_returns, 'single_period_returns');
    summary(mean_drawdown, 'mean_drawdown');
    summary(max_drawdown, 'max_drawdown');
    summary(sharpe, 'sharpe');
  }

  function append_simulation(append_target, tests) {
    const backtests = tests.map(test=>test.backtest);

    // graph sample of results, sorted worse to best
    backtests.filter((backtest, i) => {
        return (i % 500) == 0;
      })
      .map((backtest) => {
        const graph = backtest.map((val, i) => { // convert to graph format
          return {
            independent: i,
            dependent: val,
          };
        });

        append_line_graph({
          append_target,
          data: graph,
          y_range: [.8,10]
        });
      });

  }
  function summary(results, name) {
    name = name || 'results';
    console.log(name.toUpperCase())
    console.log('mean', mean(results))
    console.log('stdev', stdev(results))
    const output = [.1,.25,.4,.45,.5,.55,.6,.75,.90].map(percentile => {
      console.log(''+percentile, results[Math.round(results.length*percentile)])
    });

  }
})
