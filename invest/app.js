define(['rh','tf','utils/pct_change', 'utils/sum'],(rh, tf, pct_change, sum) => {
  const symbols = ['SPY','XLK','XLF','XLE','XLV','XLP','XLY','XLU','XLI'];
  return async () => {

    const universe = await create_close_universe(symbols)
    run_simulation(universe);

  };


  function run_simulation(universe) {
        let index = 20;
        const lookback = index;
        let balance = 50;
        const model = create_model();
        model.train(index, lookback);


        function iterate() {
          // CREATE POSITIONS, even split
          const positions = model.forward(
            symbols.map(symbol => Math.floor(universe[symbol][index]))
          ).then(positions => {
            console.log('positions', positions)
            const CASH = balance - value_positions(positions);
            if(CASH < 0) {
              throw new Error('NEGATIVE CASH');
            }
            console.log('positions before', positions);
            index = tick(universe, positions, index);
            console.log('positions after', positions);
            balance = value_positions(positions) + CASH;
            console.log('balance',balance);

            if(index < 21) {
              iterate();
            }
          });
        }
        iterate();

        return;

        // what is the investing game? higher score?
        // comparative benchmarking? trailing training?
        // monte carlo wins, and compare to other run_simulation
        // what could i have done better? why montecarlo when i have actual trades
        // optimizing each trade seems wrong, i should be optimizing the reward,
        // single portfolio performance

        // error should be based on minimizing loss of trailing past


        function create_model() {
          const num_inputs = symbols.length;
          const num_outputs = symbols.length;

          const model = tf.sequential();

          model.add(tf.layers.dense({units:9, inputShape:num_inputs, activation: 'relu'}));
          model.add(tf.layers.dense({units:num_outputs, activation: 'softmax'}));
          model.compile({optimizer: 'sgd', loss: 'binaryCrossentropy', lr:0.1});

          return {
            forward: async(features) => {
              console.log('features',features)
              const outputs = await model.predict(tf.tensor2d([features])).as1D().data();
              console.log('outputs', outputs)
              return await outputs;
            },
            train: async (index, lookback) => {
              let current_index = index - lookback;
              const inputs_historical = [];
              const outputs_historical = [];
              while (current_index < index) {
                  const inputs = symbols.map(symbol => universe[symbol[current_index]]);
                  inputs_historical.unshift(inputs);
                  const outputs = symbols.map(symbol => universe[symbol[current_index + 1]]);
                  outputs_historical.unshift(outputs);
                  current_index++;
              }

              return await model.fit(tf.tensor2d(inputs_historical), tf.tensor2d(outputs_historical), {
                batchSize: 16,
                epochs: 10
              });
            },
          };
          // reward function is our balance, do we need sub goals?
          // set the reward function to penalize sub optimal performance

        }

        function value_positions(positions) {
          return sum(Object.keys(positions).map(key => positions[key]));
        }


        function tick(universe, positions, index) {
          // update each position to the new position
          symbols.forEach(symbol => {
            // look up in our universe what the percent change was
            console.log(symbol, universe, index, index + 1, universe[symbol])
            const change = (1+pct_change(universe[symbol][index], universe[symbol][index + 1]))
            positions[symbol] = positions[symbol] * change;
          });
          // return a summary of what occured this tick, metrics of sort?
          return index + 1;
        }


  }


  function create_close_universe(symbols) {
    return rh.historical_quote(symbols).then((results) => {
      const close_price_universe = results.reduce((accum, result) => {
        accum[result.symbol] = result.historicals.map(entry => entry.close_price);
        return  accum;
      }, {});
      return close_price_universe;
    });
  }
});

// can create an alternating close/open period test too
const historical_close_example = {
  'SPY': [
    250, 240, 230
  ],
  'GOOG': [
    1000, 1100, 1200
  ],
};
