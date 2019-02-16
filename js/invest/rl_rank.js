define(['tf','rh','utils/pct_change','jquery','utils/mean', 'utils/stdev',
  'utils/sum','utils/nominal_to_percent_change',
  './create_universe_fs', './create_universe_rh','./universe_to_pct_change'
],
  (tf, rh,pct_change,$,mean,stdev,sum, nominal_to_percent_change,
    create_close_universe_fs, create_close_universe_rh,universe_to_pct_change) => {
  // For this program, we will generate each historical index t=-1 to t=0, and evaluate all fo the returns we made and their contribution to our overall return
  // Each of these returns have generated an expected REWARD. This REWARD is in proportion to the total reward.

  // Our POLICY will generate an allocation
  // Our VALUE is how much we favor one asset against another
  // we create our learning loop - run a validation set with predictions, see how much each contributed to the outcome
  // we reinforce the positive behavior (correct identification of opportunity) and punish wrong behavior (mis identification of opportunity)
  // we do this by attributing an expected value to a bet
  // after training, run again


  function policy(universe) {

    return []; // allocation of assets
  }


  return async () => {
    console.log('rl_rank')
    // const model = await tf.loadModel('localstorage://my-model-1');
    const model = create_model();

    model.compile({
      loss: 'meanSquaredError',
      optimizer: 'adam',
    });

    const benchmark = await create_close_universe_fs(['SPY']);
    const universe = await create_close_universe_fs(['XLK','XLV','XLF','XLP','XLY','XLE','XLU','XLP']);

    // train
    let training_data = create_competitive_benchmark(benchmark, universe,1000,4001,.01);

    console.log('created training data', new Date(), training_data);
    await train(model, training_data.inputs, training_data.outputs);
    console.log('training complete', new Date(), model)
    const saveResults = await model.save('localstorage://my-model-1');

    console.log('universe', universe);
    // validation
    let validation_data = create_competitive_benchmark(benchmark, universe,1000,2001,.1);

    let results = (await validate(model, validation_data.inputs, validation_data.outputs)).map(arr => {
      return [arr[0][0], arr[1][0]];
    });

    let successful_results = results.filter((arr,i) => {
      const result = (arr[0] > 0 ? 1 : 0) == (arr[1] > 0 ? 1 : 0);
      if(i%50 == 0) {console.log('result', result, arr[0], arr[1])}
      return result;
    });

    console.log(new Date(), 'results', successful_results.length / results.length, results, successful_results);

    return;

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

    const first_features = features(first, i+5);
    const second_features = features(second, i+5);

    // const outputs = (first_output > second_output) ? [0] : [1];
    // const outputs = [(second_output - first_output)]; // only for 1 day
    // find sharpe of the difference of second to first
    // convert to percent changes
    const first_output = nominal_to_percent_change(first.slice(i, i+5));
    const second_output = nominal_to_percent_change(second.slice(i, i+5));
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
      // return sharpe(nominal_to_percent_change(history.slice(index, index+fib)));
      return pct_change(history[index+fib],history[index]);
    });
  }

  function sharpe(interval) {
    const sharpe_ratio = mean(interval) / stdev(interval);

    return sharpe_ratio || 0;

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

});

(function () {
  const inputs = [.1,.3,.2,.2,.2];
  const outputs = [-1,4,2,-3,0].map((output, i) =>{
    return output * inputs[i];
  });
  const total = sum(outputs);
  const balance = inputs.map(input => input * total);
  console.log('outputs',outputs)
  console.log('balance',balance)
  console.log('total', total)

});
