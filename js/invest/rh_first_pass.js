define(['require', 'rh','tf','utils/pct_change', 'utils/sum'],(require, rh, tf, pct_change, sum) => {
  const symbols = ['SPY','XLK','XLF','XLE','XLV','XLP','XLY','XLU','XLI'];
  return async () => {

    const universe = await create_close_universe(symbols)
    run_simulation(universe);

  };
// generate links to download all
// https://finance.yahoo.com/quote/XLE/history?period1=914313600&period2=1530169200&interval=1d&filter=history&frequency=1d
// https://query1.finance.yahoo.com/v7/finance/download/XLI?period1=914313600&period2=1530169200&interval=1d&events=history&crumb=8K7MxdAySpG
  function run_simulation(universe) {
        let index = 1;
        const lookback = index;
        let balance = 100;
        const model = create_model();
        model.train(index, lookback).then(() => {
          iterate();
        });

        return;

        function iterate() {
          // CREATE POSITIONS, even split
          const positions = model.forward(
            symbols.map(symbol => Math.floor(universe[symbol][index]))
          ).then(positions => {
            console.log('positions', positions)
            positions = positions.map(position => position*2 > positions[0] ? position-positions[0] : 0);
            const CASH = balance - value_positions(positions);
            if(CASH < 0) {
              throw new Error('NEGATIVE CASH');
            }
            console.log('positions before', JSON.stringify(positions,0,4));
            positions = tick(universe, positions, index);
            console.log('positions after', JSON.stringify(positions,0,4));
            console.log('balance', balance, value_positions(positions) + CASH)
            balance = value_positions(positions) + CASH;

            $('body').prepend($(`<div style="background:red;width:${balance/2}%;height:1px;" />`));


            if(index < lookback + 1) {
              index++;
              iterate();
            }
          });
        }


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

          model.add(tf.layers.dense({units:20, inputShape:num_inputs, activation: 'relu'}));
          model.add(tf.layers.dense({units:num_outputs, activation: 'softmax'}));
          // model.add(tf.layers.dense({units:num_outputs, activation: 'relu'}));
          model.compile({optimizer: 'sgd', loss: async function(input, output) {
            console.log('arguments',input, output);
            console.log('io',await input.as1D().data(), await output.as1D().data());
          }, lr:0.1});

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
                  const inputs = symbols.map(symbol => universe[symbol][current_index]);
                  inputs_historical.unshift(inputs);
                  const outputs = symbols.map(symbol => universe[symbol][current_index + 1]);
                  outputs_historical.unshift(outputs);
                  current_index++;
              }

              console.log('inputs',inputs_historical)
              console.log('outputs', outputs_historical)
              const training = model.fit(tf.tensor2d(inputs_historical), tf.tensor2d(outputs_historical), {
                batchSize: 8,
                epochs: 1
              });

              training.then(() => {
                console.log('trained_model')
            });


              return await training;

            },
          };
          // reward function is our balance, do we need sub goals?
          // set the reward function to penalize sub optimal performance

        }


  }
function create_close_universe(symbols) {
  return create_close_universe_rh(symbols);
}

function create_close_universe_fs(symbols) {
  return Promise.all(symbols.map(symbol => {
    const url = `../data/${symbol}.csv`;
    return $.ajax({url});
  })).then((responses) => {
    console.log('responses', responses)
    return responses.map(response => response.split('\n'));
  }).then((responses) => {
    // strip headers and get close price
    console.log('responses', responses)
    return responses.map(response => {
      response.shift();
      return response.map(day => day.split(',')[4]);
    });
  }).then(prices => {
    // reduce by symbols into universe
    const universe = {};
    for(var i = 0; i < symbols.length; i++){
      universe[symbols[i]] = prices[i];
    }
    return universe;
  });

}

  function create_close_universe_rh(symbols) {
    return rh.historical_quote(symbols).then((results) => {
      const close_price_universe = results.reduce((accum, result) => {
        accum[result.symbol] = result.historicals.map(entry => entry.close_price);
        return  accum;
      }, {});
      return close_price_universe;
    });
  }
});

function value_positions(positions) {
  return sum(Object.keys(positions).map(key => positions[key]));
}


function tick(universe, positions, index) {
  // update each position to the new position
  const updated_positions = positions.slice(0, positions.length);
  for( var i = 0; i < symbols.length; i++ ){
    const symbol = symbols[i]
    // look up in our universe what the percent change was
    const short_change = (1- 3*pct_change(universe['SPY'][index], universe['SPY'][index + 1]))
    const long_change = (1+ 3*pct_change(universe[symbol][index], universe[symbol][index + 1]))
    //console.log(symbol, index, index + 1, change)
    //console.log('change', change)
    updated_positions[i] = (updated_positions[i] * long_change * .6) + (updated_positions[i] * short_change * .3);
    // updated_positions[i] = (updated_positions[i] * change);
  };
  // return a summary of what occured this tick, metrics of sort?
  return updated_positions;
}
