define([
  'tf','serializeJSON','rxjs','invest/rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change',
  'invest/create_universe_fs', 'invest/create_universe_rh','invest/universe_to_pct_change',
  'invest/append_line_graph', 'invest/sharpe_ratio', 'invest/sortino_ratio',
  './generate_sample_backtest'
],
  (
    tf,serializeJSON,rxjs, rh,pct_change,$,mean,stdev,
    sum, nominal_to_percent_change,
    create_close_universe_fs, create_close_universe_rh,universe_to_pct_change,
    append_line_graph, sharpe_ratio, sortino_ratio,
    generate_sample_backtest
  ) => {
console.log('rx',rxjs)
// continue refactoring backtests/measurement tools out of this filter
// this file should focus on the business case and answering specific targeted questiosn
// as those questions are answered, results should be presented in an actionable fashion
// e.g. what to buy, and how much of it

// multiplicative, average, additive
// power, normal, erlang
  return () => {

/*
    $.ajax({
      url: '/data/spy-option-chain.json'
    }).then(response => {
      console.log('options', response)
      return Promise.all(response.optionChain.result[0].expirationDates.slice(0,10).map(expiration_date => {
        return $.ajax({
          url: `https://query2.finance.yahoo.com/v7/finance/options/spy?date=${expiration_date}`
        })
      }));
    }).then(response => {
      console.log('options', response)
    });
    */
    const settings = new rxjs.Subject();
    settings.pipe(
      rxjs.operators.startWith({
        bet_size: 0.02,
        underlying: {
          symbol: 'SPY',
          price: 289.78,
        },
        option: {
          days_to_expiration: 4,
          strike: 288,
          price: -.41,
        }
    }),
      rxjs.operators.tap((settings) => {
        console.log('tap settings', settings);
        $('.settings .bet_size .current').html(settings.bet_size);
        $('.settings [name="bet_size"]').val(settings.bet_size);
        $('.settings [name="underlying[symbol]"]').val(settings.underlying.symbol);
        $('.settings [name="underlying[price]"]').val(settings.underlying.price);
        $('.settings [name="option[days_to_expiration]"]').val(settings.option.days_to_expiration);
        $('.settings [name="option[strike]"]').val(settings.option.strike);
        $('.settings [name="option[price]"]').val(settings.option.price);
      }),
      rxjs.operators.throttleTime(1000, undefined,{leading: true, trailing: true}),
      rxjs.operators.distinctUntilChanged()
    )
    .subscribe(async (settings) => {
      console.log('new bet',settings)
      $('.explore .summary').empty();
      $('.explore .simulation').empty();

      run_backtest(settings);
      const backtests = await run_backtest(settings);
      print_summary(`.explore .summary`, backtests);
      append_simulation(`.explore .simulation`, backtests);
      console.log('EXPLORE');
      print_details(backtests);

    });

    $('.settings').on('change input', (e) => {
      const update = $('.settings').serializeJSON();
      settings.next(update);
    });

    const watchlist = [
      {
        bet_size: 0.02,
        underlying: {
          symbol: 'SPY',
          price: 290.04,
        },
        option: {
          days_to_expiration: 4,
          strike: 290.5,
          price: .84,
        }
      },
      {
        bet_size: 0.02,
        underlying: {
          symbol: 'XLK',
          price: 74.96,
        },
        option: {
          days_to_expiration: 7,
          strike: 75.5,
          price: .31,
        }
      }
    ].forEach(async (settings) => {
      return;
      const backtests = await run_backtest(settings);
      print_summary(`.${settings.underlying.symbol.toLowerCase()} .summary`, backtests);
      console.log(settings.underlying.symbol);
      print_details(backtests);
    });

  };

  async function run_backtest(settings) {
    const default_symbol = settings.underlying.symbol;
    const default_current_price = Number(settings.underlying.price);
    const default_option_type = [
      Number(settings.option.strike), Number(settings.option.price)
    ];
    const default_bet_size = Number(settings.bet_size);
    const days_to_expiration = Number(settings.option.days_to_expiration);
    console.log('ispy', arguments)

    const benchmark = await create_close_universe_fs([default_symbol]);

    // discovery of weekly
    // const weekly_summary_spy = universe_to_pct_change(benchmark,5)['SPY'].slice(0,250*20);
    const daily_summary_spy = universe_to_pct_change(benchmark,1)[default_symbol].slice(0,250*11);
    const weekly_summary_spy = universe_to_pct_change(benchmark,days_to_expiration)[default_symbol].slice(0,250*11);
    const default_series = weekly_summary_spy;
    console.log('benchmark', benchmark[default_symbol]);
    console.log('daily_returns', daily_summary_spy);
    console.log('weekly_returns', weekly_summary_spy);

    // generate more backtests


    const backtests = new Array(10000).fill(0).map(v => {
      const result = generate_sample_backtest(default_series,
      default_symbol,
      default_current_price,
      default_option_type,
      default_bet_size,
      days_to_expiration
    );
      const backtest = result.backtest;
      // console.log('backtest', backtest)
      return backtest;
    }).filter(val => {
      return !isNaN(val[val.length -1]);
    }).sort((a, b) => {
      const difference = pct_change(a[0],a[a.length -1]) - pct_change(b[0],b[b.length -1]);
      return difference;
    });

    return backtests;
  };

  function print_summary(append_target, backtests) {

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

    console.log('results', results);
    summary(results, 'results');
  }

  function print_details(backtests) {

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
    summary(mean_drawdown, 'mean_drawdown');
    summary(max_drawdown, 'max_drawdown');
    summary(sharpe, 'sharpe');
  }

  function append_simulation(append_target, backtests) {
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
    console.log('.10', results[Math.round(results.length*.10)])
    console.log('.25', results[Math.round(results.length*.25)])
    console.log('.50', results[Math.round(results.length*.5)])
    console.log('.75', results[Math.round(results.length*.75)])
    console.log('.90', results[Math.round(results.length*.9)])
  }
});
/*
Rules to train agent
Max drawdown and drawdown are no different
Punish deviation from mean negative, not positive
Mean vs median return?

*/
