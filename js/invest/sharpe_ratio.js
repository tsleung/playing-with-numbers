define(['utils/mean','utils/stdev'], (mean, stdev) => {
  return sharpe_ratio;

  function sharpe_ratio(interval) {
    return mean(interval) / stdev(interval);
  }
});
