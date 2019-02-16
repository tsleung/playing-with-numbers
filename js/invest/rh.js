define(['jquery'], ($) => {
  const cache = {

  };
  //
  // console.log('next opts');
  // next_options('SPY').then(response => {
  //   console.log('next opts',response);
  // })

  return {
    historical_quote,
    options,
    fundamentals
  };

  function getNumWorkDays(startDate, endDate) {
      var numWorkDays = 0;
      var currentDate = new Date(startDate);
      while (currentDate <= endDate) {
          // Skips Sunday and Saturday
          if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
              numWorkDays++;
          }
          currentDate = currentDate.addDays(1);
      }
      return numWorkDays;
  }
  // fundamentals: https://api.robinhood.com/instruments/?symbol=symbol
  // option dates: https://api.robinhood.com/options/chains/c277b118-58d9-4060-8dc5-a3b5898955cb/
  // option by date: https://api.robinhood.com/options/instruments/?chain_id=c277b118-58d9-4060-8dc5-a3b5898955cb&expiration_dates=2018-08-29&state=active&tradability=tradable&type=call
  function next_options(symbol, num) {
    num = num || 5;
    return option_dates(symbol).then(response => {
      const instrument_id = response.id;
      return response.expiration_dates.slice(0, num).map(expiration_date => {
        return options(instrument_id, expiration_date);
      })

    }).then(arr => {
      return Promise.all(arr);
    });
  }

  function fundamentals(symbol) {
    const url = `https://api.robinhood.com/instruments/?symbol=${symbol}`;
    cache[url] = cache[url] || $.ajax({url});
    return cache[url];
  }

  function option_dates(symbol) {
    return fundamentals(symbol).then(response => {
      const instrument_id = response.results[0].tradable_chain_id;
      const url =  `https://api.robinhood.com/options/chains/${instrument_id}`;
      cache[url] = cache[url] || $.ajax({url});
      return cache[url];
    });
  }

  function options(instrument_id, date) {
    const url = `https://api.robinhood.com/options/instruments/?chain_id=${instrument_id}&expiration_dates=${date}&state=active&tradability=tradable&type=call`;
    cache[url] = cache[url] || $.ajax({url});
    return cache[url];
  }

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
      //console.log('historical quote',symbols_string, response, JSON.stringify(response, 0 ,4))
      return response.results;
    });
  }

  function check_earnings() {
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
});
