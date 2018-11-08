define([
  'tf','serializeJSON','rxjs','invest/rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change','utils/laplace_rule',
  'invest/create_universe_fs', 'invest/create_universe_rh','invest/universe_to_pct_change',
  'invest/append_line_graph', 'invest/sharpe_ratio', 'invest/sortino_ratio',
  './generate_sample_backtest', './portfolio_bets', './option_chain_fetcher',
  './print'
],
  (
    tf,serializeJSON,rxjs, rh,pct_change,$,mean,stdev,
    sum, nominal_to_percent_change,laplace,
    create_close_universe_fs, create_close_universe_rh,universe_to_pct_change,
    append_line_graph, sharpe_ratio, sortino_ratio,
    generate_sample_backtest,portfolio_bets,option_chain_fetcher,
    print,
  ) => {
console.log('rx',rxjs)
// continue refactoring backtests/measurement tools out of this filter
// this file should focus on the business case and answering specific targeted questiosn
// as those questions are answered, results should be presented in an actionable fashion
// e.g. what to buy, and how much of it

// multiplicative, average, additive
// power, normal, erlang
  return () => {
    // should backtest during days which VIX was at similar levels, then following periods
    // need to check if this is a correct selection strategy e.g. VIX prediction?

    option_chain_fetcher('spy').then(resp => {
      console.log('respojnse', resp);
      run_backtest(portfolio_bets)

      // for each option we need to run a back test given performance characteristics
    }).catch(err => {
      console.log('disable cors check', err)
    });

    const settings = new rxjs.Subject();
    settings.pipe(
      rxjs.operators.startWith(
        // {
        //   bet_size: 0.02,
        //   underlying: {
        //     symbol: 'SPY',
        //     price: 293.33,
        //   },
        //   option: {
        //     days_to_expiration: 6,
        //     strike: 294,
        //     price: 0.67,
        //   }
        // }
        // {
        //   bet_size: 0.02,
        //   underlying: {
        //     symbol: 'SPY',
        //     price: 276.55,
        //   },
        //   option: {
        //     days_to_expiration: 4,
        //     strike: 277,
        //     price: 1.54,
        //   }
        // }
        {
          bet_size: 0.02,
          underlying: {
            symbol: 'SPY',
            price: 280.96,
          },
          option: {
            days_to_expiration: 5,
            strike: 282,
            price: 1.83,
          }
        }
      ),
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
      rxjs.operators.debounceTime(2500, undefined,{leading: false, trailing: true}),
      rxjs.operators.distinctUntilChanged()
    )
    .subscribe(async (settings) => {
      console.log('new bet',settings)
      $('.explore .summary').empty();
      $('.explore .simulation').empty();

      // run_backtest([settings]);
      const tests = await run_backtest([settings]);
      console.log('EXPLORE',tests);
      print.print_summary(`.explore .summary`, tests);
      print.append_simulation(`.explore .simulation`, tests);
      print.print_details(tests);
      console.log('tests', tests)

    });

    $('.settings').on('change input', (e) => {
      onSettingsUpdate();
    });
    function onSettingsUpdate() {
      const update = $('.settings').serializeJSON();
      settings.next(update);
    }

    onSettingsUpdate();
    (async function() {
      portfolio_bets.map(val => {
        val.bet_size = .02 / portfolio_bets.length;
        return val;
      })
      const tests = await run_backtest(portfolio_bets);
      console.log('Portfolio',tests);
      print.print_summary(`.portfolio .summary`, tests);
      print.append_simulation(`.portfolio .simulation`, tests);
      print.print_details(tests);
    // })();
    });
  };

  async function bet_from(settings) {
    const universe = await create_close_universe_fs([settings.underlying.symbol]);
    console.log('universe', universe)
    const series = universe_to_pct_change(
      universe,
      Number(settings.option.days_to_expiration)
    )[settings.underlying.symbol].slice(0,250*4);

    return {
      series: series,
      current_price: Number(settings.underlying.price),
      option_type: [
        Number(settings.option.strike), Number(settings.option.price)
      ],
      // never negative look on index
      bet_size: (index) => { // can lookup features by index
        const default_bet_size = Number(settings.bet_size);
        const explore = () => {
          // behave irrationally and bet
          return Promise.resolve(default_bet_size);
        };
        const greedy = () => {
          // be smart about it with what we know
          const last_day_pct_change = series[index];
          const bet_size = last_day_pct_change > 0 ?
            default_bet_size :
            default_bet_size;
          return Promise.resolve(bet_size);
        };
        const policy = Math.random() > .8 ?
          explore :
          greedy;

        return policy();
      }
    };
  }

  async function run_backtest(bets_settings) {
    const num_backtests = 4000;
    // skip promise all, negative performance?
    return new Promise(async (resolve) => {
      console.log('ispy', arguments)
      const bets = await Promise.all(bets_settings.map(bet_from));
      // generate more backtests
      const tests = [];
      new Array(num_backtests).fill(0).map(v => {
        const test = generate_sample_backtest.simple_random_backtest(bets);
        // console.log('backtest', backtest)
        test.then((test) => {
          tests.push(test);
          if(num_backtests == tests.length) {
            console.log('resolving',tests)
            resolve(tests);
          }
        });
        return test;
      });
    }).then(tests => {
      return tests.filter(test => {
        return !isNaN(test.backtest[test.backtest.length -1]);
      }).sort((testA, testB) => {
        const a = testA.backtest;
        const b = testB.backtest
        const difference = pct_change(a[0],a[a.length -1]) - pct_change(b[0],b[b.length -1]);
        return difference;
      });

    });
  };

});
