define('vix_thresholds',[
  './fetch_single_stock_history',
  './option_chain_fetcher',
], async function(
  fetch_historical,
  fetch_option_chain,
) {
  // create vix thresholds
  const vix = await fetch_historical('VIX');
  const thresholds = new Array(20).fill(0).map((n,index)=>index+10).map(threshold => {
    return vix.map((day,index) => ({
        index,
        valid: day.close > threshold - .5 && day.close < threshold + .5
      }))
      .filter(index_check => index_check.valid)
      .map(index_check => index_check.index);
  });
  return thresholds;
});

define('strategy',['utils/pct_change'],(pct_change)=>{
  return (arr) => {

    return arr.map((day, index) =>{
      //
    });
  };
});

define([
  './fetch_single_stock_history',
  './option_chain_fetcher',
  'strategy'
], function(
  fetch_historical,
  fetch_option_chain,
  strategy,
) {
    return carver;

    /**
     * At a given VIX at what price per strike is the option profitable
     */
    async function carver() {
      const securities = [
        'SPY',
        /*
        'QQQ',
        'XLK',
        'XLP',
        'XLF',
        'XLI',
        'XLY',
        'XLE',
        */
      ];

      // get current option prices
      const options = await Promise.all(securities.map(fetch_option_chain));


      const historical = await Promise.all(securities.map(fetch_historical));


      const max_valid_index = Math.min.apply(Math, historical.map(arr=>arr.length)) - 201;
      historical
        .map(arr => arr.slice(0, max_valid_index)) // cut down to max
        .map(strategy);

      // monte carlo option prices against historical data
      // optionally improve sophistication in monte carlo


    }
});
