define(['jquery','utils/pct_change'], ($, pct_change) => {
  //const url = 'https://query2.finance.yahoo.com/v7/finance/options/spy?date=1545350400';
  const url = '/data/spy-option-chain-dec.json';
  const CURRENT_PRICE = 281;
  const MAX_STRIKE = CURRENT_PRICE*1.2;
  const MIN_STRIKE = CURRENT_PRICE*.8;

  const MAX_PRICE = 50;

  return async () => {
    const historical = await create_close_universe_fs(['SPY']);
    console.log('historical', historical);
    window.historical = historical;
    const three_day_return = historical_summary(historical['SPY']);
    console.log('three_day_return', three_day_return);
    window.three_day_return = three_day_return;

    const security = await $.ajax({url});
    const options = security.optionChain.result["0"].options["0"];
    const calls = create_graph(options.calls, 'call');
    const puts = create_graph(options.puts, 'put');
    window.options = options;
    $('body').append(`
      <style>
        .graph {position:relative;height:800px;}
        .point {font-size:8px;position:absolute;padding:1px;}
        .call {color: blue}
        .put {color: red}
      </style>
      <div class="graph">${puts}${calls}</div>
      `);
  };

  function create_graph(options, type) {
    return options.filter(option =>{
       return option.strike > MIN_STRIKE &&
        option.strike < MAX_STRIKE;
    }).map(option => {

      return create_point(option, type);
    }).reduce((accum, val) => {
      return accum + val;
    }, '');
  }

  function create_point(option, type) {
    //const strike_percentile =  option.strike / summary.max_strike * 100;
    const strike_percentile =  (option.strike-MIN_STRIKE) / (MAX_STRIKE-MIN_STRIKE) * 100;
    //const price_percentile = bidAskMid(option) / summary.max_price * 100;
    const price_percentile = bidAskMid(option) / MAX_PRICE * 100;
    return `<div title="${option.strike + ': '+ bidAskMid(option)}"
      class="point ${type}" style="bottom:${price_percentile}%;left:${strike_percentile}%;">
      ${option.strike + ': '+ bidAskMid(option)}
      </div>`;
  }


  function create_summary(options) {
    const summary = options.reduce((accum, option) => {
      const price = bidAskMid(option);
      const strike = option.strike;
      return {
        max_price: accum.max_price && accum.max_price > price ? accum.max_price : price,
        min_price: accum.min_price && accum.min_price < price ? accum.min_price : price,
        max_strike: accum.max_strike && accum.max_strike > strike ? accum.max_strike : strike,
        min_strike: accum.min_strike && accum.min_strike < strike ? accum.min_strike : strike
      }
    }, {});

    console.log('summary', summary);
    return summary;

  }
  function optionToCsv(option) {
    return [option.strike, bidAskMid(option), option.expiration, option.impliedVolatility].join(',');
  }

  function bidAskMid(option) {
    return (option.ask + option.bid) / 2;
  }

  function historical_summary(historical) {
    return historical.map((val, index) => {
      return index + 2 < historical.length ?
        pct_change(historical[index], historical[index+2]) :
        0;
    })
  }

  async function create_close_universe_fs(symbols) {
    return await Promise.all(symbols.map(symbol => {
      const url = `../data/${symbol}.csv`;
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

});
