define(['jquery'], function($) {
  return create_close_universe_fs;
// weekly
//https://query1.finance.yahoo.com/v7/finance/download/SPY?period1=0&period2=9999999999&interval=1d&events=history&crumb=O5h4mS7BD7J
  async function create_close_universe_fs(symbols, interval) {
    interval = interval || 'daily';
    return await Promise.all(symbols.map(symbol => {
      const url = `../data/${interval}/${symbol}.csv`;
      return $.ajax({url});
    })).then((responses) => {
      console.log('responses', responses)
      return responses.map(response => response.split('\n'));
    }).then((responses) => {
      // strip headers and get close price
      console.log('responses', responses)
      return responses.map(response => {
        // reverse sort order to recent first
        response.reverse();
        // strip the header
        response.pop();
        // format each row
        return response
          .filter(day => day.split(',').length > 1) // get rid of invalid rows
          .map(day => day.split(',')[4]); // get close price
      });
    }).then(prices => {
      // reduce by symbols into universe
      const universe = {};
      for(var i = 0; i < symbols.length; i++){
        universe[symbols[i]] = prices[i];
      }
      return universe;
    });
  }


  function generate_resource_links (symbols, cookie) {
    symbols = symbols || ['XLK','XLV','XLF','XLP','XLY','XLE','XLU'];
    cookie = cookie || '8K7MxdAySpG';
    window.document.body.innerHTML = symbols.map(symbol => {
    return `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=0&period2=9999999999&interval=1wk&events=history&crumb=${cookie}`;
  }).map(href => {return `<a target="_blank" href="${href}">${href}</a><br/>`})
    .reduce((accum, val) => {return `${accum}${val}`},'');

  }
})