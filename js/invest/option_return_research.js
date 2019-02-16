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
    const weekly_summary_spy = universe_to_pct_change(benchmark,5)['SPY'].slice(0,250*11);

    function option_profit(current, expected_pct_change, option_strike, option_price) {
      return (current+(current*expected_pct_change) - (option_strike + option_price)) / option_price;
    }

    // const weekly_expected_return = -0.01647627751395769; // .25
    /*
    272 "breakeven expected return" 0.0012278116887673568
    option_return_research.js:77 272 "profit" -0.3763406165644164
    option_return_research.js:76 274 "breakeven expected return" 0.00119273135480241
    option_return_research.js:77 274 "profit" -0.44181821650252423
    option_return_research.js:76 276 "breakeven expected return" 0.001333052690661599
    option_return_research.js:77 276 "profit" -0.5377889478949996
    option_return_research.js:76 278 "breakeven expected return" 0.0015786150284150305
    option_return_research.js:77 278 "profit" -0.6853166002834608
    option_return_research.js:76 280 "breakeven expected return" 0.001964498702027651
    option_return_research.js:77 280 "profit" -0.9353607950407123
    option_return_research.js:76 282 "breakeven expected return" 0.002631025047358451
    option_return_research.js:77 282 "profit" -1.4295873144695017
    option_return_research.js:76 284 "breakeven expected return" 0.003928997404055302
    option_return_research.js:77 284 "profit" -2.668223700976516
    option_return_research.js:76 286 "breakeven expected return" 0.006560022451413753
    option_return_research.js:77 286 "profit" -7.060997492611619
    option_return_research.js:76 288 "breakeven expected return" 0.011295867536658845
    option_return_research.js:77 288 "profit" -28.274027386174183
    option_return_research.js:76 290 "breakeven expected return" 0.017645407984283913
    option_return_research.js:77 290 "profit" -108.0747518680975
    */
    // const weekly_expected_return = 0.0; //
    // const weekly_expected_return = 0.0032811821189251034; // .5
    /*
    272 "breakeven expected return" 0.0012278116887673568
    option_return_research.js:88 272 "profit" 0.04364905106791601
    option_return_research.js:87 274 "breakeven expected return" 0.00119273135480241
    option_return_research.js:88 274 "profit" 0.052222260949193106
    option_return_research.js:87 276 "breakeven expected return" 0.001333052690661599
    option_return_research.js:88 276 "profit" 0.058827730383557306
    option_return_research.js:87 278 "breakeven expected return" 0.0015786150284150305
    option_return_research.js:88 278 "profit" 0.06462500330503167
    option_return_research.js:87 280 "breakeven expected return" 0.001964498702027651
    option_return_research.js:88 280 "profit" 0.06678536918519112
    option_return_research.js:87 282 "breakeven expected return" 0.002631025047358451
    option_return_research.js:88 282 "profit" 0.04864403538603055
    option_return_research.js:87 284 "breakeven expected return" 0.003928997404055302
    option_return_research.js:88 284 "profit" -0.08470927760515053
    option_return_research.js:87 286 "breakeven expected return" 0.006560022451413753
    option_return_research.js:88 286 "profit" -1.0050174464292776
    option_return_research.js:87 288 "breakeven expected return" 0.011295867536658845
    option_return_research.js:88 288 "profit" -8.159522232782836
    option_return_research.js:87 290 "breakeven expected return" 0.017645407984283913
    option_return_research.js:88 290 "profit" -45.49629139087996
    option_return_research.js:98
    */
    const weekly_expected_return = 0.014068096252620831; // .75
    /*
    272 "breakeven expected return" 0.0012278116887673568
    option_return_research.js:101 272 "profit" 0.2729494047555595
    option_return_research.js:100 274 "breakeven expected return" 0.00119273135480241
    option_return_research.js:101 274 "profit" 0.3219518875238685
    option_return_research.js:100 276 "breakeven expected return" 0.001333052690661599
    option_return_research.js:101 276 "profit" 0.38456054213687296
    option_return_research.js:100 278 "breakeven expected return" 0.0015786150284150305
    option_return_research.js:101 278 "profit" 0.4740681115542061
    option_return_research.js:100 280 "breakeven expected return" 0.001964498702027651
    option_return_research.js:101 280 "profit" 0.6139237576106893
    option_return_research.js:100 282 "breakeven expected return" 0.002631025047358451
    option_return_research.js:101 282 "profit" 0.8557090597826972
    option_return_research.js:100 284 "breakeven expected return" 0.003928997404055302
    option_return_research.js:101 284 "profit" 1.3258034485192989
    option_return_research.js:100 286 "breakeven expected return" 0.006560022451413753
    option_return_research.js:101 286 "profit" 2.3013457180344856
    option_return_research.js:100 288 "breakeven expected return" 0.011295867536658845
    option_return_research.js:101 288 "profit" 2.8223268491860916
    option_return_research.js:100 290 "breakeven expected return" 0.017645407984283913
    option_return_research.js:101 290 "profit" -11.330538691421074
    option_return_research.js:111
    */

    const current_price = 285.06;
    const option_prices = [
      [272, 13.41],
      [274, 11.40],
      [276, 9.44],
      [278, 7.51],
      [280, 5.62],
      [282, 3.81],
      [284, 2.18],
      [286, .93],
      [288, .28],
      [290, .09],
    ];

    const profits = option_prices.map(option => {
      const strike = option[0];
      const price = option[1];
      const profit = option_profit(current_price, weekly_expected_return, strike, price);
      const surplus_to_breakeven = (strike + price) - current_price;
      const breakeven_expected_return = surplus_to_breakeven / current_price;
      console.log(option[0],'breakeven expected return',breakeven_expected_return);
      console.log(option[0],'profit',profit);
      return {
        strike,
        price,
        profit,
        breakeven_expected_return
      };
    });


    console.log('weekly_summary_spy',weekly_summary_spy.sort(), stdev(weekly_summary_spy), mean(weekly_summary_spy))
    // end discovery of weekly
  };
});
