define([], () => {




      // checking if feature is useful
      (async function () {
        console.log('feature exploration','SPY')
        const universe = await create_close_universe_fs(['XLK']);
        const spy = universe['XLK'];
        const series = spy.slice(0,250*13)
          .map((val, i) => pct_change(spy[i+5], spy[i]) > .005 ? 1 : 0) //success/fail
        console.log('all spy', laplace(series), series, spy);
        const fib = [1,2,3,5,8,13,21,34,55,89];

        const pairs = fib.reduce((accum, backward_index) => {
            const vals = fib.slice(0,6).map((forward_index) => {
              const pair_run = series.map((change, i) => {
                const backward = laplace(series.slice(i, i+backward_index));
                const forward = laplace(series.slice(i - forward_index, i));
                const error = Math.pow(backward - forward, 2);
                return {
                  error,
                  forward_index,
                  backward,
                  forward,
                  backward_index
                };
              }).slice(200, series.length - 400);
              // TODO: add correlation of backward to forward as primary rank!


              function determine_correlation(pair_run) {
                const backwards = pair_run.map(val => val.backward)
                const forwards = pair_run.map(val => val.forward);
                const mean_backwards = mean(backwards);
                const mean_forwards = mean(forwards);

                const covariance = sum(pair_run.map(val => {
                  return (val.backward - mean_backwards)*(val.forward - mean_forwards);
                }));

                const correlation = covariance / Math.sqrt(
                  sum(backwards.map(val => Math.pow(val - mean_backwards,2))) *
                  sum(forwards.map(val => Math.pow(val - mean_forwards,2)))
                ,2);
                return correlation;
              }

              return {
                index: `${backward_index} - ${forward_index}`,
                correlation: determine_correlation(pair_run),
                error: sum(pair_run.map(val => val.error)),
                rolling_correlation: pair_run.map((val, i) => determine_correlation(pair_run.slice(i, i+50))).filter(val => !isNaN(val)),
                pair_run,
                backward_index,
                forward_index,
              };

            });
            return accum.concat(vals);
        }, []).sort((a,b) => b.correlation - a.correlation); // rank by most (un)correlated
        window.pairs = pairs;
        console.log('window.pairs', pairs)
        // pairs.forEach(pair => {
        //   // print.summary(pair.pair_run.map(val => val.error).sort(),`Error ${pair.backward_index} - ${pair.forward_index}`);
        //   print.summary(pair.pair_run.map(val => val.backward).sort(),`Backwards ${pair.backward_index} - ${pair.forward_index}`);
        //   print.summary(pair.pair_run.map(val => val.forward).sort(),`Forwards ${pair.backward_index} - ${pair.forward_index}`);
        // })
        // create lookback periods, create forward look periods
        // find the minimum error where the laplace rule of backwards indicates a period forwards
        // how much edge is it? does the period change over time? is it a curve?

        // we create a matrix of i lookback to j lookforward
      // });
      })();
});
