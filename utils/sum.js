define([], () => {
  return (series) => {
    return series.reduce((accum, val) => accum + val, 0);
  };
});
