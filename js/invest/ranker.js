define(['tf','rh','utils/pct_change','jquery','utils/mean', 'utils/stdev'], (tf, rh,pct_change,$,mean,stdev) => {
  // since this relatively ranks two securities, we can create competitive matrix, competitive benchmark, industry, broad market networks and average them?
  return async () => {
    console.log('ranker')
    const model = await tf.loadModel('localstorage://my-model-1');
    // const model = create_model();
    //http://ruder.io/optimizing-gradient-descent/index.html#gradientdescentoptimizationalgorithms
    model.compile({
      // loss: 'meanAbsoluteError',
      // loss: 'meanAbsolutePercentageError',
      loss: 'meanSquaredError',
      optimizer: 'adam',
      // optimizer: 'rmsprop'
      // optimizer: 'adagrad'
      // optimizer: 'sgd',
      // lr: 0.0000000001
    });
    // create pair, from holding csv
    // x.shift().filter((n, i) => (i % 8) == 0)
    const tech = ["AAPL", "MSFT", "FB", "GOOG", "V", "T", "INTC", "VZ", "CSCO", "MA", "NVDA", "ORCL", "IBM", "ADBE", "TXN", "ACN", "CRM", "QCOM", "PYPL", "AVGO", "MU", "ADP", "ATVI", "INTU", "AMAT", "CTSH", "EA", "HPQ", "ADI", "FIS", "TEL", "LRCX", "EBAY", "FISV", "ADSK", "APH", "GLW", "RHT", "DXC", "HPE", "PAYX", "MCHP", "NTAP", "WDC", "TWTR", "MSI", "FLT", "CTL", "KLAC", "XLNX", "GPN", "SWKS", "STX", "TSS", "AMD", "CTXS", "ANSS", "CA", "VRSN", "AKAM", "SNPS", "TTWO", "BR", "SYMC", "IT", "CDNS", "ADS", "FFIV", "QRVO", "JNPR", "WU", "FLIR", "IPGP", "XRX"];
    const benchmark = await create_close_universe_rh(['XLK']);
    const universe = await create_close_universe_rh([...tech]);

    // const benchmark = await create_close_universe_fs(['SPY']);
    // const universe = await create_close_universe_fs(['XLK','XLV','XLF','XLP','XLY','XLE','XLU','XLP']);

    // const universe = await create_close_universe_rh(['SPY','XLK','XLV','XLF','XLP','XLY','XLE','XLU','XLP']);
    // const universe = await create_close_universe_fs(['XLF','XLE']);

    console.log('universe', universe);
    // train
    // let training_data = create_competitive_matrix(universe, 50,210,.00005);
    let training_data = create_competitive_benchmark(benchmark, universe, 50,51,.5);
    // let training_data = create_competitive_benchmark(benchmark, universe, 50,180,1);
    // let training_data = create_competitive_benchmark(benchmark, universe, 1000,2000,1);

    console.log('created training data', new Date(), training_data);
    await train(model, training_data.inputs, training_data.outputs);
    console.log('training complete', new Date(), model)
    const saveResults = await model.save('localstorage://my-model-1');

    // validation
    // let validation_data = create_competitive_matrix(universe,0,50,.015);
    let validation_data = create_competitive_benchmark(benchmark, universe,50,51,.1);
    // let validation_data = create_competitive_benchmark(benchmark, universe,0,50,.5);
    // let validation_data = create_competitive_benchmark(benchmark, universe,0,1000,.05);
    // let validation_data = create_competitive_benchmark(benchmark, universe,1000,2000,.25);

    let results = (await validate(model, validation_data.inputs, validation_data.outputs)).map(arr => {
      return [arr[0][0], arr[1][0]];
    });

    let successful_results = results.filter((arr,i) => {
      const result = (arr[0] > 0 ? 1 : 0) == (arr[1] > 0 ? 1 : 0);

      if(i%50 == 0) {
        console.log('result', result, arr[0], arr[1])
      }

      return result;
    });

    console.log(new Date(), 'results', successful_results.length / results.length, results, successful_results);

    window.api = {
      model, universe, train, validate, create_competitive_matrix, results
    };
  };

  async function validate(model, inputs, outputs) {
    const results = [];
    for(var i = 0; i < inputs.length; i++) {
      const result = await predict(model, inputs[i]);
      // console.log('result', result)
      results.push([result, outputs[i]]);
    }
    return results;
  }


  function create_competitive_benchmark(benchmark, universe, start, end, sample) {
    const inputs = [];
    const outputs = [];

    // create competitive matrix
    for (var first in benchmark) {
      for (var second in universe) {
        // don't do the same to itself
        if(first !== second) {
          for( var i = start; i < end; i++) {
            if (Math.random() > sample) {continue;}
            const pair = create_pair(benchmark[first], universe[second], i);
            inputs.push(pair.inputs);
            outputs.push(pair.outputs);
          }
        }
      }
    }

    return {inputs, outputs};
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

    const first_features = features(first, i+50);
    const second_features = features(second, i+50);

    // const outputs = (first_output > second_output) ? [0] : [1];
    // const outputs = [(second_output - first_output)]; // only for 1 day
    // find sharpe of the difference of second to first
    // convert to percent changes
    const first_output = nominal_to_percent_change(first,i,i+50);
    const second_output = nominal_to_percent_change(second,i,i+50);
    const outputs = [sharpe(first_output.map((val, index) => {
      // find the difference between long/short
      return second_output[index] - first_output[index];
    }))];


    const inputs = [...second_features, ...first_features];
    // const inputs = first_features.map((val, i)=> {
    //   return second_features[i] - first_features[i];
    // });
    return {inputs, outputs};
  }

  function features(history, index) {
    return [1,2,3,5,8,13,21,54].map(fib => {
      return sharpe(nominal_to_percent_change(history,index, index+fib));
      // return pct_change(history[index], history[index+fib]);
    });
  }

  function sharpe(interval) {
    const sharpe_ratio = mean(interval) / stdev(interval);

    return sharpe_ratio || 0;

  }

  function nominal_to_percent_change(history, start, end) {
    const interval = history.slice(start, end).map((value, i) => {
      return pct_change(history[start + i], history[start + i + 1]);
    });

    return interval;
  }

  function create_model() {
    const model = tf.sequential();
    model.add(tf.layers.dense({units:16, activation: 'relu', inputShape:16, kernelRegularizer:'l1l2',biasRegularizer:'l1l2'}));
    model.add(tf.layers.dense({units:16, activation: 'relu',kernelRegularizer:'l1l2',biasRegularizer:'l1l2'}));
    // model.add(tf.layers.dense({units:8, activation: 'relu',kernelRegularizer:'l1l2',biasRegularizer:'l1l2'}));
    // model.add(tf.layers.dense({units:8, activation: 'relu',kernelRegularizer:'l1l2',biasRegularizer:'l1l2'}));
    model.add(tf.layers.dense({units:1, activation: 'linear'}));
    return model;
  }

  async function train(model, inputs, outputs) {
    return await model.fit(tf.tensor2d(inputs), tf.tensor2d(outputs), {
      batchSize: 1,
      epochs: 2
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
