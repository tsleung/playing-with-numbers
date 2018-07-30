define(['tf','jquery'], (tf,$) => {

  /**
   * Create random runs from SPY and train returns
   * Run prediction on most recent data to figure out how well we did
   *
   */
  return async () => {
    // create spy universe
    const spy = (await create_close_universe_fs(['SPY']))['SPY'];


    // training data
    const holdout = spy.slice(0, 1000); // most recent as final test
    // split train/test set
    const data = spy.slice(1000, spy.length).reduce((accum, val) => {
      Math.random() < .75 ? accum.train.push(val) : accum.test.push(val);

      return accum;
    },{
      train: [],
      test: [],
      holdout
    });
  };
  console.log('spy', data)


  function extract_features() {

  }

  function create_model() {
    const model = tf.sequential();
    model.add(tf.layers.dense({units:20, inputShape:2, activation: 'relu'}));
    model.add(tf.layers.dense({units:20, activation: 'relu'}));
    model.add(tf.layers.dense({units:2, activation: 'relu'}));
    model.compile({loss: loss, optimizer: 'sgd'});
    return model;
  }

  async function train(model, inputs, outputs) {
    return await model.fit(tf.tensor2d(inputs), tf.tensor2d(outputs), {
      batchSize: 8,
      epochs: 1000
    });
  }

  async function predict(model, features) {
    const prediction = await model.predict(tf.tensor2d([features]))
    const outputs = await prediction.as1D().data();
    console.log('predict', features, outputs);
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
});
