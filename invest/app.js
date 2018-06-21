define(['jquery','./training_data','tf'],($, training_data, tf) => {
  console.log('tf', tf)
  return check_earnings;
});

/**
API:
https://github.com/sanko/Robinhood


Earnings
https://github.com/sanko/Robinhood/issues/29
*/

function check_past_earnigns(symbol) {
  return $.ajax({
    url: 'https://api.robinhood.com/marketdata/earnings/?symbol='+symbol // refactor to params
  }).then((response) => {
    console.log('past earning',symbol,response)
    return response;
  });
}
function check_upcoming_earnings() {
  return $.ajax({
    url: 'https://api.robinhood.com/marketdata/earnings/?range=5day'
  }).then((response) => {
    console.log('upcoming earning',response)
    return response;
  });
}
// 5 minute
// https://api.robinhood.com/quotes/historicals/?symbols=AAPL,MSFT&interval=5minute&span=week
// year
// https://api.robinhood.com/quotes/historicals/?symbols=AAPL,MSFT&interval=day&span=year
function historical_quote(symbols) {
  const symbols_string = symbols.join(',');
  return $.ajax({
    url: 'https://api.robinhood.com/quotes/historicals/?symbols='+symbols_string+'&interval=day&span=year'
  }).then((response) => {
    console.log('historical quote',symbols_string, response, JSON.stringify(response, 0 ,4))
    return response;
  });
}
const watchlist = [
  'SPY',
  'DIA',
  'QQQ',

  'XLK',
  'XLE',
  'XLV',
  'XLY',
  'XLP',
  'XLU',
  'XLF',
  'XLB',
  'XLI',

];
function check_earnings() {
  // check last earnings for those companies
  check_past_earnigns('AAPL');
  const historical_response = training_data.results ? Promise.resolve(training_data) : historical_quote(watchlist);
  historical_response.then((response) => {
    console.log('response', response);


  })
  // evaluate features leading up to the earning, and how did the company perform
    // relative spy performance
    // relative sector performance
    // relative comparable earning performer performance

  // identify pattern for sector concentration for earnings
    // look at upcoming earnings companies
    // identify from fundamentals matching sector



}
