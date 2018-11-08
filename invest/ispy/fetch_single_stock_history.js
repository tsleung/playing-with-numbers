define(['jquery'], function($) {
  return create_close_universe_fs;
// weekly
//https://query1.finance.yahoo.com/v7/finance/download/SPY?period1=0&period2=9999999999&interval=1d&events=history&crumb=O5h4mS7BD7J
  async function create_close_universe_fs(symbol) {
    const interval = 'daily';

    const url = `/data/${interval}/${symbol}.csv`;
    return $.ajax({url}).then(response => response.split('\n')).then(response => {
        // pop empty last row
        response.pop();
        // reverse sort order to recent first
        response.reverse();
        // strip the header
        response.pop();
        // format each row
        return response // Date,Open,High,Low,Close,Adj Close,Volume
          .filter(day => day.split(',').length > 1) // get rid of invalid rows
          .map(day => day.split(',')) // convert row into arr
          .map(arr => ({
            date: arr[0],
            open: arr[1],
            high: arr[2],
            low: arr[3],
            close: arr[4],
            adj_close: arr[5],
            volume: arr[6],
          })); // convert row into obj
    });
  };
});
