define(['tf','rh','utils/pct_change','jquery'], (tf, rh,pct_change,$) => {

  return async () => {
    console.log('ranker')
    const model = create_model();
    // create pair
    // const universe = await create_close_universe_fs(['SPY','XLK','XLV','XLF','XLP','XLY','XLE','XLU','XLP']);
    const universe = await create_close_universe_fs(['XLF','XLE']);
    console.log('universe', universe);
    // train
    const training_data = create_training_data(universe);
    console.log('created training data', training_data);
    await train(model, training_data.inputs, training_data.outputs);
    console.log('training complete', model)
    // validation
    const validation_data = create_validation_data(universe);
    const results = await validate(model, validation_data.inputs, validation_data.outputs);
    console.log('results', results, results.filter(x => x === 1))

    window.api = {
      model, universe, train, validate
    };

  };

  async function validate(model, inputs, outputs) {
    const results = [];
    for(var i = 0; i < inputs.length; i++) {
      const result = await predict(model, inputs[i]);
      const correct = (result > .5 ? 1 : 0) == outputs[i];
      results.push(correct ? 1 : 0);
    }
    return results;
  }

  function create_validation_data(universe, start, end) {
    start = start || 0;
    end = end || 100;
    return create_competitive_matrix(universe, start, end);
  }

  function create_training_data(universe, start, end) {
    start = start || 0;
    end = end || 100;
    return create_competitive_matrix(universe, start, end);
  }

  function create_competitive_matrix(universe, start, end) {
    const inputs = [];
    const outputs = [];

    // create competitive matrix
    for (var first in universe) {
      for (var second in universe) {
        // don't do the same to itself
        if(first !== second) {
          for( var i = start; i < end; i++) {
            const pair = create_pair(universe[first], universe[second], i)
            inputs.push(pair.inputs);
            outputs.push(pair.outputs);
          }
        }
      }
    }

    return {inputs, outputs};
  }

  function create_pair(first, second, i) {
    const first_output = first[i];
    const second_output = second[i];
    const first_features = features(first, i+1);
    const second_features = features(second, i+1);

    const outputs = (first_output > second_output) ? [0] : [1];
    const inputs = [...first_features, ...second_features];

    return {inputs, outputs};
  }

  function features(history, index) {
    return [2,3,5,8,13,21].map(fib => {
      return pct_change(history[index], history[index+fib]);
    });
  }

  function create_model() {
    const model = tf.sequential();
    model.add(tf.layers.dense({units:12, inputShape:12, activation: 'relu'}));
    model.add(tf.layers.dense({units:6, activation: 'relu'}));
    model.add(tf.layers.dense({units:1, activation: 'sigmoid'}));
    model.compile({loss: 'meanSquaredError', optimizer: 'sgd'});
    return model;
  }

  async function train(model, inputs, outputs) {
    return await model.fit(tf.tensor2d(inputs), tf.tensor2d(outputs), {
      batchSize: 8,
      epochs: 10,
    });
  }

  function universe_to_pct_change(universe) {
    const pct_change_universe = {};
    for(var symbol in universe) {
      const historical = universe[symbol];
      pct_change_universe[symbol] = historical.map((value, index) => {
        return historical[index+1] ?
          pct_change(historical[index], historical[index+1]) :
          0;
      });
      pct_change_universe[symbol].pop();
    }
    return pct_change_universe;
  }

  async function predict(model, features) {
    // console.log('features',features)
    // const outputs = await model.predict(tf.tensor2d([features])).as1D().data();
    // console.log('outputs', outputs)
    // return await outputs;

    const prediction = await model.predict(tf.tensor2d([features]))
    const outputs = await prediction.as1D().data();
    // console.log('predict', features, outputs);
    return outputs;
  }

  async function create_close_universe_fs(symbols) {
    return await Promise.all(symbols.map(symbol => {
      const url = `../data/${symbol}.csv`;
      return $.ajax({url});
    })).then((responses) => {
      console.log('responses', responses)
      return responses.map(response => response.split('\n'));
    }).then((responses) => {
      // strip headers and get close price
      console.log('responses', responses)
      return responses.map(response => {
        // reverse sort order to recent first
        response.reverse();
        // strip the header
        response.pop();
        // format each row
        return response
          .filter(day => day.split(',').length > 1) // get rid of invalid rows
          .map(day => day.split(',')[4]); // get close price
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
