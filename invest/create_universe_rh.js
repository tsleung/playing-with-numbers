define(['./rh'], function(rh) {
  return create_close_universe_rh;


  function create_close_universe_rh(symbols, interval) {
    interval = interval || 'daily';
    return rh.historical_quote(symbols).then((results) => {
      const close_price_universe = results.reduce((accum, result) => {
        accum[result.symbol] = result.historicals.map(entry => entry.close_price);
        return  accum;
      }, {});
      return close_price_universe;
    });
  }
})
