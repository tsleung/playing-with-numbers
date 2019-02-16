/**
 * Reinforcement learning for blackjack
 * inspired by AlphaZero and David Silver's RL lectures
 * https://github.com/dalmia/David-Silver-Reinforcement-learning
 *
 * This program achieves a win rate ~40%. Random policy has win rate of ~20%
 *
 * Standard blackjack with rule sophistication (double down, late surrender)
 * may help the player and account for deviation between win/loss rate
 *
 * Summarized Net Win in Blackjack
 *   EVENT  PROBABILITY
 *   Win    42.42%
 *   Push   8.48%
 *   Loss   49.09%
 * https://wizardofodds.com/games/blackjack/appendix/4/
 */
function blackjack() {
  const standard_deck = [ // a not so standard deck, simplified
    2,3,4,5,6,7,8,9,10,10,10,10,11
  ];

  const player_action_model = { // Model free control, combination of the policy and value models
    strategy_table: {}, // saving model from previous runs
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


  function playGame() { // We need to create a blackjack environment
    const action_history = [];

    const deck = shuffleArray([ // 4 'decks' combined for each suit
      ...standard_deck.slice(0),
      ...standard_deck.slice(0),
      ...standard_deck.slice(0),
      ...standard_deck.slice(0)
    ]);

    const player = { // create our player
      stand: false,
      bust: false,
      total: () => {
        let total = player.cards.reduce((sum, val) => val+sum, 0);
        let aces = player.cards.filter(val => val === 11).reduce((sum, val) => sum+1, 0);

        while (aces--) {
          total = total > 21 ? total - 11 : total;
        }

        return total;
      },
      cards: [deck.pop(), deck.pop()]
    };

    const dealer = { // create our dealer
      stand: false,
      bust: false,
      total: () => {
        let total = dealer.cards.reduce((sum, val) => val+sum, 0);
        let aces = dealer.cards.filter(val => val === 11).reduce((sum, val) => sum+1, 0);

        while (aces--) {
          total = total > 21 ? total - 11 : total;
        }

        return total;
      },
      cards: [deck.pop()]
    };


    while (!player.bust && !player.stand) { // agent: player turn
      const action_index = player_action_model.determine_action(dealer.total(), player.total());

      const action_strategy = [ // this must correspond to player_action_model
        () => {
          player.stand = true;
        },
        () => {
          player.cards.push(deck.pop());
        },
      ];

      const action = action_strategy[action_index];

      action_history.push({
        action_index, player_total: player.total(), dealer_total: dealer.total()
      });

      action();

      if(player.total() > 21) {
        player.bust = true;
      }
    }

    while (!dealer.bust && !dealer.stand && !player.bust) { // environment: dealer turn
      const action = dealer.total() < 17 ?
        () => dealer.cards.push(deck.pop()) :
        dealer.total() > 21 ?
          () => dealer.bust = true :
          () => dealer.stand = true;
      action();
    }

    return {
      result: {
        player: player.total(),
        dealer: dealer.total(),
        score: (player.bust || dealer.bust) ?
          (player.bust ? -1 : 1) :
          (player.total() > dealer.total()) ? 1 :
            (player.total() === dealer.total()) ? 0 : -1
      },
      player,
      dealer,
      action_history
    };
  }

  const steps = 100; // default 100
  const epochs = 10000; //10000;
  const step_size = .004; // .01 same as averaging 1 or 0 over 100, 1% change in probability
  const step_sizes = [step_size * -1, 0 , step_size]
  let game_results_history = []; // let rather than const since we need to modify window
  for (var i = 0; i < epochs*steps; i++) { // training loop
    if(i%10000 == 0) {
      console.log('thinking...');
      // console.log('game_results', JSON.stringify(game_results,0,4));
    }
    const game_results = playGame();
    game_results_history.unshift(game_results);
    game_results_history = game_results_history.slice(0, epochs); // keep only a window of games so we don't memory bloat

    game_results.action_history.forEach((item) => { // Monte carlo update
      const delta = (game_results.result.score == -1) ?
        step_size * -1 : // decrease on loss
        game_results.result.score == 1 ? step_size : 0; // increase on win

      player_action_model.strategy_table[item.dealer_total] = (player_action_model.strategy_table[item.dealer_total] || {});
      player_action_model.strategy_table[item.dealer_total][item.player_total] = player_action_model.strategy_table[item.dealer_total][item.player_total] || [.5,.5, 0];
      player_action_model.strategy_table[item.dealer_total][item.player_total][item.action_index] = Math.min(1,Math.max(0,player_action_model.strategy_table[item.dealer_total][item.player_total][item.action_index] + (delta)));
      player_action_model.strategy_table[item.dealer_total][item.player_total][2]++ // record keeping number of iterations
    });
  }

  const last_games = game_results_history.slice(game_results_history.length * .9, game_results_history.length);
  const tally_games = (sum, val) => {
    sum + val.result.score
    return {
      win: val.result.score === 1 ? sum.win + 1 : sum.win,
      loss: val.result.score === -1 ? sum.loss + 1 : sum.loss,
      draw: val.result.score === 0 ? sum.draw + 1 : sum.draw,
    };
  };

  // Output
  console.log('strategy_table', JSON.stringify(player_action_model.strategy_table,0,4));
  console.log('all games',game_results_history.reduce(tally_games, {win:0,loss:0,draw:0}), game_results_history.length);
  console.log('last games', last_games.reduce(tally_games, {win:0,loss:0,draw:0}), last_games.length);

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

  document.getElementsByTagName('body')[0].innerHTML = value_table_html;

  // 'Imports'
  /**
   * Randomize array element order in-place.
   * Using Durstenfeld shuffle algorithm.
   */
  function shuffleArray(array) {
      for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
      }
    return array;
  }
}
// Run
// const run_blackjack = prompt('Run blackjack?');
// !run_blackjack || blackjack();
blackjack();
