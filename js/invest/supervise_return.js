define(['tf','jquery'],(tf,$) => {
  //tf.logging.set_verbosity(tf.logging.DEBUG)
  return supervise_spy;

  async function supervise_spy() {
      // universe
      const universe = await create_close_universe_fs(['XLK']);

      const security = universe.XLK.slice(1,universe.XLK.length).reduce((accum, close) => {
         accum.close.push((close - accum.last) / accum.last)
         accum.last = close;
         return accum;
      }, {
        close: [],
        last : universe.XLK[0]
      }).close;
      const train = security.slice(0,3000);
      const validate = security.slice(3000, 4011);
      // const validate = universe.SPY.slice(2000,universe.SPY.length);

      console.log('universe', universe, train, validate)

      // model
      const model = tf.sequential();

      model.add(tf.layers.dense({units:5, inputShape:1, activation: 'relu'}));
      model.add(tf.layers.dense({units:5, activation: 'relu'}));
      model.add(tf.layers.dense({units:1, activation: 'tanh'}));
      model.compile({loss: 'meanSquaredError', optimizer: 'sgd', lr:0.5});

      // training
      const inputs_historical = train.map(close => [close]).slice(0,train.length - 1);

      const outputs_historical = train.map(close => [close]).slice(1,train.length);
      console.log('training', inputs_historical, outputs_historical)
      const training = await model.fit(tf.tensor2d(inputs_historical), tf.tensor2d(outputs_historical), {
        batchSize: 16,
        epochs: 1
      });

      // prediction
      const backtest = await validate.reduce(async (accum_p, close) => {
        const accum = await accum_p;
        if(accum.last) {
          accum.last.close = close;
          accum.history.push(accum.last);
        }

        const features = [close];
        const outputs = await model.predict(tf.tensor2d([features])).as1D().data();
        accum.last = {
          inputs: features[0],
          outputs: outputs[0]
        };
        // console.log('updating accum', accum, accum.last)
        return accum;
      }, {
        history: []
      })

      console.log('backtest', backtest)
      window.backtest = backtest;

      const pn = backtest.history.reduce((accum, entry) => {
        if(entry.outputs > 0 && entry.close > 0) {accum.tp.push(entry);}
        if(entry.outputs < 0 && entry.close > 0) {accum.fn.push(entry);}
        if(entry.outputs > 0 && entry.close < 0) {accum.fp.push(entry);}
        if(entry.outputs < 0 && entry.close < 0) {accum.tn.push(entry);}
        return accum;
      }, {
        tp: [], fp: [], tn: [], fn: []
      });

      console.log('positive/negative', pn)

  }


  function create_close_universe_fs(symbols) {
    return Promise.all(symbols.map(symbol => {
      const url = `../data/${symbol}.csv`;
      return $.ajax({url});
    })).then((responses) => {
      console.log('responses', responses)
      return responses.map(response => response.split('\n'));
    }).then((responses) => {
      // strip headers and get close price
      console.log('responses', responses)
      return responses.map(response => {
        response.shift();
        return response.map(day => day.split(',')[4]);
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
