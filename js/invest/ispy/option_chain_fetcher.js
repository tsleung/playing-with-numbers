define(['utils/pct_change'], function(pct_change) {
  const cache = {};
  return (symbol, options) => {
    cache[symbol] = cache[symbol] || fetch_option_chain(symbol, options);
    return cache[symbol];
  };

  // get up to date pricing for options
  function from_yahoo_finance_time(input) {
    const timezone_offset = new Date().getTimezoneOffset()*60*1000;
    return new Date(input * 1e3 + timezone_offset);
  }

  function option_chain (symbol) {
    const details = option_details(symbol);

    return Promise.all([
      // price
      details.then(detail => detail.optionChain.result[0].quote.regularMarketPrice),
      // iterate through expiration dates and fetch quotes
      details.then(response => {
        // console.log(response.optionChain.result[0].expirationDates.map(date => from_yahoo_finance_time(date)));
        return Promise.all(response.optionChain.result[0].expirationDates.slice(0,10).map(expiration_date => {
          return $.ajax({
            url: `https://query2.finance.yahoo.com/v7/finance/options/${symbol}?date=${expiration_date}`
          })
        }));
      })
    ]).then(([regularMarketPrice, options]) => {
      return options.reduce((accum, val) => {
        return Object.assign(accum,{
          calls: [...accum.calls, ...val.optionChain.result[0].options[0].calls],
          puts: [...accum.puts, ...val.optionChain.result[0].options[0].puts]
        });
      }, {regularMarketPrice, calls: [], puts: []});
    });

    function option_details(symbol) {
      return $.ajax({
        url: `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`
      }).then(response => {
        console.log('response', response);
        return response;
      });
    }
  }

  // https://stackoverflow.com/questions/29933608/how-to-calculate-the-total-days-between-two-selected-calendar-dates
  function getBusinessDatesCount(startDate, endDate) {
    var count = 0;
    var curDate = startDate;
    while (curDate <= endDate) {
        var dayOfWeek = curDate.getDay();
        if(!((dayOfWeek == 6) || (dayOfWeek == 0)))
           count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }

  function fetch_option_chain(symbol, options){
    options = options || {

    };
    return option_chain(symbol).then((resp) => {
      const regular_market_price = resp.regularMarketPrice;
      const withinTenPercentStrike = (option) => {
        // every X minutes, within P%
        // console.log(regular_market_price,option.strike,Math.abs(pct_change(regular_market_price, option.strike)) < .1)
        return Math.abs(pct_change(regular_market_price, option.strike)) < .1
          // && option.volume > 50
          // && (option.bid != 0 && option.ask != 0) &&
          && true;
      };
      const toExpectedReturn = (option) => {
        const strike = option.strike;
        const last_price = option.lastPrice;
        const volume = option.volume;
        const bid = option.bid;
        const ask = option.ask;
        const expiration = from_yahoo_finance_time(option.expiration);
        const trading_days = getBusinessDatesCount(new Date(), expiration);
        const breakeven_return = pct_change(regular_market_price, strike + last_price);
        // efective leverage, if the price moved 1%, equity would move 1%
        // with a 1% move, what does our option move?
        //const effective_leverage_after_breakeven = ((regular_market_price * 1.01) - (strike+last_price)) / last_price;
        return {
          expiration,
          breakeven_return,
          //effective_leverage_after_breakeven,
          strike,
          last_price,
          regular_market_price,
          trading_days,
          volume,
          bid,
          ask,
        };
      };
      const calls = resp.calls.filter(withinTenPercentStrike).map(toExpectedReturn);
      // console.table(calls)
      const puts = resp.puts.filter(withinTenPercentStrike).map(toExpectedReturn)
      return {calls,puts};
    });
  }
});
