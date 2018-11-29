const ACTIONS = {
  LONG: 1,
  HOLD: 0,
  SHORT: -1,
};

define([
  './fetch_single_stock_history',
  './option_chain_fetcher',
  'dt',
  '../sharpe_ratio',
  'utils/mean'
], function(
  fetch_historical,
  fetch_option_chain,
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
      let training_set = [];
      const historical = await Promise.all(securities.map(fetch_historical));
      const trained_model = train(3); // do something with trained model?
      

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
          
          training_set = ranked_series.map(agg => agg.series)
            .slice(0, ranked_series.length / 4)
            .concat(training_set)
            .slice(0,20000);

          return new dt.RandomForest({
            trainingSet: training_set,
            categoryAttr: 'action',
            ignoredAttributes: []
          }, 128);

        }, {predict: () => Math.round(Math.random() * 100)});
      }

      function run_simulation(historical, model) {
        const max_valid_index = Math.min.apply(Math, historical.map(arr=>arr.length)) - 201;
        // run n number of simulations trading our historical universe
        return new Array(1000).fill(historical).map(historical => {
          // for each series of our historical set, trade
          return historical.map(series => runTest(series));

          function runTest(series) {
            // generate sample periods to trade
            const indexes = new Array(50).fill(0).map(n => Math.floor(Math.random() * max_valid_index)).sort((a,b) => a - b);
            // for each index, calculate actions
            const trades = indexes.map(index => {
              const features = extract_features(series, index+1);
              const action = policy(features);
              const change = pct_change(series[index+1].close,series[index].close);
              const outcome = action == 1 ? 1+change : 1;
              return {index, action, outcome, features};
            });

            const outcomes = trades.map(trade => {

              const outcome = action == 1 ? 1+change : 1;

              return Object.assign({}, trade, {outcome});
            });

            return outcomes;
          }

          function policy(features) {
              const action =  Math.random() < .8 ?
                exploit(features):// exploit
                explore(features);// explore

              return action;
          }

          function extract_features(series, index) {
            return [1,2,3,5,8,13,21,34,55,89].map(fib => {
                const present = series[index].close;
                const past = series[index+fib].close;
                return pct_change(past, present);
            });
          }

          function explore(features) { // do nothing with features, random act
            return Math.random() > 1/2 ? ACTIONS.LONG : ACTIONS.SHORT;
          }

          function exploit(features) { // predict based on features
            const prediction = model.predict(features);
            const determine_action = () => ACTIONS[prediction];
            const throw_error = () => {
              throw new Error('Action undefined')
            };
            
            return prediction ?  determine_action() : throw_error();
          }
        });
      }
    }

});
