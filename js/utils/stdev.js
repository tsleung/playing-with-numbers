define(['./mean','./sum'], (mean, sum) => {
  return stdev;

  function stdev(series) {
    const avg = mean(series);
    const mean_squared_error = series.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(sum(mean_squared_error) / (series.length - 1));
  }

  (
    stdev([0,0,0]) == 0,
    stdev([1,1,1]) == 0
  ) ? true : (() =>{ throw new Error('stdev is wrong')})();

});
