define(['tf','rxjs'], (tf, rxjs) => {
  console.log(rxjs)
  // create program which selects features from universe
  // run trading simulation on N number of trading windows
  // create loss function for stdev of losses
  return async () => {
    // model
    const model = tf.sequential();

    model.add(tf.layers.dense({units:20, inputShape:2, activation: 'relu'}));
    model.add(tf.layers.dense({units:20, activation: 'relu'}));
    model.add(tf.layers.dense({units:2, activation: 'relu'}));



    model.compile({loss: loss, optimizer: 'sgd'});

    // Train the model.
    //for (let i = 0; i < 10; i++) {
     //optimizer.minimize(() => loss(model(xs), ys));
    //}

    const inputs = [[1,1],[2,2],[3,3],[5,5]];
    const outputs = [[1,1],[4,4],[9,9],[25,25]];
    const training =  await train(model, inputs, outputs);


    await predict(model, [3,3]);
    await predict(model, [5,5]);
    await predict(model, [7,7]);
  };

  function loss(pred, label){
    console.log('pred', pred.data());
    console.log('label', label.data());
    const loss = pred.sub(label).square().mean();
    console.log('loss', loss);
    return loss;
  }

  function extract_features() {

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
});
