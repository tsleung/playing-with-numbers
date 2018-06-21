define(['../models/neural_network','./blackjack_nn_model'],(neural_network, saved_model) => {
  // create network
  const network_model = neural_network();
  // load synapses
  const load = () => {
    for (var i = 0; i < network_model.network.synapses.length; i ++) {
      if (saved_model.synapses.length > i) {
        network_model.network.synapses.weight = saved_model.synapses[i].weight;
      }
    }
  }
  //load();


  let iterations = [];
  const player_action_model = {
    model: network_model,
    train: (step_size, features, optimal_outputs) => {
      const error = network_model.train(features, optimal_outputs);
      if(Math.random() < .01) {
        iterations.unshift(error);
        iterations = iterations.slice(0,1000);
      }
    },
    forward: (features) => {
      return network_model.forward(features);
    },
    determine_action: (features) => {
      const action_value_model =  network_model.forward(features);

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


      return (epsilon_greedy_policy() == 0) ? [1,0] : [0,1]; // Policy, in order to avoid a local optimum we balance exploration/exploitation
    },
    toHTML: () => {
      const bars = iterations.reduce((accum, val) => {
        return accum + `<div style="width:${val*100}%;height:.125rem;border:1px solid #fa2;margin: 1px;background: blue;"></div>`
      });
      return `<div style="width:400px;background:#ddd;position:relative;">${bars}</div>`
      //return `<pre>${JSON.stringify(iterations, 0, 4)}</pre>`;
    }
  };

  return player_action_model;
});
