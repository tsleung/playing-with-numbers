define(['../models/neural_network'],(neural_network) => {
  neural_network();
  return create_table_model();
});

function create_table_model() {

    // Value model is guided based on the policy chosen.
    const player_action_model = { // Model free control, combination of the policy and value models
      strategy_table: {}, // saving model from previous runs
      train: (step_size, inputs, outputs, optimal_outputs) => {
        const item = {
          dealer_total: inputs[0],
          player_total: inputs[1],
          action_index: outputs.findIndex(index => index == 1)
        }

        const delta = (outputs[0]==optimal_outputs[0] && outputs[1]==optimal_outputs[1]) ?
          step_size :     // increase on win
          step_size * -1; // decrease on loss

        player_action_model.strategy_table[item.dealer_total] = (player_action_model.strategy_table[item.dealer_total] || {});
        player_action_model.strategy_table[item.dealer_total][item.player_total] = player_action_model.strategy_table[item.dealer_total][item.player_total] || [.5,.5, 0];
        player_action_model.strategy_table[item.dealer_total][item.player_total][item.action_index] = Math.min(1,Math.max(0,player_action_model.strategy_table[item.dealer_total][item.player_total][item.action_index] + (delta)));
        player_action_model.strategy_table[item.dealer_total][item.player_total][2]++ // record keeping number of iterations
      },
      toHTML: () => {

          const strategy_table = player_action_model.strategy_table;

          const table_content = Object.keys(strategy_table).reduce((accum, dealer_total_index) => {
            const row_content = Object.keys(strategy_table[dealer_total_index]).reduce((accum, player_total_index) => {
              const state = strategy_table[dealer_total_index][player_total_index];
              const win_percentage = Math.round((state[0] > state[1] ? state[0] : state[1]) * 10000) / 100;

              const likely_outcome = win_percentage > 66 ? 'win' :
                win_percentage > 33 ? 'push' : 'lose';

              const outcome_color = {
                win: '#00bb00',
                push: '#ffbb00',
                lose: '#ff0000'
              }

              const cell = `<td style="padding: .25rem;color:${outcome_color[likely_outcome]};">${win_percentage}%</td>`;
              return accum + cell;
            }, '');
            return accum + `<tr><td>${dealer_total_index}</td>${row_content}</tr>`;
          }, '');


          const value_table_html = `<h1>Value table</h1> <table>
          <tr>
            <td></td>
            <td>4</td>
            <td>5</td>
            <td>6</td>
            <td>7</td>
            <td>8</td>
            <td>9</td>
            <td>10</td>
            <td>11</td>
            <td>12</td>
            <td>13</td>
            <td>14</td>
            <td>15</td>
            <td>16</td>
            <td>17</td>
            <td>18</td>
            <td>19</td>
            <td>20</td>
            <td>21</td>
          </tr>
          ${table_content}</table>
          `;
          return value_table_html;
      },
      determine_action: (features) => { // Table model, swap to any favorite model RF, NN, etc
        const dealer_total = features[0];
        const player_total = features[1];
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

}
