define([
  'tf','serializeJSON','rxjs','invest/rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change','dt',
  'invest/create_universe_fs', 'invest/create_universe_rh','invest/universe_to_pct_change',
  'invest/append_line_graph', 'invest/sharpe_ratio', 'invest/sortino_ratio'
],
  (
    tf,serializeJSON,rxjs, rh,pct_change,$,mean,stdev,
    sum, nominal_to_percent_change,dt,
    create_close_universe_fs, create_close_universe_rh,universe_to_pct_change,
    append_line_graph, sharpe_ratio, sortino_ratio
  ) => {

  return {
    simple_random_backtest,
  };

  function option_profit(current, expected_pct_change, option_strike, option_price) {
    return (current+(current*expected_pct_change) - (option_strike + option_price)) / option_price;
  }

  function determine_max_series_length(types_of_bets) {
    return Math.min.apply(undefined,(types_of_bets.map(bet => bet.series.length)));
  }

  // simple random sample test
  function simple_random_backtest(types_of_bets, options) {
    const max_series_length = determine_max_series_length(types_of_bets);
    options = Object.assign({}, options, {
      periods: 50
    });

    const period_returns = generate_scatter_backtest(max_series_length, 50) // 50 periods
      .map(sample_index => { // calculate params for each index w/ features
        return types_of_bets.map(security => {
          const series = security.series;
          const current_price = Number(security.current_price);
          const option_type = security.option_type.map(val => Number(val));
          return security.bet_size(sample_index + 1).then(bet_size => {
            return {
              bet_size,
              sample_index,
              series,
              current_price,
              option_type,
            };
          });
        });
      });

    const calculated_returns = period_returns.map(period_returns => {
      // if our parameters are a promise due to the bet, we wait
      return Promise.all(period_returns).then(period_returns => calculate_returns(period_returns));
    });


    const backtest = Promise.all(calculated_returns)
      .then(calculated_returns => evaluate_backtest(calculated_returns));


    return Promise.all([Promise.all(calculated_returns), backtest]).then(args => {
      return {
        calculated_returns: args[0],
        backtest: args[1],
      };
    });
  }

  function calculate_returns(params_arr) { // calculate return
    return params_arr.map(params => {
      const sample_index = params.sample_index;
      const bet_size = params.bet_size;
      const strike = params.option_type[0];
      const price = params.option_type[1];
      const sample_return = params.series[sample_index];
      const current_price = params.current_price;
      // can't lose more than 100% on option
      const calculated_return = Math.max(-1,option_profit(current_price, sample_return, strike, price));

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

function generate_scatter_backtest(range, periods) {
  const index_pool = range;
  return new Array(1 * periods)
  // const calculated_returns = new Array(index_pool)
    .fill(index_pool)
    .map((index_pool, i) => {
      const sample_index = Math.round(Math.random() * index_pool);
      // const sample_index = i;
      return sample_index;
    })
    // sort so we don't have lookahead bias when training, largest -> smallest
    .sort((a,b) => b - a);

}
