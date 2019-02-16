define([], function() {

  return universe_to_pct_change;
  function universe_to_pct_change(universe, period) {
    const pct_change_universe = {};
    period = period || 1;
    for(var symbol in universe) {
      const historical = universe[symbol];
      pct_change_universe[symbol] = historical.map((value, index) => {
        return (historical[index+period] !== undefined) ?
          pct_change(historical[index+period],historical[index]) :
          undefined;
      }).filter(val => val !== undefined);
    }
    return pct_change_universe;
  }

})
