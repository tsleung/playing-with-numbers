define([
  'tf',
  '../invest/ispy/fetch_single_stock_history',
], function(tf,fetch_single_stock_history) {

  return async () => {
    console.log('rling',tf);
    const spy = await fetch_single_stock_history('SPY');
    const vix = await fetch_single_stock_history('VIX');
    console.log('spy', spy);
    console.log('vix', vix);
  };

});
