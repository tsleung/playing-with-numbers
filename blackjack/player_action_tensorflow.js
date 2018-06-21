define(['tf'],(tf) => {
  console.log('tf', tf);
  // Define a model for linear regression.
  const model = tf.sequential();

  model.add(tf.layers.dense({units:8, inputShape:2, activation: 'relu'}));
  model.add(tf.layers.dense({units:2, activation: 'sigmoid'}));
  model.compile({optimizer: 'sgd', loss: 'binaryCrossentropy', lr:0.1});

  const historical_inputs = [];
  const historical_outputs = [];

  const player_action_model = {
    bulk_train: () => {
      // console.log('training', historical_inputs.length)
      // https://groups.google.com/a/tensorflow.org/forum/#!topic/tfjs/TLb2JkOaTKw
      return model.fit(tf.tensor2d(historical_inputs), tf.tensor2d(historical_outputs), {
        batchSize: 16,
        epochs: 10
      });
    },
    train: (features, optimal_outputs) => {
      // Train the model using the data.

      // console.log('train', features, optimal_outputs)

      historical_inputs.unshift(features);
      historical_outputs.unshift(optimal_outputs);
      // historical_inputs = historical_inputs.slice(0,10000);
      // historical_outputs = historical_outputs.slice(0,10000);
      // online learning, batching writes https://www.youtube.com/watch?v=fevMOp5TDQs
      // need to pause between training sessions
      // player_action_model.bulk_train();
      // tf error:
      // Uncaught (in promise) TypeError: this.history[keys[n]][indices[n]].dispose is not a function
      // https://groups.google.com/a/tensorflow.org/forum/#!topic/tfjs/TLb2JkOaTKw

    },
    predict: (features) => {
      return active_promise.then(() => {
        return player_action_model.forward(features);
      });

    },
    forward: (features) => {
      // console.log('forward', features)
      return model.predict(tf.tensor2d([features]));
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
        const exploration_decay_rate = .01; // improve with confidence interval
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
