define(['tf','rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change',
  './create_universe_fs', './create_universe_rh','./universe_to_pct_change','append_line_graph'
],
  (tf, rh,pct_change,$,mean,stdev,sum, nominal_to_percent_change,
    create_close_universe_fs, create_close_universe_rh,universe_to_pct_change,append_line_graph) => {

  return async () => {
    console.log('rl_rank')

    const benchmark = await create_close_universe_fs(['SPY']);

    // discovery of weekly
    const weekly_summary_spy = universe_to_pct_change(benchmark,5)['SPY'].slice(0,250*20);
    console.log('weekly_summary_spy', weekly_summary_spy)
    function option_profit(current, expected_pct_change, option_strike, option_price) {
      return (current+(current*expected_pct_change) - (option_strike + option_price)) / option_price;
    }

    // simple random sample test

    function generate_sample_backtest() {
      const index_pool = weekly_summary_spy.length;
      const calculated_returns = new Array(2 * 50)
        .fill(index_pool)
        .map((index_pool, i) => {
          const sample_index = Math.round(Math.random() * index_pool);
          // console.log('sample_index',sample_index)
          return sample_index;
        })
        .map(sample_index => { // calculate bet size
          const bet_size = .02;
          return {
            sample_index,
            bet_size
          };
        })
        .map((params, i) => { // calculate return
          const sample_index = params.sample_index;
          const bet_size = params.bet_size;
          const sample_return = weekly_summary_spy[sample_index];
          // console.log('sample_return',sample_return)
          const current_price = 285.06;
          const strike = 284;
          const price = 2.18;
          // const strike = 282;
          // const price = 3.81;
          // const strike = 280;
          // const price = 5.62;
          // const strike = 278;
          // const price = 7.51;
          // const strike = 272;
          // const price = 13.41;

          const calculated_return = option_profit(current_price, sample_return, strike, price);
          return {
            calculated_return,
            bet_size
          };
        })
      const backtest = calculated_returns
        .reduce((accum, params) => { // bankroll over time
          const current_bank = accum[accum.length - 1];
          const bet_size = params.bet_size;
          const calculated_return = params.calculated_return;
          // 100 * .2 * .1 + 100 = 102
          // 100 * 1 * .1 + 100 = 110
          const updated_bank = (current_bank * bet_size * Math.max(calculated_return,-1)) + current_bank;
          accum.push(updated_bank);
          return accum;
        }, [100]);

        return {
          calculated_returns,
          backtest
        }
    }
    generate_sample_backtest();
    // generate more backtests
    function sharpe_ratio(interval) {
      return mean(interval) / stdev(interval);
    }
    const backtests = new Array(1000).fill(0).map(v => {
      const result = generate_sample_backtest();
      const backtest = result.backtest;
      // console.log('backtest', backtest)
      return backtest;
    })
    const results = backtests.map(backtest => {
      return pct_change(backtest[0], backtest[backtest.length -1]);
    }).filter(val => !isNaN(val));

    // graph sample of results, sorted worse to best
    backtests.sort((a, b) => {
      const difference = a[a.length -1] > b[b.length -1];
      // console.log('difference', difference, a[a.length -1], b[b.length -1])
      return difference;
      })
      .filter((backtest, i) => {
        return (i % 100) == 0;
      })
      .forEach((backtest) => {
      const graph = backtest.map((val, i) => { // convert to graph format
        return {
          independent: i,
          dependent: val,
        };
      });

      append_line_graph({
        data: graph,
        // y_range: [80,120]
      });
    });
    console.log('results', results.sort())
    console.log('mean', mean(results))
    console.log('stdev', stdev(results))
    console.log('sharpe', sharpe_ratio(results));
    // setInterval(() => {
    //   generate_sample_backtest();
    // }, 500)

    // console.log('weekly_summary_spy',weekly_summary_spy.sort(), stdev(weekly_summary_spy), mean(weekly_summary_spy))
    // end discovery of weekly
  };
});
