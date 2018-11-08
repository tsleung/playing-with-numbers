define('vix_thresholds',[
  './fetch_single_stock_history',
  './option_chain_fetcher',
], async function(
  fetch_historical,
  fetch_option_chain,
) {
  // create vix thresholds
  const vix = await fetch_historical('VIX');
  const thresholds = new Array(20).fill(0).map((n,index)=>index+10).map(threshold => {
    return vix.map((day,index) => ({
        index,
        valid: day.close > threshold - .5 && day.close < threshold + .5
      }))
      .filter(index_check => index_check.valid)
      .map(index_check => index_check.index);
  });
  return thresholds;
});

define('strategy',['utils/pct_change'],(pct_change)=>{
  return (arr) => {

    return arr.map((day, index) =>{
      // given each day's return, how much is made with an option
    });
  };
});

define([
  './fetch_single_stock_history',
  './option_chain_fetcher',
  'strategy',
  'dt',
  '../sharpe_ratio',
  'utils/mean'
], function(
  fetch_historical,
  fetch_option_chain,
  strategy,
  dt,
  sharpe_ratio,
  mean,
) {
    return carver;

    // with RL, we run a policy which explore/exploit our value model
    // with our trial outcomes we positive reinforce top half
    async function carver() {
      const securities = [
        'SPY',
        // 'XLF',
        // 'XLK',
      ];

      const historical = await Promise.all(securities.map(fetch_historical));
      const trained_model = train(10); // do something with trained model?

      function train(iterations) {
        return new Array(iterations).fill(historical).reduce((model, historical, i) => {
          const simulation = run_simulation(historical, model);
          const ranked_series = simulation.flat().map(series => {
              const performance = series.reduce((amt, trade) => trade.outcome * amt, 1);
              return {series, performance};
            })
            .sort((a,b) => b.performance - a.performance);
          const performance = ranked_series.map(agg => agg.performance);
          console.log(i,'performance', mean(performance), sharpe_ratio(performance),performance);

          return new dt.RandomForest({
            trainingSet: ranked_series.map(agg => agg.series).slice(0, ranked_series.length / 5),
            categoryAttr: 'action',
            ignoredAttributes: []
          }, 128);

        }, {predict: () => Math.random() > 1/2 ? 1 : -1});
      }

      function run_simulation(historical, model) {
        const max_valid_index = Math.min.apply(Math, historical.map(arr=>arr.length)) - 201;
        // run n number of simulations trading our historical universe
        return new Array(8000).fill(historical).map(historical => {
          // for each series of our historical set, trade
          return historical.map(series => runTest(series));

          function runTest(series) {
            // generate sample periods to trade
            const indexes = new Array(100).fill(0).map(n => Math.floor(Math.random() * max_valid_index)).sort((a,b) => a - b);
            return indexes.map(index => {
              const features = extract_features(series, index+1);
              const action = policy(features);
              const change = pct_change(series[index+1].close,series[index].close);
              const outcome = action == 1 ? 1+change : 1;
              return {index, action, outcome, features};
            });
          }

          function policy(features) {
              return Math.random() < .8 ?
                exploit(features):// exploit
                explore(features);// explore
          }

          function extract_features(series, index) {
            return [1,2,3,5,8,13,21,34,55,89].map(fib => {
                const present = series[index].close;
                const past = series[index+fib].close;
                return pct_change(past, present);
            });
          }

          function explore(features) { // do nothing with features, random act
            return Math.random() > 1/2 ? 1 : 0;
          }

          function exploit(features) { // predict based on features
            return model.predict(features) || 0;
          }
        });
      }
    }

});
