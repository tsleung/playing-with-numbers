define([
  'tf','serializeJSON','rxjs','invest/rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change',
  'invest/create_universe_fs', 'invest/create_universe_rh','invest/universe_to_pct_change',
  'invest/append_line_graph', 'invest/sharpe_ratio', 'invest/sortino_ratio'
],
  (
    tf,serializeJSON,rxjs, rh,pct_change,$,mean,stdev,
    sum, nominal_to_percent_change,
    create_close_universe_fs, create_close_universe_rh,universe_to_pct_change,
    append_line_graph, sharpe_ratio, sortino_ratio
  ) => {
  return generate_sample_backtest;

  function option_profit(current, expected_pct_change, option_strike, option_price) {
    return (current+(current*expected_pct_change) - (option_strike + option_price)) / option_price;
  }
  // simple random sample test

  function generate_sample_backtest(types_of_bets) {
    const max_series_length = Math.min.apply(undefined,(types_of_bets.map(bet => bet.series.length)));
    const period_returns = generate_scatter_backtest(max_series_length)
      .map(sample_index => { // calculate params for each index w/ features
        return types_of_bets.map(security => {
          return {
            sample_index,
            series: security.series,
            current_price: Number(security.current_price),
            bet_size: security.bet_size(sample_index),
            option_type: security.option_type.map(val => Number(val))
          };
        });
      })
    const calculated_returns = period_returns.map(calculate_returns);

    const backtest = evaluate_backtest(calculated_returns);

    return {
      calculated_returns,
      backtest
    };
  }

  function calculate_returns(params_arr) { // calculate return
    return params_arr.map(params => {
      const sample_index = params.sample_index;
      const bet_size = params.bet_size;
      const strike = params.option_type[0];
      const price = params.option_type[1];
      const sample_return = params.series[sample_index];
      const current_price = params.current_price;
      const calculated_return = option_profit(current_price, sample_return, strike, price);

      return {
        calculated_return,
        bet_size
      };
    });
  }

  function evaluate_backtest(calculated_returns) {
    return calculated_returns
      .reduce((accum, params_arr) => { // bankroll over time
        const current_bank = accum[accum.length - 1];
        const differences = params_arr.map(params => {
          const bet_size = params.bet_size;
          const calculated_return = params.calculated_return;
          // 100 * .2 * .1 + 100 = 102
          // 100 * 1 * .1 + 100 = 110
          const difference = (current_bank * bet_size * Math.max(calculated_return,-1));
          return difference;
        });

        const updated_bank = sum(differences) + current_bank
        accum.push(updated_bank);
        return accum;
      }, [1]);
  }
});

function generate_scatter_backtest(range) {
  const index_pool = range;
  return new Array(1 * 50)
  // const calculated_returns = new Array(index_pool)
    .fill(index_pool)
    .map((index_pool, i) => {
      const sample_index = Math.round(Math.random() * index_pool);
      // const sample_index = i;
      return sample_index;
    })
}
