define([], () => {
  const bets = [
    {
      bet_size: 0.0,
      underlying: {
        symbol: 'SPY',
        price: 290.31,
      },
      option: {
        days_to_expiration: 4,
        strike: 292,
        price: 0.66,
      }
    }, {
      bet_size: 0.0,
      underlying: {
        symbol: 'IWM',
        price: 173.02,
      },
      option: {
        days_to_expiration: 4,
        strike: 174,
        price: 0.62,
      }
    },{
      bet_size: 0.0,
      underlying: {
        symbol: 'QQQ',
        price: 186.65,
      },
      option: {
        days_to_expiration: 4,
        strike: 188,
        price: 0.63,
      }
    },{
      bet_size: 0.005,
      underlying: {
        symbol: 'XLY',
        price: 116.49,
      },
      option: {
        days_to_expiration: 5,
        strike: 117.5,
        price: 0.37,
      }
    },
    {
      bet_size: 0.005,
      underlying: {
        symbol: 'XLV',
        price: 92.8,
      },
      option: {
        days_to_expiration: 5,
        strike: 93.5,
        price: 0.22,
      }
    },
    {
      bet_size: 0.005,
      underlying: {
        symbol: 'XLE',
        price: 75.02,
      },
      option: {
        days_to_expiration: 5,
        strike: 76,
        price: 0.23,
      }
    },
    {
      bet_size: 0.005,
      underlying: {
        symbol: 'XLF',
        price: 28.435,
      },
      option: {
        days_to_expiration: 5,
        strike: 28.5,
        price: 0.19,
      }
    }];
    return bets;
});
