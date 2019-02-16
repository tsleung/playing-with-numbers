define([
  './fetch_single_stock_history',
  './option_chain_fetcher',
  'dt',
  '../sharpe_ratio',
  'utils/mean',
  'utils/mean'
], function(
  fetch_historical,
  fetch_option_chain,
  dt,
  sharpe_ratio,
  mean,
  sum,
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

      let trainingSet = [];
      const historical = await Promise.all(securities.map(fetch_historical));
      const trained_model = train(20); // do something with trained model?

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

          trainingSet = [
            ...ranked_series.map(agg => {
              // const raw_performance = series.reduce((amt, trade) => trade.outcome * amt, 1);
              // const performance =  Math.round(raw_performance / series.length * 1000) / 1000;
              agg.series.performance = Math.round(agg.performance* 100)/100 || 0;
              return agg.series;
            }),
            ...trainingSet
          ].slice(0,20000);

          
          console.log('trainingSet', trainingSet);

          return new dt.RandomForest({
            trainingSet,
            categoryAttr: 'performance',
            ignoredAttributes: []
          }, 8);

        }, {predict: () => Math.random() * 2 - 1});
      }

      function run_simulation(historical, model) {
        const max_valid_index = Math.min.apply(Math, historical.map(arr=>arr.length)) - 201;
        // run n number of simulations trading our historical universe
        return new Array(80).fill(historical).map(historical => {
          // for each series of our historical set, trade
          return historical.map(series => runTest(series));

          function runTest(series) {
            // generate sample periods to trade
            const indexes = new Array(10).fill(0).map(n => Math.floor(Math.random() * max_valid_index)).sort((a,b) => a - b);
            return indexes.map(index => {
              const features = extract_features(series, index+1);
              const prediction = policy(features);
              const change = pct_change(series[index+1].close,series[index].close);
              const outcome = prediction > 0 ? 1+change : 1;
              return {index, prediction, outcome, features};
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
            return Math.random() * 2 - 1; //get a value between -1 and 1
          }

          function exploit(features) { // predict based on features
            const votes =  model.predict(features);
            let prediction
            if(!isNaN(votes)){
              prediction = votes;
            } else if (votes instanceof Object) {
              const num_votes = sum(Object.keys(votes));
              prediction = Object.keys(votes).reduce((accum, key) => {
                return accum + (key * votes[key]);
              }, 0) / num_votes;
            } else {
              debugger;
            }
            
            window.prediction = window.prediction || {};
            window.prediction[prediction] = (window.prediction[prediction] || 0) + 1;
            return prediction;
          }
        });
      }
    }
});