define(['tf','rxjs','invest/rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change',
  'invest/create_universe_fs', 'invest/create_universe_rh','invest/universe_to_pct_change','invest/append_line_graph'
],
  (tf,rxjs, rh,pct_change,$,mean,stdev,sum, nominal_to_percent_change,
    create_close_universe_fs, create_close_universe_rh,universe_to_pct_change,append_line_graph) => {
console.log('rx',rxjs)
  return () => {
    const bet_size_subject = new rxjs.Subject();
    bet_size_subject.pipe(
      rxjs.operators.startWith(0.01),
      rxjs.operators.tap((bet) => {
        $('.bet_size .current').html(bet);
      }),
      rxjs.operators.throttleTime(1000)
    )
    .subscribe((bet) => {
      console.log('new bet',bet)
      $('.simulation').empty();

      run_backtest(
        [286, .93],
        bet
      );
    });

    $('.bet_size input[type=range]').on('change input', (e) => {
      bet_size_subject.next(e.target.value);
    });

  };

  async function run_backtest(default_option_type, default_bet_size){
    console.log('rl_rank')

    const benchmark = await create_close_universe_fs(['SPY']);

    // discovery of weekly
    // const weekly_summary_spy = universe_to_pct_change(benchmark,5)['SPY'].slice(0,250*20);
    const daily_summary_spy = universe_to_pct_change(benchmark,1)['SPY'].slice(0,250*19);
    const weekly_summary_spy = universe_to_pct_change(benchmark,5)['SPY'].slice(0,250*19);
    console.log('benchmark', benchmark['SPY']);
    console.log('daily_summary_spy', daily_summary_spy);
    console.log('weekly_summary_spy', weekly_summary_spy);
    function option_profit(current, expected_pct_change, option_strike, option_price) {
      return (current+(current*expected_pct_change) - (option_strike + option_price)) / option_price;
    }

    // simple random sample test

    function generate_sample_backtest() {
      const index_pool = weekly_summary_spy.length;
      const calculated_returns = new Array(1 * 50)
        .fill(index_pool)
        .map((index_pool, i) => {
          const sample_index = Math.round(Math.random() * index_pool);
          // console.log('sample_index',sample_index)
          return sample_index;
        })
        .map(sample_index => { // calculate params
          const option_prices = [
            [272, 13.41],
            [274, 11.40],
            [276, 9.44],
            [278, 7.51],
            [280, 5.62],
            [282, 3.81],
            [284, 2.18], // bet .0375 mean 1.033811844302457 stdev 1.0149567657305945 sharpe 1.018577223393639
            [286, .93], //  bet .0250 mean 2.645945655175571 stdev 2.4293465850665688 sharpe 1.0891593943163391
            [288, .28],
            [290, .09],
          ];

          // const option_type = default_option_type || [288, .28];
          // const bet_size = default_bet_size || .0095;
          const option_type = default_option_type;
          const bet_size = default_bet_size;
          // const option_type = default_option_type || [284, 2.18];
          // const bet_size = default_bet_size || .0375;

          // const option_type = default_option_type || [284, 2.18];
          return {
            sample_index,
            option_type,
            bet_size
          };
        })
        .map((params, i) => { // calculate return
          const sample_index = params.sample_index;
          const bet_size = params.bet_size;
          const strike = params.option_type[0];
          const price = params.option_type[1];
          const sample_return = weekly_summary_spy[sample_index];
          // console.log('sample_return',sample_return)
          const current_price = 285.06;


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

    const backtests = new Array(10000).fill(0).map(v => {
      const result = generate_sample_backtest();
      const backtest = result.backtest;
      // console.log('backtest', backtest)
      return backtest;
    }).filter(val => {
      return !isNaN(val[val.length -1]);
    }).sort((a, b) => {
      const difference = pct_change(a[0],a[a.length -1]) - pct_change(b[0],b[b.length -1]);
      return difference;
    });

    const results = backtests.map(backtest => {
      return pct_change(backtest[0], backtest[backtest.length -1]);
    });

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

    // histogram
    const result_histogram = results.map(val => {
      return Math.round(val*10) + 1;
    }).reduce((accum, expected_return) => {
      if(accum[expected_return] != undefined) {
        accum[expected_return]++;
      }
      return accum;
    }, new Array(150).fill(0)).map((counts, expected_return) => {
      return {
        dependent: counts,
        independent: (expected_return - 1) / 10
      };
    });
    console.log('histogram', result_histogram)
    append_line_graph({
      data: result_histogram,
      append_target: '.simulation'
    });

    // graph sample of results, sorted worse to best

    backtests.filter((backtest, i) => {
        return (i % 200) == 0;
      })
      .map((backtest) => {
        const graph = backtest.map((val, i) => { // convert to graph format
          return {
            independent: i,
            dependent: val,
          };
        });

        append_line_graph({
          append_target: '.simulation',
          data: graph,
          y_range: [80,1000]
        });
      });

    function summary(results, name) {
      name = name || 'results';
      console.log(name.toUpperCase())
      console.log('mean', mean(results))
      console.log('stdev', stdev(results))
      console.log('.10', results[Math.round(results.length*.10)])
      console.log('.25', results[Math.round(results.length*.25)])
      console.log('.50', results[Math.round(results.length*.5)])
      console.log('.75', results[Math.round(results.length*.75)])
      console.log('.90', results[Math.round(results.length*.9)])
    }

    console.log('backtests', backtests);
    console.log('results', results);
    summary(results, 'results');
    summary(mean_drawdown, 'mean_drawdown');
    summary(max_drawdown, 'max_drawdown');
    summary(sharpe, 'sharpe');

    console.log('sharpe of all results', sharpe_ratio(results))
  };
});
/*
Rules to train agent
Max drawdown and drawdown are no different
Punish deviation from mean negative, not positive
Mean vs median return?

*/
