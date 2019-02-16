// https://medium.com/tensorflow/a-gentle-introduction-to-tensorflow-js-dba2e5257702
define(['tf'],(tf) => {
  console.log('tf', tf);
  // Define a model for linear regression.
  const model = tf.sequential();

  model.add(tf.layers.dense({units:8, inputShape:2, activation: 'relu'}));
  model.add(tf.layers.dense({units:2, activation: 'sigmoid'}));
  model.compile({optimizer: 'sgd', loss: 'binaryCrossentropy', lr:0.1});

  const historical_inputs = [];
  const historical_outputs = [];
  let counter = 0;
  const player_action_model = {
    bulk_train: () => {
      // console.log('training', historical_inputs.length)
      // https://groups.google.com/a/tensorflow.org/forum/#!topic/tfjs/TLb2JkOaTKw
      return model.fit(tf.tensor2d(historical_inputs), tf.tensor2d(historical_outputs), {
        batchSize: 16,
        epochs: 10
      });
    },
    train: async (features, optimal_outputs) => {
      // Train the model using the data.

      // console.log('train', features, optimal_outputs)
      counter++;
      historical_inputs.unshift(features);
      historical_outputs.unshift(optimal_outputs);
      while (historical_inputs.length > 5000) { // tfjs crash limit
        historical_inputs.pop();
      }
      while (historical_outputs.length > 5000) { // tfjs crash limit
        historical_outputs.pop();
      }

      // online learning, batching writes https://www.youtube.com/watch?v=fevMOp5TDQs
      // need to pause between training sessions
      // player_action_model.bulk_train();
      // tf error:
      // Uncaught (in promise) TypeError: this.history[keys[n]][indices[n]].dispose is not a function
      // https://groups.google.com/a/tensorflow.org/forum/#!topic/tfjs/TLb2JkOaTKw
      if (counter % 1000 == 0) {
        try {
          const training = await player_action_model.bulk_train();
        } catch(e){
          console.error(e);
        }
      }
    },
    forward: async (features) => {
      // console.log('forward', features)

      const outputs = await model.predict(tf.tensor2d([features])).as1D().data();
      return outputs;
    },
    determine_action: (features) => {
      const action_value_model = player_action_model.forward(features);
      //action_value_model.print()
      const stand_strategy = action_value_model[0];
      const hit_strategy = action_value_model[1];

      const random_policy = () => { // exploration
        return Math.random() < .5 ? 1 : 0;
      }

      const greedy_policy = () => { // exploitation
        // console.log('greedy policy', hit_strategy, stand_strategy, hit_strategy > stand_strategy ? 1 : 0)
        return hit_strategy > stand_strategy ? 1 : 0;
      }

      const epsilon_greedy_policy = () => { // exploration + exploitation tradeoff
        const exploration_decay_rate = .05; // improve with confidence interval
        return Math.random() > exploration_decay_rate ? greedy_policy() : random_policy();
      }

      // off policy learning, explore the state space with random then train
      return random_policy() == 0 ? [1,0] : [0,1]
      // return (epsilon_greedy_policy() == 0) ? [1,0] : [0,1]; // Policy, in order to avoid a local optimum we balance exploration/exploitation
    },
    toHTML: () => {
      return '';
    }
  };

  return player_action_model;
});
