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
      return forrester;
  
      // with RL, we run a policy which explore/exploit our value model
      // with our trial outcomes we positive reinforce top half
      async function forrester() {
        console.log('forrester')
        const securities = [
          'SPY',
          // 'XLF',
          // 'XLK',
        ];
        let training_set = [];
        const historical = await Promise.all(securities.map(fetch_historical));
        console.log('waiting?')
        const trained_model = train(2); // do something with trained model?
        return;
  
        function train(iterations) {
          console.log('training')
          return new Array(iterations).fill(historical).reduce((model, historical, i) => {
            console.log('start')
            // run against historical data with a model
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
            }, 256);
  
          }, {predict: () => random_valuation()});
        }
  
  
        /*
        # Simulation 2.0
        Provides model to trade historical data
  
        ## Objectives
        - Avoid lookahead bias by using a model trained on observed past data
        - Performance gain by mapping policy per past index once 
  
        ## Algorithm
        1. Determine all valid test indexes (omitting max lookahead/lookbehind)
        2. Apply policy to each index, trained over all previous e.g. [1], [2,1], [3,2,1], [4,3,2,1] to simulate how we constantly include more data
        3. Training includes generating valuation for all securities during an index
        4. Based on the valuation we apply our exploitation/exploration policies
          - Exploration substitutes at random a valuation for individual securities, or adds noise
          - Exploitation uses valuation provided from our trained model
        5. Both polices will rank our securities and create a weighted long/short portfolio of strong vs weak assets
  
        ## Valuation
        Valuing securities will inject all features and use a model (RF/NN) to provide a 0-1 valuation
  
        ## Features
        Deriving features for analysis
        ### Random forest
        - Normalized features
          - Stdev of returns 
          - RSI
          - Bollinger band position
          - Moving average envelope position
          - Relative performance e.g. stdev of SPY vs XLK vs GOOG
        - Permutations between normalized features (difference e.g. RSI 14 - 50, products e.g. RSI 14 * 50)
        - Efficacy of feature over time period (either lookback e.g. last 14 days, period cycle e.g. given any 14 days)
        ### Neural network
        No manual feature extraction?.. Do I have the compute for this?
  
        ## Training
        Repeated monte carlo of best results over a past set will be used to generate a final model for an index
  
        ## Conventions
        - Decision determined will be index 0, returns will be negative, historical data positive e.g. Today/now 0, yesterday/this morning 1, tomorrow/this afternoon -1
        - Features should be statistically normalized using stdev and fixed benchmarks (e.g. VIX value)
        */
        function run_simulation(historical, model) {
          console.log('running sim')
          const MAX_LOOKAHEAD = 3;
          const MAX_LOOKBACK = Math.min.apply(Math, historical.map(arr=>arr.length)) - 201;
          const test_indexes = generate_test_indexes(MAX_LOOKAHEAD, MAX_LOOKBACK);
          console.log('test indexes', test_indexes);        
  
          const model_cache = {};
          model_cache[MAX_LOOKBACK] = () => Math.random();
          // can run this inside a reducer instead for all intervals later
          run_sim_for_index(historical, model, MAX_LOOKBACK);
  
          function run_sim_for_index(historical,model,index) {
            // training iterations
            const training_iterations = new Array(2).fill({}).reduce((accum, val, iteration) => {
              const backtests = new Array(10).fill(0).map(() => {
                const backtest = new Array(50).fill(0).map(() => {
                  // sample index
                  return Math.floor(Math.random() * (MAX_LOOKBACK - index)) + index;
                }).map((index) => {
                  const sim = run_sim_for_index(index);
                  
  
  
                });
  
                return {
                  backtest,
                };
              });
  
              return {
                backtests
              };
  
            });
          }
        }
  
        // applies model to historical data
        function run_simulation_deprecated(historical, model) {
          const MAX_LOOKAHEAD = 5;
          const MAX_LOOKBACK = Math.min.apply(Math, historical.map(arr=>arr.length)) - 201;
          // run n number of simulations trading our historical universe
          return new Array(1000).fill(historical).map(historical => {
            // for each series of our historical set, trade
            return historical.map(series => runTest(series));
  
            // create fictitious backtest
            function runTest(series) {
              // generate sample periods to trade
              const indexes = new Array(50).fill(0)
                // random value over the valid indexes in series, incremented by max lookahead to avoid future
                .map(n => Math.floor(Math.random() * MAX_LOOKBACK) + MAX_LOOKAHEAD)
                .sort((a,b) => a - b);
              // value index for each security
              const security_values = indexes.map(index => {
                const features = extract_features(series, index+TRADE_DURATION);
                const valuation = value(features);
  
                return {index, valuation, features};
              });
  
              const outcomes = security_values.map(security_value => {
                const change = pct_change(series[index+TRADE_DURATION].close,series[index].close);
                const outcome = security_value.value == 1 ? 1+change : 1;
  
                return Object.assign({}, {outcome});
              });
  
              return outcomes;
            }
  
            function value(features) {
                const valuation =  Math.random() < .8 ?
                  exploit(features):// exploit
                  explore(features);// explore
  
                return valuation;
            }
  
            function extract_features(series, index) {
              return [1,2,3,5,8,13,21,34,55,89].map(fib => {
                  const present = series[index].close;
                  const past = series[index+fib].close;
                  return pct_change(past, present);
              });
            }
  
            function explore(features) { // do nothing with features, random act
              return random_valuation();
            }
  
            function exploit(features) { // predict based on features
              const prediction = model.predict(features);
              const determine_action = () => ACTIONS[prediction];
              const throw_error = () => {
                console.log('prediction', prediction)
                throw new Error('Action undefined');
              };
              
              return validate_valuation(prediction) ?
                determine_action() : 
                throw_error();
            }
          });
        }
      }
  
  });
  
  function generate_test_indexes(MAX_LOOKAHEAD, MAX_LOOKBACK) {
    return new Array(MAX_LOOKBACK - MAX_LOOKAHEAD).fill(0)
      .reduce((accum, val, index) => ([...accum, index+MAX_LOOKAHEAD]),[])
      .reverse();
  }
  test_fn(generate_test_indexes, [
    [[0,1], [0]],
    [[5,6], [5]],
    [[0,3], [2,1,0]],
    [[5,8], [7,6,5]],
  ]);
  
  function invalid(value) {
    const error = new Error ('invalid value');
    console.error(error, value);
    throw error;
  }
  
  function validate(validation, value) {
    const valid = validation(value);
    return valid ? 
      value : 
      invalid(value);
  }
  
  function validate_valuation(valuation) {
    return valuation !== undefined && valuation >= 0 && valuation <= 1
  }
  
  function random_valuation() {
    return Math.random();
  }
  
  function test_fn(fn, cases) {
    return cases.map(([params, expected]) => {
      return JSON.stringify(fn.apply(undefined, params)) === JSON.stringify(expected);
    }).filter(result => !result).forEach(() => {
      throw new Error(`${fn.name} fail`);
    });
  }