define([
  'tf','serializeJSON','rxjs','invest/rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change',
  'invest/create_universe_fs', 'invest/create_universe_rh','invest/universe_to_pct_change',
  'invest/append_line_graph', 'invest/sharpe_ratio', 'invest/sortino_ratio',
  './generate_sample_backtest',
  './printing_output'
],
  (
    tf,serializeJSON,rxjs, rh,pct_change,$,mean,stdev,
    sum, nominal_to_percent_change,
    create_close_universe_fs, create_close_universe_rh,universe_to_pct_change,
    append_line_graph, sharpe_ratio, sortino_ratio,
    generate_sample_backtest,
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
        bet_size: 0.015,
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
      print.print_summary(`.explore .summary`, backtests);
      print.append_simulation(`.explore .simulation`, backtests);
      console.log('EXPLORE');
      print.print_details(backtests);

    });

    $('.settings').on('change input', (e) => {
      const update = $('.settings').serializeJSON();
      settings.next(update);
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


    const backtests = new Array(1000).fill(0).map(v => {
      const result = generate_sample_backtest([
        {
          series: default_series,
          current_price: default_current_price,
          option_type: default_option_type,
          bet_size: (index) => { // can lookup features by index
            return Number(settings.bet_size);
          }
        }
      ]);
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

});
/*
Rules to train agent
Max drawdown and drawdown are no different
Punish deviation from mean negative, not positive
Mean vs median return?

*/
