define(['tf','rh','utils/pct_change','jquery'], (tf, rh,pct_change,$) => {

  return async () => {
    console.log('ranker')
    const model = await tf.loadModel('localstorage://my-model-1');
    // const model = create_model();
    model.compile({loss: 'meanSquaredError', optimizer: 'adam'});
    // create pair
    //const universe = await create_close_universe_rh(['GOOG','AAPL','MSFT','IBM','ORCL','NFLX','AMZN','ADBE','FB']);
    const universe = await create_close_universe_fs(['SPY','XLK','XLV','XLF','XLP','XLY','XLE','XLU','XLP']);

    // const universe = await create_close_universe_fs(['XLF','XLE']);
    console.log('universe', universe);
    // train
    // let training_data = create_competitive_matrix(universe, 100,190,.5);
    let training_data = create_competitive_matrix(universe, 1000,4000,.02);
    console.log('created training data', new Date(), training_data);
    await train(model, training_data.inputs, training_data.outputs);
    console.log('training complete', new Date(), model)
    const saveResults = await model.save('localstorage://my-model-1');

    // validation
    // let validation_data = create_competitive_matrix(universe,0,100,.05);
    let validation_data = create_competitive_matrix(universe,0,1000,.01);
    let results = await validate(model, validation_data.inputs, validation_data.outputs);
    let successful_results = results.filter(arr => {
      return (arr[0] > .5 ? 1 : 0) == arr[1];
    });
    console.log('results', successful_results.length / results.length, results, successful_results);



    window.api = {
      model, universe, train, validate, create_competitive_matrix
    };
  };

  async function validate(model, inputs, outputs) {
    const results = [];
    for(var i = 0; i < inputs.length; i++) {
      const result = await predict(model, inputs[i]);
      console.log('result', result)
      results.push([result, outputs[i]]);
    }
    return results;
  }

  function create_competitive_matrix(universe, start, end, sample) {
    const inputs = [];
    const outputs = [];

    // create competitive matrix
    for (var first in universe) {
      for (var second in universe) {
        // don't do the same to itself
        if(first !== second) {
          for( var i = start; i < end; i++) {
            if (Math.random() > sample) {continue;}
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
    return [1,2,3,5,8,13,21,33,54].map(fib => {
      return pct_change(history[index], history[index+fib]);
    });
  }

  function create_model() {
    const model = tf.sequential();
    model.add(tf.layers.dense({units:18, inputShape:18, activation: 'relu'}));
    model.add(tf.layers.dense({units:18, activation: 'relu'}));
    model.add(tf.layers.dense({units:1, activation: 'relu'}));
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
