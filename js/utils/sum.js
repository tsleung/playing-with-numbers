define([], () => {
  if(sum([1,2,3]) !== 6) { throw new Error('sum is broken');}
  return sum;
  function sum(series) {
    return series.reduce((accum, val) => accum + val, 0);
  }
});
