define(['utils/mean','utils/sum'], (mean, sum) => {
  return sortino;
  function sortino(interval) {
    const avg = mean(interval);
    const penalty = Math.sqrt(sum(
      interval.filter(val => val < avg).map(val => Math.pow(val-avg, 2))
    ));
    return avg / penalty;
  }
});
