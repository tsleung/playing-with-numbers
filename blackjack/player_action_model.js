define(['./blackjack_value_model'],(blackjack_value_model) => {

  // Value model is guided based on the policy chosen. 
  const player_action_model = { // Model free control, combination of the policy and value models
    strategy_table: blackjack_value_model || {}, // saving model from previous runs
    determine_action: (dealer_total, player_total) => { // Table model, swap to any favorite model RF, NN, etc
      const action_value_model = (player_action_model.strategy_table[dealer_total] || {})[player_total] || [.5,.5];
      const stand_strategy = action_value_model[0];
      const hit_strategy = action_value_model[1];

      const random_policy = () => { // exploration
        return Math.random() < .5 ? 1 : 0;
      }

      const greedy_policy = () => { // exploitation
        return hit_strategy > stand_strategy ? 1 : 0;
      }

      const epsilon_greedy_policy = () => { // exploration + exploitation tradeoff
        const exploration_decay_rate = 1 / action_value_model[2]; // improve with confidence interval
        return Math.random() > exploration_decay_rate ? greedy_policy() : random_policy();
      }

      return epsilon_greedy_policy(); // Policy, in order to avoid a local optimum we balance exploration/exploitation
    }
  };

  return player_action_model;

});
