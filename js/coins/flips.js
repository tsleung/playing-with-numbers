define([], function() {

  return () => {
    const result = flip_test(
      .6, // 60% chance of heads
      1.5, // when we win, increase to 150%
      .5, // when we lose, reduce to 50%
      500, // 500 iterations
      .05 // how much we bet, 10%
    );
    console.log('flip test', result.balance, result.history)

  };

});
function flip_test(
  heads_rate,
  change_on_heads,
  change_on_tails,
  iterations,
  bet_size
) {
    const flips = new Array(iterations).fill(0).map(x => {
      return Math.random() < heads_rate ? 1: 0;
    });

    const backtest = flips.reduce((accum, flip) => {
      const balance = flip ?
        accum.balance + (bet_size * change_on_heads) :
        accum.balance - (bet_size * change_on_tails);
      const history = [...accum.history, balance];

      return {balance, history};
    }, {balance: 1, history: []})

    return backtest;
}
