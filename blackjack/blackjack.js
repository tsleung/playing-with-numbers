define(['./player_action_tensorflow'],(player_action_model) => {
  return blackjack;

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
        const action_index = player_action_model.determine_action([dealer.total(), player.total()]).findIndex(index => index == 1);

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

    const steps = 5; // default 100
    const epochs = 10000; //10000;

    let game_results_history = []; // let rather than const since we need to modify window
    for (var i = 0; i < epochs*steps; i++) { // training loop
      if(i% (epochs / 10) == 0) {
        console.log('thinking...');
        // console.log('game_results', JSON.stringify(game_results,0,4));
      }
      const game_results = playGame();
      game_results_history.unshift(game_results);
      game_results_history = game_results_history.slice(0, epochs); // keep only a window of games so we don't memory bloat
      // can apply eligibility trace, geometric decay further back
      game_results.action_history.forEach((item) => { // Monte carlo update
        // what features did i see
        const inputs = [
          item.dealer_total,
          item.player_total
        ];

        // did i hit or stay
        const outputs = [
          item.action_index == 0 ? 1 : 0,
          item.action_index == 1 ? 1 : 0,
        ];

        const train = (game_results.result.score == 1) ?
          () => player_action_model.train( inputs, [item.action_index == 0 ? 1 : 0, item.action_index == 1 ? 1 : 0]) :
          // () => {};
          () => player_action_model.train( inputs, [item.action_index == 0 ? 0 : 1, item.action_index == 1 ? 0 : 1]);

        train();

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


    player_action_model.bulk_train().then(() => {
      console.log('then')
      print_output();
    })
    function print_output() {

      //console.log('all games',game_results_history.reduce(tally_games, {win:0,loss:0,draw:0}), game_results_history.length,game_results_history);
      // console.log('last games', last_games.reduce(tally_games, {win:0,loss:0,draw:0}), last_games.length);


      // build a value table
      const value_table = {};
      let output = '';
      for(var i = 2; i <= 11; i ++){ // iterate for dealer hands
        for(var j = 2; j <= 21; j ++){ // iterate for player hands

          const inputs = [i,j];
          const outputs = player_action_model.forward(inputs);

          ((value_table, i, j, outputs) => {
            value_table[i] = value_table[i] || {};
            outputs.as1D().data().then((result) => {
              const action = result[0] > result[1] ? 'stand' : 'hit';
              console.log('value ready', action, inputs, result);
              value_table[i][j] = result;
            })

          })(value_table, i, j, outputs);


        }

      }


    }
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
});
